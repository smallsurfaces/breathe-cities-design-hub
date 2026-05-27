/**
 * AnnotationLayer — Portable Spatial Annotation Overlay
 *
 * Adds a freeze-frame annotation system to any viewport. Reviewers toggle
 * annotation mode, click to place numbered pins, write named comments, and
 * mark items as resolved. Annotations persist in localStorage.
 *
 * Key behaviours:
 * - Annotation mode: inset border ring signals freeze; click capture overlay active
 * - Pins: numbered, normalised coordinate storage (0–1 viewport fractions)
 * - Cards: self-positioning to avoid viewport edges; mobile bottom-sheet below mobileBreakpoint
 * - Persistence: localStorage keyed by storageKey prop
 * - Map freeze: pass mapAdapter to disable/re-enable map interaction handlers
 *
 * Ported from: design/prototypes/air-quality-map/src/lib/AnnotationLayer.tsx
 *
 * Stage 1 generalisation (element-anchored, machine-readable comments):
 * - Pluggable persistence: pass `persistence` to swap the storage backend. DEFAULT is the
 *   original localStorage load/save, so MAP builds (which omit it) are unchanged.
 * - anchorMode='element': clicks anchor a comment to the DOM element under the cursor; the
 *   pin renders from the resolved element's LIVE rect and re-anchors on reload/resize.
 *   Falls back to a muted "last-known-position" pin when the element can't be re-found.
 * - Default anchorMode='viewport' preserves the legacy normalised-fraction behaviour.
 *
 * @see AnnotationLayer.types.ts for prop types
 * @see ../../lib/comments/anchor for captureAnchor/resolveAnchor (single source)
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare } from 'lucide-react'
import type { Annotation, AnnotationLayerConfig, ElementAnchor } from './AnnotationLayer.types'
import { captureAnchor, resolveAnchor } from '../../lib/comments/anchor'

// ─── Element-mode hit-test helper ─────────────────────────────────────────────

/** Max characters of element text shown in the live capture label (UI cue only). */
const HOVER_LABEL_TEXT_MAX = 40

/**
 * Resolve the real page element under a pointer position, seeing PAST the annotation
 * click-capture overlay. The overlay is a fixed full-viewport div marked with
 * `data-al-overlay`; elementsFromPoint returns the full hit-test stack, so we skip the
 * overlay (and anything else carrying that marker) and return the first underlying
 * HTMLElement. Single source of truth so the hover highlight and the click capture always
 * agree on which element is targeted. Pure DOM read; returns null when nothing meaningful
 * sits under the cursor.
 */
function resolveOverlayTarget(clientX: number, clientY: number): HTMLElement | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  const target = stack.find(
    (node) => node instanceof HTMLElement && node.getAttribute('data-al-overlay') === null,
  )
  return target instanceof HTMLElement ? target : null
}

/**
 * Build the live capture label for a hovered element, e.g. `p · "Poland's capital…"`.
 * Text is derived from the element's textContent (whitespace-collapsed, trimmed) and
 * clamped, consistent with how anchor.ts builds the stored nearbyText — so the label
 * previews what the saved comment will record. No emoji; caller styles with --al-* tokens.
 */
function buildHoverLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (text === '') return tag
  const clamped = text.length > HOVER_LABEL_TEXT_MAX ? `${text.slice(0, HOVER_LABEL_TEXT_MAX)}…` : text
  return `${tag} · "${clamped}"`
}

// ─── AnnotationLayer ──────────────────────────────────────────────────────────

