/**
 * AnnotationLayer — Type Definitions
 *
 * Shared types for AnnotationLayer.tsx and consuming components.
 * Import these when implementing a MapAdapter or integrating the component.
 *
 * @see AnnotationLayer.tsx for the component implementation
 */

/**
 * How an annotation is positioned.
 *  - 'viewport' : legacy normalised-fraction pin (default for all pre-Stage-1 records).
 *  - 'element'  : anchored to a specific DOM element; position derived live from the
 *                 resolved element's rect, with the stored box as a fallback.
 *  - 'map'      : reserved for future map-feature anchoring (not used in Stage 1).
 */
export type AnchorKind = 'viewport' | 'element' | 'map'

/**
 * A durable, redundant reference to a DOM element so a comment re-attaches across
 * reloads/resizes. Captured + resolved by lib/comments/anchor.ts (best-first priority:
 * dataAnchor → selectorPath → nearbyText+role → box). All fields optional because
 * capture is best-effort and degrades gracefully.
 */
export type ElementAnchor = {
  /** Explicit author-stable opt-in id (data-bc-anchor attribute). Strongest locator. */
  dataAnchor?: string
  /** Structural CSS path (tagName + :nth-of-type) from nearest id/data-* ancestor. */
  selectorPath?: string
  /** Trimmed text content (<=120 chars) for content-addressed fallback matching. */
  nearbyText?: string
  /** ARIA role of the anchored element, if any. */
  role?: string
  /** aria-label of the anchored element, if any. */
  ariaLabel?: string
  /** Lowercased tagName of the anchored element. */
  tagName?: string
  /** Normalised bounding box (viewport fractions 0–1) — last-known-position fallback. */
  box?: { x: number; y: number; w: number; h: number }
}

/**
 * A single annotation pin placed by a reviewer.
 * Coordinates are stored as normalised viewport fractions (0–1),
 * not pixels, so they survive viewport resize.
 *
 * Stage 1 additions are all optional / defaulted so legacy localStorage records
 * (which lack them) still parse via the migration block in AnnotationLayer.tsx:
 *  - kind defaults to 'viewport' when absent
 *  - anchor/buildId/route/capturedText/viewport/schemaVersion are absent on legacy data
 */
export type Annotation = {
  id: string
  /** Normalised horizontal position: 0 = left edge, 1 = right edge */
  x: number
  /** Normalised vertical position: 0 = top edge, 1 = bottom edge */
  y: number
  text: string
  authorName: string
  /** Unix timestamp in milliseconds */
  createdAt: number
  resolved: boolean
  /** Stage 1: positioning mode. Absent on legacy records → treated as 'viewport'. */
  kind?: AnchorKind
  /** Stage 1: element reference, present when kind === 'element'. */
  anchor?: ElementAnchor
  /** Stage 1: the build this comment belongs to (stable slug). */
  buildId?: string
  /** Stage 1: the route pathname the comment was placed on. */
  route?: string
  /** Stage 1: snapshot of the anchored element's text at capture time (= anchor.nearbyText). */
  capturedText?: string
  /** Stage 1: viewport size at capture (px) — context for box-fallback scaling. */
  viewport?: { w: number; h: number }
  /** Stage 1: record schema version. Element-anchored records are version 2. */
  schemaVersion?: number
}

/**
 * The server-stored, machine-readable record for one build's comments.
 * Persisted via /api/comments (Netlify Blobs) and mirrored to localStorage as a cache.
 * This is the shape Stage 2 read/pull tooling will consume.
 */
export type CommentStoreRecord = {
  /** Stable build slug (key in the Blobs store). */
  buildId: string
  /** Route pathname the build lives at. */
  route: string
  /** Unix timestamp (ms) of the last write. */
  updatedAt: number
  /** All annotations for this build. */
  comments: Annotation[]
}

/**
 * Browser-side persistence adapter. Lets AnnotationLayer swap its storage backend:
 * map builds use the default localStorage logic; non-map builds pass the /api/comments
 * adapter (lib/comments/client.ts). load() is async (network); save() is fire-and-forget.
 */
export type AnnotationPersistence = {
  /** Load all annotations for a build. Resolves to [] when none/offline. */
  load: (buildId: string) => Promise<Annotation[]>
  /** Persist the full annotation list for a build. Fire-and-forget (no await needed). */
  save: (buildId: string, comments: Annotation[]) => void
}

/**
 * Adapter interface for freezing/unfreezing an underlying interactive layer
 * (e.g. a Mapbox map) during annotation mode.
 *
 * Implement freeze() to disable pan/zoom/interaction when the annotator is placing pins.
 * Implement unfreeze() to restore full interaction when annotation mode exits.
 * Omit mapAdapter entirely for plain viewport use.
 */
export type MapAdapter = {
  freeze: () => void
  unfreeze: () => void
}

/**
 * Configuration props for the AnnotationLayer component.
 * Pass as props when using <AnnotationLayer ... />.
 */
export type AnnotationLayerConfig = {
  /**
   * Required. localStorage key for persisting annotations.
   * Use format: [project-slug]-[view-slug]
   * Example: "bc-direction1", "clienta-concept-b"
   * Must be unique per project/view to prevent annotation collision.
   * Also used as the localStorage cache key when a `persistence` adapter is supplied.
   */
  storageKey: string

  /** Optional. Label shown in the toggle pill. Defaults to "Annotations". */
  label?: string

  /**
   * Optional. Positioning mode for new pins. Defaults to 'viewport' so map builds
   * (which omit this) are behaviourally unchanged.
   *  - 'viewport': click stores a normalised viewport fraction (legacy behaviour).
   *  - 'element' : click resolves document.elementFromPoint and anchors to that DOM
   *                element; the pin re-anchors live on reload/resize.
   */
  anchorMode?: 'viewport' | 'element'

  /**
   * Optional. Pluggable persistence backend. When omitted, the component uses its
   * built-in localStorage load/save logic (default — map builds rely on this, so their
   * behaviour is unchanged). Non-map builds pass the /api/comments adapter so comments
   * reach the durable Netlify Blobs store.
   */
  persistence?: AnnotationPersistence

  /**
   * Optional. Stable build slug recorded on each element-anchored annotation and passed
   * to the persistence adapter. Required in practice when anchorMode === 'element'.
   */
  buildId?: string

  /** Optional. Route pathname recorded on each element-anchored annotation. */
  route?: string

  /**
   * Optional. Implement freeze/unfreeze to pause an underlying map or
   * interactive layer during annotation mode.
   */
  mapAdapter?: MapAdapter

  /**
   * Optional. Fires when annotation mode is entered.
   * Use to clear open popups, tooltips, or other UI state in the host.
   */
  onEnterMode?: () => void

  /** Optional. Fires when annotation mode is exited. */
  onExitMode?: () => void

  /**
   * Optional. Viewport width (px) below which cards use bottom-sheet positioning.
   * Defaults to 768.
   */
  mobileBreakpoint?: number
}
