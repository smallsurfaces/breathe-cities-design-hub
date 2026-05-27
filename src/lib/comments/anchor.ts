/**
 * anchor.ts — element-anchoring engine for element-anchored comments (Stage 1).
 *
 * Purpose
 *   Pure-DOM (no React) capture + resolve of a durable reference to a specific DOM
 *   element, so a reviewer's comment can re-attach to the SAME element across reloads
 *   and viewport resizes. This is the single source of truth for anchoring — both the
 *   AnnotationLayer element-mode path and any future tooling import from here. (The old
 *   direction-1-mapbox/AnnotationLayer.tsx duplicate has been removed; that route now uses
 *   the shared components/annotation/AnnotationLayer on the viewport/spatial-pin path.)
 *
 * Strategy — capture every signal we can, resolve best-first
 *   captureAnchor records a redundant set of locators. resolveAnchor then tries them in
 *   priority order (most-stable first) and returns the first match, so a comment survives
 *   minor DOM churn between sessions:
 *     1. data-bc-anchor      — an explicit, author-stable opt-in id (most durable)
 *     2. selectorPath        — structural CSS path (tagName + :nth-of-type) anchored to
 *                              the nearest id / data-* ancestor. NEVER uses Tailwind class
 *                              names (utility classes are volatile and non-unique).
 *     3. nearbyText + role   — text content (<=120 chars) plus role/aria-label/tagName,
 *                              a content-addressed fallback when structure shifts.
 *     4. box                 — normalised bounding box (viewport fractions) as a last
 *                              resort so a muted "last-known-position" pin can still draw.
 *   Every public function is wrapped in try/catch and degrades to null rather than throwing
 *   — a render must never crash because an anchor failed to resolve.
 *
 * Key exports: captureAnchor, resolveAnchor
 * External dependencies: ElementAnchor type (AnnotationLayer.types)
 */

import type { ElementAnchor } from '../../components/annotation/AnnotationLayer.types'

/** Max characters of nearby text we retain — keeps the anchor record small and stable. */
const NEARBY_TEXT_MAX = 120

/** Attributes treated as "stable" anchor ancestors when building a selector path. */
const STABLE_ATTRS: readonly string[] = ['id', 'data-bc-anchor', 'data-slot', 'data-testid']

/**
 * Does this element carry any attribute we consider a stable anchor point?
 * Used to stop the selector-path walk at the nearest meaningful ancestor rather
 * than always walking to <body>, which keeps paths short and resilient.
 */
function hasStableAttr(el: Element): boolean {
  for (const attr of STABLE_ATTRS) {
    if (el.hasAttribute(attr)) return true
  }
  return false
}

/**
 * Build the single-element step for a selector path: tagName plus :nth-of-type so the
 * step is unambiguous among same-tag siblings. Tailwind/utility class names are
 * deliberately excluded — they are non-unique and change on every restyle.
 */
function stepFor(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const parent = el.parentElement
  if (parent === null) return tag
  const sameTag = Array.from(parent.children).filter(
    (child) => child.tagName === el.tagName,
  )
  if (sameTag.length <= 1) return tag
  const index = sameTag.indexOf(el) + 1 // CSS :nth-of-type is 1-based
  return `${tag}:nth-of-type(${index})`
}

/**
 * Build a structural CSS selector for `el`, anchored to the nearest ancestor that has a
 * stable attribute (id / data-*). The anchor ancestor is expressed by that attribute
 * (e.g. `#main`, `[data-slot="card"]`) and the descendant chain by tagName + nth-of-type.
 * Returns null if no stable ancestor exists (caller falls through to text/box anchors).
 */
function buildSelectorPath(el: Element): string | null {
  const steps: string[] = []
  let current: Element | null = el

  while (current !== null && current !== document.body) {
    if (hasStableAttr(current)) {
      // Express the stable ancestor by its strongest attribute, then stop walking.
      let anchorSelector: string | null = null
      if (current.id !== '') {
        anchorSelector = `#${CSS.escape(current.id)}`
      } else {
        for (const attr of STABLE_ATTRS) {
          const value = current.getAttribute(attr)
          if (value !== null) {
            anchorSelector = `[${attr}="${CSS.escape(value)}"]`
            break
          }
        }
      }
      if (anchorSelector === null) return null
      // If the stable ancestor IS the target, the anchor selector alone locates it.
      if (steps.length === 0) return anchorSelector
      return `${anchorSelector} > ${steps.join(' > ')}`
    }
    steps.unshift(stepFor(current))
    current = current.parentElement
  }

  // No stable ancestor found before <body> — selector path is not reliable here.
  return null
}