export default function AnnotationLayer({
  storageKey,
  label,
  mapAdapter,
  onEnterMode,
  onExitMode,
  mobileBreakpoint = 768,
  anchorMode = 'viewport',
  persistence,
  buildId,
  route,
}: AnnotationLayerConfig): React.ReactElement {
  // True when this instance anchors comments to DOM elements (non-map builds).
  // Map builds omit anchorMode → 'viewport' → all element-mode branches are inert.
  const elementMode = anchorMode === 'element'

  const [isActive, setIsActive] = useState<boolean>(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  // SSR/portal guard. The viewport-level UI (toggle, overlay, pins, cards) is portalled to
  // document.body so it escapes the host <header> it is mounted inside — without this, the
  // header's `pointer-events: none` dim rule (see <style> below) is INHERITED by the
  // annotation UI and every real click passes straight through it. createPortal needs a real
  // DOM node, so we render nothing on the server and flip this true after mount on the client.
  const [mounted, setMounted] = useState<boolean>(false)
  // pendingClick stores raw viewport pixels (local only, never persisted).
  // In element mode it also carries the resolved anchor captured at click time.
  const [pendingClick, setPendingClick] = useState<{ x: number; y: number } | null>(null)
  const pendingAnchorRef = useRef<ElementAnchor | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState<string>('')
  const [draftName, setDraftName] = useState<string>('')
  const [isMobile, setIsMobile] = useState<boolean>(false)
  // Re-render trigger for element-mode pins: their on-screen position derives from a LIVE
  // getBoundingClientRect, so we bump this on scroll/resize to recompute pin positions.
  const [, setLiveTick] = useState<number>(0)

  // Live hover preview (element mode only). While the reviewer is actively selecting — mode
  // active, no card open — we draw a highlight box around the element under the cursor and a
  // label naming what will be captured. `hover` holds the current box rect + label; null when
  // nothing is hovered or hover is suppressed. Map builds never set this (gated by elementMode).
  const [hover, setHover] = useState<{ rect: DOMRect; label: string } | null>(null)
  // rAF throttle for mousemove: latest pointer coords live in a ref and a single animation
  // frame is scheduled per burst, so elementsFromPoint + rect reads run at most once per frame
  // rather than on every raw mousemove event (which would thrash layout).
  const hoverFrameRef = useRef<number | null>(null)
  const hoverPointRef = useRef<{ x: number; y: number } | null>(null)

  // Measured card heights to prevent overflow-guard using hardcoded estimates
  const newCardRef = useRef<HTMLDivElement>(null)
  const editCardRef = useRef<HTMLDivElement>(null)
  const [newCardHeight, setNewCardHeight] = useState<number>(220)
  const [editCardHeight, setEditCardHeight] = useState<number>(280)

  // ── Mark mounted (client only) ────────────────────────────────────────────────
  // Gate for the document.body portal — see `mounted` declaration above. Runs once after
  // the first client render so server output and first client render match (no portal on
  // the server), then the portal mounts.

  useEffect(() => {
    setMounted(true)
  }, [])

  // ── Responsive check ────────────────────────────────────────────────────────
  // Side effect: attaches resize event listener to window

  useEffect(() => {
    const check = (): void => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [mobileBreakpoint])

  // ── Live-rect re-render for element-anchored pins ─────────────────────────────
  // Element pins are positioned from a LIVE getBoundingClientRect, so they must be
  // recomputed when the page scrolls or resizes. Only wired while annotation mode is
  // active in element mode (no listeners on map builds / when inactive).
  // Side effect: attaches scroll (capture) + resize listeners to window.

  useEffect(() => {
    if (!elementMode || !isActive) return
    const bump = (): void => setLiveTick((t) => t + 1)
    // capture:true catches scrolls on nested scroll containers, not just window.
    window.addEventListener('scroll', bump, true)
    window.addEventListener('resize', bump)
    return () => {
      window.removeEventListener('scroll', bump, true)
      window.removeEventListener('resize', bump)
    }
  }, [elementMode, isActive])

  // ── Hover-preview suppression + rAF cleanup ───────────────────────────────────
  // The hover preview is only valid while actively selecting: element mode, mode active, and
  // no card open. Whenever that stops being true (mode exits, a card opens, build is not an
  // element build), cancel any queued animation frame and clear the box. This covers state
  // changes that happen without a mouse event firing (e.g. opening a card by clicking a pin),
  // so a stale highlight can never persist behind a card.
  // Side effect: cancels a pending requestAnimationFrame.

  const selecting = elementMode && isActive && pendingClick === null && editingId === null

  useEffect(() => {
    if (selecting) return
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current)
      hoverFrameRef.current = null
    }
    hoverPointRef.current = null
    setHover(null)
  }, [selecting])

  // ── Hover rAF unmount cleanup ─────────────────────────────────────────────────
  // The selecting-suppression effect above only cancels a queued frame when `selecting`
  // flips false. If the component unmounts while still selecting (e.g. route change with
  // annotation mode active), a frame could remain queued and fire its setHover after the
  // component is gone. This dedicated unmount-only cleanup cancels any pending frame.
  // Side effect: cancels a pending requestAnimationFrame on unmount.

  useEffect(() => () => {
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current)
    }
  }, [])

  // ── Load on mount ───────────────────────────────────────────────────────────
  // Two paths, selected by whether a `persistence` adapter was supplied:
  //   - persistence present (non-map builds): load via the adapter, keyed by buildId.
  //     Side effect: async adapter call (which itself reads localStorage cache + network).
  //   - persistence absent (DEFAULT — map builds): the original localStorage logic, keyed
  //     by storageKey, including legacy pixel→fraction migration. Behaviour unchanged.
  // `hasLoaded` gates the save effect so the initial load does not immediately echo back.
  const [hasLoaded, setHasLoaded] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false

    if (persistence !== undefined && buildId !== undefined) {
      // Adapter path — async. Guarded against unmount/build change via `cancelled`.
      persistence
        .load(buildId)
        .then((loaded) => {
          if (cancelled) return
          setAnnotations(loaded)
          setHasLoaded(true)
        })
        .catch(() => {
          if (cancelled) return
          // Adapter load failed entirely — start empty rather than crash.
          setHasLoaded(true)
        })
      return () => {
        cancelled = true
      }
    }

    // Default path — localStorage, keyed by storageKey (map-build behaviour, unchanged).
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        const migrated = parsed.map((a: Annotation) => ({
          ...a,
          authorName: a.authorName ?? '',
          resolved: a.resolved ?? false,
          // Migrate legacy pixel coords to normalised fractions
          x: a.x > 1 ? a.x / window.innerWidth : a.x,
          y: a.y > 1 ? a.y / window.innerHeight : a.y,
        }))
        setAnnotations(migrated)
      }
    } catch { /* ignore corrupt data */ }
    setHasLoaded(true)
    return () => {
      cancelled = true
    }
  }, [storageKey, persistence, buildId])

  // ── Persist on change ───────────────────────────────────────────────────────
  // Mirror of the load split. Skipped until the initial load completes so we never
  // overwrite stored data with the empty initial state.
  //   - persistence present: delegate to the adapter (fire-and-forget; it caches + POSTs).
  //   - persistence absent (DEFAULT — map builds): original localStorage write, unchanged.
  //     Wrapped in try/catch (Safari private mode throws QuotaExceededError on setItem).

  useEffect(() => {
    if (!hasLoaded) return

    if (persistence !== undefined && buildId !== undefined) {
      persistence.save(buildId, annotations)
      return
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(annotations))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[AnnotationLayer] localStorage.setItem failed — annotations will not persist across sessions.', err)
      }
    }
  }, [annotations, storageKey, persistence, buildId, hasLoaded])

  // ── Body class toggle for freeze state ─────────────────────────────────────
  // Side effect: adds/removes 'annotation-active' class on document.body.
  // The class is used by the <style> block below to dim host UI elements.

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('annotation-active')
    } else {
      document.body.classList.remove('annotation-active')
    }
    return () => {
      document.body.classList.remove('annotation-active')
    }
  }, [isActive])

  // ── Measure new card height after render ────────────────────────────────────
  // Required for overflow-guard in getCardPosition — avoids hardcoded height estimates.

  useEffect(() => {
    if (newCardRef.current) {
      setNewCardHeight(newCardRef.current.offsetHeight)
    }
  }, [pendingClick, draftName, draftText])

  // ── Measure edit card height after render ───────────────────────────────────

  useEffect(() => {
    if (editCardRef.current) {
      setEditCardHeight(editCardRef.current.offsetHeight)
    }
  }, [editingId, draftName, draftText])

  // ── handleCancel ────────────────────────────────────────────────────────────

  const handleCancel = useCallback((): void => {
    setPendingClick(null)
    pendingAnchorRef.current = null
    setEditingId(null)
    setDraftText('')
    setDraftName('')
    // Drop any live hover preview so it never lingers after a card is dismissed/escaped.
    setHover(null)
    hoverPointRef.current = null
  }, [])

  // ── Escape key listener ─────────────────────────────────────────────────────
  // Side effect: attaches keydown listener to window for Escape dismissal.

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCancel])

  // ── enterAnnotationMode ─────────────────────────────────────────────────────
  // Freeze: disable map interaction and signal annotation mode to host.
  // mapAdapter.freeze() is optional — for non-map use cases, omit mapAdapter.
  // onEnterMode fires after freeze so the host can clear popups/tooltips.

  const enterAnnotationMode = (): void => {
    setIsActive(true)
    // Freeze the underlying map/interactive layer if an adapter is provided
    mapAdapter?.freeze()
    // Notify the host — host is responsible for clearing its own UI state
    onEnterMode?.()
  }

  // ── exitAnnotationMode ──────────────────────────────────────────────────────
  // Unfreeze: restore map interaction and notify host via onExitMode callback.

  const exitAnnotationMode = (): void => {
    handleCancel()
    // Unfreeze the underlying map/interactive layer
    mapAdapter?.unfreeze()
    setIsActive(false)
    onExitMode?.()
  }

  // ── handleOverlayClick ──────────────────────────────────────────────────────
  // Guard: if a card is already open, cancel it instead of opening a new one.
  // This prevents data loss when the user clicks outside an unsaved card.

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (pendingClick !== null || editingId !== null) {
      handleCancel()
      return
    }

    // Element mode: find the DOM element under the cursor and capture a durable anchor.
    // resolveOverlayTarget sees PAST the click-capture overlay (shared with the hover
    // highlight, so the box the reviewer saw and the element captured are the same one).
    if (elementMode) {
      const target = resolveOverlayTarget(e.clientX, e.clientY)
      if (target === null) {
        // Nothing meaningful under the cursor — ignore the click rather than pin to nothing.
        return
      }
      pendingAnchorRef.current = captureAnchor(target)
    }

    setPendingClick({ x: e.clientX, y: e.clientY })
    setDraftText('')
    setDraftName('')
    // Selecting is done — drop the live hover preview while the card is open.
    setHover(null)
    hoverPointRef.current = null
  }

  // ── handleOverlayMouseMove (element mode only) ──────────────────────────────
  // Live hover preview: as the cursor moves over the frozen page, highlight the element it
  // would pin to and show a label naming what will be captured. Throttled to one compute per
  // animation frame — elementsFromPoint + getBoundingClientRect on every raw mousemove would
  // thrash layout. The latest pointer coords are stashed in a ref; a single rAF is scheduled
  // per burst and reads those coords when it runs (so we always resolve the freshest point).
  // Inert unless element mode is active and no card is open (selecting, not editing).

  const handleOverlayMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (!elementMode) return
    hoverPointRef.current = { x: e.clientX, y: e.clientY }
    if (hoverFrameRef.current !== null) return // a frame is already queued for this burst
    hoverFrameRef.current = window.requestAnimationFrame(() => {
      hoverFrameRef.current = null
      const point = hoverPointRef.current
      if (point === null) return
      const target = resolveOverlayTarget(point.x, point.y)
      if (target === null) {
        setHover(null)
        return
      }
      // Live rect so the box tracks the element exactly (mirrors the pin/edit-ring approach).
      setHover({ rect: target.getBoundingClientRect(), label: buildHoverLabel(target) })
    })
  }, [elementMode])

  // ── handleOverlayMouseLeave ─────────────────────────────────────────────────
  // Clear the hover preview the moment the cursor leaves the capture overlay so a stale box
  // never lingers off-target.

  const handleOverlayMouseLeave = useCallback((): void => {
    setHover(null)
    hoverPointRef.current = null
  }, [])

  // ── handleSave (new annotation) ─────────────────────────────────────────────
  // Store x/y as normalised viewport fractions (0–1) so pin positions survive resize.

  const handleSave = (): void => {
    if (pendingClick === null || draftText.trim() === '') return

    // Common normalised click position — used directly for viewport pins and kept on
    // element pins as a positional backstop alongside the anchor.
    const base: Annotation = {
      id: Date.now().toString(),
      // Normalise raw pixel click position to 0–1 viewport fraction
      x: pendingClick.x / window.innerWidth,
      y: pendingClick.y / window.innerHeight,
      text: draftText.trim(),
      authorName: draftName.trim(),
      createdAt: Date.now(),
      resolved: false,
    }

    // Element mode: attach the durable anchor captured at click time + Stage-1 metadata.
    if (elementMode && pendingAnchorRef.current !== null) {
      const anchor = pendingAnchorRef.current
      const elementAnnotation: Annotation = {
        ...base,
        kind: 'element',
        anchor,
        buildId,
        route,
        capturedText: anchor.nearbyText,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        schemaVersion: 2,
      }
      setAnnotations(prev => [...prev, elementAnnotation])
    } else {
      // Viewport / legacy behaviour (map builds) — unchanged shape.
      setAnnotations(prev => [...prev, base])
    }

    setPendingClick(null)
    pendingAnchorRef.current = null
    setDraftText('')
    setDraftName('')
  }

  // ── handleEditSave ──────────────────────────────────────────────────────────

  const handleEditSave = (): void => {
    if (editingId === null || draftText.trim() === '') return
    setAnnotations(prev =>
      prev.map(a =>
        a.id === editingId
          ? { ...a, text: draftText.trim(), authorName: draftName.trim() }
          : a
      )
    )
    setEditingId(null)
    setDraftText('')
    setDraftName('')
  }

  // ── handleDelete ────────────────────────────────────────────────────────────

  const handleDelete = (): void => {
    if (editingId === null) return
    setAnnotations(prev => prev.filter(a => a.id !== editingId))
    setEditingId(null)
    setDraftText('')
    setDraftName('')
  }

  // ── Live pin position resolver ────────────────────────────────────────────────
  // Resolves where a pin should currently draw, in raw viewport pixels.
  //  - element pins: resolveAnchor → live rect centre when the element is re-found
  //    (resolved:true, el set so the card can draw a highlight ring). When the element
  //    cannot be re-found, falls back to the stored normalised box centre, else stored
  //    x/y (resolved:false → render a MUTED "last-known-position" pin).
  //  - viewport/legacy pins: stored normalised x/y → pixels (always resolved:true).
  // Wrapped so a single bad anchor never throws during render.

  type PinPosition = { x: number; y: number; resolved: boolean; el: HTMLElement | null }

  function getPinPosition(annotation: Annotation): PinPosition {
    // Legacy / viewport pins: normalised fraction → pixels. Always positioned.
    if (annotation.kind !== 'element' || annotation.anchor === undefined) {
      return {
        x: annotation.x * window.innerWidth,
        y: annotation.y * window.innerHeight,
        resolved: true,
        el: null,
      }
    }

    try {
      const el = resolveAnchor(annotation.anchor)
      if (el !== null) {
        const rect = el.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          resolved: true,
          el,
        }
      }
    } catch {
      /* fall through to last-known-position fallback below */
    }

    // Element not found — last-known-position from stored box, else stored x/y.
    const box = annotation.anchor.box
    if (box !== undefined) {
      return {
        x: (box.x + box.w / 2) * window.innerWidth,
        y: (box.y + box.h / 2) * window.innerHeight,
        resolved: false,
        el: null,
      }
    }
    return {
      x: annotation.x * window.innerWidth,
      y: annotation.y * window.innerHeight,
      resolved: false,
      el: null,
    }
  }

  // ── Card position helper ────────────────────────────────────────────────────
  // Positions the annotation card to avoid viewport edges.
  // anchorX and anchorY are raw viewport pixels (converted from normalised fractions before calling).
  // On mobile (below mobileBreakpoint), cards anchor to the bottom of the screen instead.

  function getCardPosition(anchorX: number, anchorY: number, cardHeight: number): React.CSSProperties {
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: '80px',
        left: '1rem',
        right: '1rem',
        width: 'auto',
      }
    }
    let left = anchorX + 20
    let top = anchorY - 36
    if (anchorX + 20 + 240 > window.innerWidth - 16) left = anchorX - 260
    if (anchorY - 36 + cardHeight > window.innerHeight - 16) top = anchorY - cardHeight
    return { position: 'fixed', left, top, width: '240px', zIndex: 110 }
  }

  // ── formatDate utility ───────────────────────────────────────────────────────

  const formatDate = (ts: number): string =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts))

  // ── Shared card styles ───────────────────────────────────────────────────────
  // Uses --al-* CSS custom properties. Map your project tokens to --al-* in globals.css.

  const cardStyle: React.CSSProperties = {
    background: 'var(--al-overlay-bg)',
    border: '1px solid var(--al-overlay-border)',
    borderRadius: 'var(--al-radius-card)',
    padding: '0.75rem 1rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 110,
    fontFamily: 'var(--al-font)',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '72px',
    resize: 'none',
    background: 'var(--al-input-bg)',
    border: '1px solid var(--al-input-border)',
    borderRadius: 'var(--al-radius-input)',
    color: 'var(--al-text)',
    fontFamily: 'var(--al-font)',
    fontSize: '0.8rem',
    padding: '0.5rem 0.625rem',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: '0.5rem',
    display: 'block',
  }

  const nameInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--al-input-bg)',
    border: '1px solid var(--al-input-border)',
    borderRadius: 'var(--al-radius-input)',
    color: 'var(--al-text)',
    fontFamily: 'var(--al-font)',
    fontSize: '0.8rem',
    padding: '0.5rem 0.625rem',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: '0.5rem',
    display: 'block',
    height: '32px',
  }

  const saveButtonStyle = (disabled: boolean): React.CSSProperties => ({
    background: 'var(--al-brand)',
    color: 'var(--al-white)',
    border: 'none',
    borderRadius: 'var(--al-radius-input)',
    height: '32px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    fontFamily: 'var(--al-font)',
  })

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  }

  const cardLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--al-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--al-muted)',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '2px 4px',
    fontFamily: 'var(--al-font)',
  }

  // ── Inline toggle styles ──────────────────────────────────────────────────────
  // The toggle is no longer a position:fixed pill in the portaled viewportUI — it now
  // renders INLINE in this component's in-tree return (see render below), so it sits
  // naturally inside the host PrototypeHeader bar (right slot for non-map builds; the
  // commentSlot for map builds). Styled to match the header's "Back to hub" Link
  // aesthetic: rounded, bordered, text-xs, px-3 py-1.5. Inactive = bordered "Comments";
  // active = filled brand "Done annotating". --al-* tokens only (no hardcoded hex).
  const inlineToggleStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.375rem',
    borderRadius: 'var(--al-radius-input)',
    padding: '0.375rem 0.75rem',
    height: '32px',
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1,
    cursor: 'pointer',
    fontFamily: 'var(--al-font)',
    transition: 'background-color 120ms ease, color 120ms ease, border-color 120ms ease',
    border: isActive ? '1px solid var(--al-brand)' : '1px solid var(--al-overlay-border)',
    background: isActive ? 'var(--al-brand)' : 'transparent',
    color: isActive ? 'var(--al-white)' : 'var(--al-muted)',
  }

  // ─── Viewport UI (portalled to document.body) ─────────────────────────────────

  // The viewport-level UI is portalled to document.body (see render below). The TOGGLE is
  // NO LONGER part of this block — it renders inline in the in-tree return so it sits inside
  // the host PrototypeHeader bar. Everything that must escape the header's stacking context
  // and overlay the frozen page (freeze ring, click-capture overlay, highlight ring, hover
  // preview, pins, cards) stays here and stays portalled to document.body.
  const viewportUI = (
    <>
      {/* ── Freeze border ring ──────────────────────────────────────────────── */}
      {/* Visual signal that annotation mode is active and the viewport is frozen */}
      {isActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            border: '2px solid var(--al-brand)',
            pointerEvents: 'none',
            zIndex: 90,
          }}
        />
      )}

      {/* ── Annotation mode overlays ────────────────────────────────────────── */}
      {isActive && (
        <>
          {/* Click capture overlay — z-index 100, below pins (101) and toggle pill (110).
              data-al-overlay marks it so element-mode hit-testing (elementsFromPoint)
              can see PAST the overlay to the real page element under the cursor. */}
          <div
            data-al-overlay=""
            onClick={handleOverlayClick}
            // Hover handlers only in element mode — map/viewport builds attach neither, so
            // they are entirely unchanged (no mousemove work, no behaviour difference).
            onMouseMove={elementMode ? handleOverlayMouseMove : undefined}
            onMouseLeave={elementMode ? handleOverlayMouseLeave : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              cursor: 'crosshair',
            }}
          />

          {/* ── Highlight ring (element mode) ──────────────────────────────────────
              While an element pin's card is open and its element is re-found, draw a ring
              around the live element rect so the reviewer sees exactly what is anchored.
              Reuses the brand colour; muted treatment is handled on the pin itself. */}
          {elementMode && editingId !== null && (() => {
            const editing = annotations.find(a => a.id === editingId)
            if (editing === undefined || editing.kind !== 'element') return null
            const pos = getPinPosition(editing)
            if (pos.el === null) return null
            const rect = pos.el.getBoundingClientRect()
            return (
              <div
                aria-hidden="true"
                style={{
                  position: 'fixed',
                  left: rect.left - 3,
                  top: rect.top - 3,
                  width: rect.width + 6,
                  height: rect.height + 6,
                  border: '2px solid var(--al-brand)',
                  borderRadius: 'var(--al-radius-input)',
                  // Neutral soft glow (matches the file's rgba(0,0,0,...) shadow convention);
                  // the brand colour is carried by the border, which uses the --al-brand token.
                  boxShadow: '0 0 0 3px rgba(0,0,0,0.10)',
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              />
            )
          })()}

          {/* ── Live hover highlight + capture label (element mode) ──────────────────
              While actively selecting (no card open), draw a box around the element under
              the cursor and a label naming what will be captured, so the reviewer can
              pinpoint exactly what they are about to pin BEFORE they click. The box reuses
              the on-open edit-ring visual (same --al-brand border, ±3/±6 inset). Both the
              box and label are pointer-events:none so they never intercept the click. */}
          {selecting && hover !== null && (() => {
            const { rect, label } = hover
            // Label sits just above the box; flip below when the box hugs the top edge so it
            // never clips off-screen. Horizontal start clamps to the viewport left margin.
            const labelAbove = rect.top - 3 >= 24
            const labelLeft = Math.max(8, rect.left - 3)
            return (
              <React.Fragment>
                <div
                  aria-hidden="true"
                  style={{
                    position: 'fixed',
                    left: rect.left - 3,
                    top: rect.top - 3,
                    width: rect.width + 6,
                    height: rect.height + 6,
                    border: '2px solid var(--al-brand)',
                    borderRadius: 'var(--al-radius-input)',
                    boxShadow: '0 0 0 3px rgba(0,0,0,0.10)',
                    pointerEvents: 'none',
                    zIndex: 100,
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'fixed',
                    left: labelLeft,
                    top: labelAbove ? rect.top - 3 - 22 : rect.top - 3 + rect.height + 6 + 4,
                    maxWidth: 'min(360px, 70vw)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    background: 'var(--al-brand)',
                    color: 'var(--al-white)',
                    border: '1px solid var(--al-overlay-border)',
                    borderRadius: 'var(--al-radius-input)',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    fontFamily: 'var(--al-font)',
                    lineHeight: 1.4,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                    zIndex: 102,
                  }}
                >
                  {label}
                </div>
              </React.Fragment>
            )
          })()}

          {/* Pins — position derives from getPinPosition (live element rect when element
              mode + resolved; stored normalised coords otherwise). Unresolved element
              pins render MUTED as a "last-known-position" marker. */}
          {annotations.map((annotation, index) => {
            const pos = getPinPosition(annotation)
            // A pin is muted when the comment is resolved OR (element mode) its anchor
            // could not be re-found — both reuse the muted token + reduced opacity.
            const lostAnchor = annotation.kind === 'element' && !pos.resolved
            const muted = annotation.resolved || lostAnchor
            return (
              <div
                key={annotation.id}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation()
                  setEditingId(annotation.id)
                  setPendingClick(null)
                  pendingAnchorRef.current = null
                  setDraftText(annotation.text)
                  setDraftName(annotation.authorName ?? '')
                }}
                style={{
                  position: 'fixed',
                  // Live (element) or stored (viewport) position, centred on the pin head.
                  left: pos.x - 14,
                  top: pos.y - 36,
                  zIndex: 101,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: 'scale(1)',
                  transition: 'transform 120ms ease',
                  opacity: muted ? 0.4 : 1,
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.transform = 'scale(1.15)'
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {/* Circle — muted (resolved or lost anchor) uses the muted token. */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: muted ? 'var(--al-muted)' : 'var(--al-brand)',
                    border: '2px solid var(--al-white)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--al-white)',
                    fontFamily: 'var(--al-font)',
                  }}
                >
                  {index + 1}
                </div>
                {/* Stem — reflects muted state */}
                <div
                  style={{
                    width: 1,
                    height: 8,
                    background: muted ? 'var(--al-muted)' : 'var(--al-brand)',
                  }}
                />
              </div>
            )
          })}

          {/* Comment input card (new) */}
          {/* ref attached — measured height passed to getCardPosition for overflow guard */}
          {pendingClick !== null && (
            <div
              ref={newCardRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                ...cardStyle,
                ...getCardPosition(pendingClick.x, pendingClick.y, newCardHeight),
              }}
            >
              <div style={cardHeaderStyle}>
                <span style={cardLabelStyle}>Add comment</span>
                <button
                  onClick={handleCancel}
                  aria-label="Cancel"
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>
              {/* stopPropagation prevents keydown from bubbling to the overlay */}
              <input
                type="text"
                autoFocus
                value={draftName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') handleCancel()
                }}
                placeholder="Your name"
                style={nameInputStyle}
              />
              <textarea
                value={draftText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraftText(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') handleCancel()
                }}
                placeholder="Type your comment..."
                style={textareaStyle}
              />
              <button
                onClick={handleSave}
                disabled={draftText.trim() === ''}
                style={{
                  ...saveButtonStyle(draftText.trim() === ''),
                  width: '100%',
                }}
              >
                Save
              </button>
            </div>
          )}

          {/* Edit card */}
          {/* ref attached — measured height passed to getCardPosition for overflow guard */}
          {editingId !== null && (() => {
            const ann = annotations.find(a => a.id === editingId)
            if (ann === undefined) return null
            // Derive pin number from array index for display in header
            const editIndex = annotations.findIndex(a => a.id === editingId)
            // Position the card at the pin's LIVE location (element rect when resolved),
            // so an element comment's card tracks its element rather than the stored click.
            const pinPos = getPinPosition(ann)
            const lostAnchor = ann.kind === 'element' && !pinPos.resolved
            const pos = getCardPosition(pinPos.x, pinPos.y, editCardHeight)
            return (
              <div
                ref={editCardRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                  ...cardStyle,
                  ...pos,
                }}
              >
                <div style={cardHeaderStyle}>
                  <span style={cardLabelStyle}>Comment #{editIndex + 1}</span>
                  <button
                    onClick={handleCancel}
                    aria-label="Cancel edit"
                    style={closeButtonStyle}
                  >
                    ×
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--al-muted)',
                    marginBottom: '0.5rem',
                    fontFamily: 'var(--al-font)',
                  }}
                >
                  {formatDate(ann.createdAt)}
                </div>
                {/* Graceful-degradation note: the anchored element could not be re-found,
                    so the pin is showing its last-known position. */}
                {lostAnchor && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--al-error)',
                      marginBottom: '0.5rem',
                      fontFamily: 'var(--al-font)',
                      lineHeight: 1.35,
                    }}
                  >
                    Element not found — showing last known position.
                  </div>
                )}
                <input
                  type="text"
                  value={draftName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    e.stopPropagation()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  placeholder="Your name"
                  style={nameInputStyle}
                />
                <textarea
                  autoFocus
                  value={draftText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraftText(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    e.stopPropagation()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  style={textareaStyle}
                />
                {/* Resolved toggle — saves immediately, no need to press Save */}
                <button
                  onClick={() => {
                    setAnnotations(prev =>
                      prev.map(a =>
                        a.id === editingId ? { ...a, resolved: !a.resolved } : a
                      )
                    )
                  }}
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: 'var(--al-radius-input)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--al-font)',
                    marginBottom: '0.25rem',
                    border: ann.resolved
                      ? '1px solid var(--al-muted)'
                      : '1px solid var(--al-success)',
                    background: 'transparent',
                    color: ann.resolved
                      ? 'var(--al-muted)'
                      : 'var(--al-success)',
                  }}
                >
                  {ann.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                </button>
                <p
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--al-muted)',
                    margin: '0 0 0.5rem 0',
                    fontFamily: 'var(--al-font)',
                  }}
                >
                  Resolution saves immediately. Text changes require Save.
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <button
                    onClick={handleEditSave}
                    disabled={draftText.trim() === ''}
                    style={{
                      ...saveButtonStyle(draftText.trim() === ''),
                      padding: '0 16px',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--al-error)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--al-font)',
                      padding: '4px 0',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </>
  )

  // ─── Render ──────────────────────────────────────────────────────────────────
  // In-tree (renders where this component is mounted = inside PrototypeHeader's bar):
  //   - the <style> block (a position-independent stylesheet for dimming map panels), and
  //   - the INLINE toggle button. Because the component is mounted in the header, the inline
  //     toggle renders inside the bar for both build types. It is a normal in-flow button
  //     (NOT position:fixed). The active "Done annotating" toggle now lives in the header, so
  //     the old `body.annotation-active header` dim rule is GONE (it would have dimmed and
  //     pointer-events:none'd the very control needed to exit annotation mode). The freeze
  //     ring + overlay remain the annotation-mode signal.
  // Portalled to document.body: the freeze ring, click-capture overlay, highlight ring,
  //   hover preview, pins, and cards — everything that must overlay the frozen page and
  //   escape the header's stacking context. Guarded by `mounted` for SSR (createPortal needs
  //   a real DOM node; nothing renders on the server).

  return (
    <>
      {/* ── Body class styles ──────────────────────────────────────────────── */}
      {/* Dims map-build floating panels (toggle-panel / time-slider) while annotation mode
          is active so they don't compete with the frozen page. The header is intentionally
          NOT dimmed — the active toggle lives in it and must stay clickable. The annotation
          UI is portalled to document.body, so it is not affected by these rules. */}
      <style>{`
        body.annotation-active [data-slot="toggle-panel"],
        body.annotation-active [data-slot="time-slider"] {
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>

      {/* ── Inline toggle ──────────────────────────────────────────────────────
          Renders inside the host PrototypeHeader bar (right slot / commentSlot). Normal
          in-flow button — no portal, no fixed position. Clickable in BOTH states: enter
          annotation mode from the bar, and "Done annotating" to exit from the bar. The
          sticky header sits above the click-capture overlay (z-index documented in
          PrototypeHeader), so this stays clickable while annotating. */}
      <button
        type="button"
        onClick={isActive ? exitAnnotationMode : enterAnnotationMode}
        aria-pressed={isActive}
        style={inlineToggleStyle}
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        {isActive ? 'Done annotating' : (label ?? 'Comments')}
      </button>

      {mounted ? createPortal(viewportUI, document.body) : null}
    </>
  )
}