/** Trim and collapse whitespace, then clamp to NEARBY_TEXT_MAX characters. */
function normaliseText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NEARBY_TEXT_MAX)
}

/**
 * Capture a durable, redundant reference to `el`. Records every locator signal available
 * (see file header for the priority chain). Pure DOM read — no mutation, no React.
 * Returns a best-effort partial record on any failure; never throws.
 */
export function captureAnchor(el: Element): ElementAnchor {
  const anchor: ElementAnchor = {}
  try {
    anchor.tagName = el.tagName.toLowerCase()

    const dataAnchor = el.getAttribute('data-bc-anchor')
    if (dataAnchor !== null && dataAnchor !== '') anchor.dataAnchor = dataAnchor

    const role = el.getAttribute('role')
    if (role !== null && role !== '') anchor.role = role

    const ariaLabel = el.getAttribute('aria-label')
    if (ariaLabel !== null && ariaLabel !== '') anchor.ariaLabel = ariaLabel

    const selectorPath = buildSelectorPath(el)
    if (selectorPath !== null) anchor.selectorPath = selectorPath

    const text = normaliseText(el.textContent ?? '')
    if (text !== '') anchor.nearbyText = text

    // Normalised bounding box (viewport fractions) — last-resort positional fallback.
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 || rect.height > 0) {
      anchor.box = {
        x: rect.left / window.innerWidth,
        y: rect.top / window.innerHeight,
        w: rect.width / window.innerWidth,
        h: rect.height / window.innerHeight,
      }
    }
  } catch {
    /* Return whatever we captured before the failure — partial is still useful. */
  }
  return anchor
}

/**
 * Find the candidate elements matching a selector, guarded against invalid selectors
 * (a malformed stored path must not throw inside resolveAnchor).
 */
function safeQueryAll(selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector))
  } catch {
    return []
  }
}

/**
 * Resolve an ElementAnchor back to a live element, trying each locator in priority order
 * (data-bc-anchor → selectorPath → nearbyText+role → tagName). Returns null when nothing
 * matches so the caller can fall back to the muted last-known-position pin. Never throws.
 *
 * Note: the normalised `box` is intentionally NOT used to *find* an element here — it has
 * no DOM identity. It is only a positional fallback the caller reads directly when this
 * returns null.
 */
export function resolveAnchor(anchor: ElementAnchor): HTMLElement | null {
  try {
    // 1) Explicit data-bc-anchor — strongest, author-stable.
    if (anchor.dataAnchor !== undefined && anchor.dataAnchor !== '') {
      const byData = document.querySelector(
        `[data-bc-anchor="${CSS.escape(anchor.dataAnchor)}"]`,
      )
      if (byData instanceof HTMLElement) return byData
    }

    // 2) Structural selector path.
    if (anchor.selectorPath !== undefined && anchor.selectorPath !== '') {
      const matches = safeQueryAll(anchor.selectorPath)
      if (matches.length > 0 && matches[0] instanceof HTMLElement) {
        return matches[0]
      }
    }

    // 3) Content-addressed: match by nearbyText, disambiguated by role/aria/tagName.
    if (anchor.nearbyText !== undefined && anchor.nearbyText !== '') {
      const tag = anchor.tagName ?? '*'
      const candidates = safeQueryAll(tag)
      for (const candidate of candidates) {
        if (!(candidate instanceof HTMLElement)) continue
        const text = normaliseText(candidate.textContent ?? '')
        if (text !== anchor.nearbyText) continue
        // Disambiguate when extra signals were captured.
        if (
          anchor.ariaLabel !== undefined &&
          candidate.getAttribute('aria-label') !== anchor.ariaLabel
        ) {
          continue
        }
        if (
          anchor.role !== undefined &&
          candidate.getAttribute('role') !== anchor.role
        ) {
          continue
        }
        return candidate
      }
    }

    return null
  } catch {
    return null
  }
}
