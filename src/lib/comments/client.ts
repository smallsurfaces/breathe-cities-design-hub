/**
 * client.ts — browser persistence adapter for element-anchored comments (Stage 1).
 *
 * Purpose
 *   Implements the AnnotationPersistence interface against the /api/comments route, with
 *   localStorage as an offline cache + fallback. AnnotationLayer (in element mode) calls
 *   this so comments reach the durable Netlify Blobs store — while still working under
 *   plain `next dev`/offline, where the server store is absent.
 *
 * Behaviour
 *   load(buildId):
 *     1. Read the localStorage cache immediately (fast first paint, offline safety).
 *     2. Try GET /api/comments?build=<id>. On success, refresh the cache and return server
 *        data. On any failure (offline, 502 under next dev), return the cached array.
 *   save(buildId, comments):
 *     1. Write the localStorage cache synchronously (never lose the user's work).
 *     2. Abort any POST still in flight for this build, then fire POST /api/comments (full
 *        replace). Aborting the prior POST keeps rapid saves from landing out of order
 *        server-side — the latest save always carries the complete state and wins. Failure
 *        is swallowed in production and warned in dev (an intentional abort is not a failure)
 *        — the cache already holds the data, so we degrade, not crash.
 *
 *   Because load() merges nothing — it prefers the server when reachable, else the cache —
 *   a reviewer working under `next dev` still sees their pins across reloads via the cache.
 *
 * Key export: createApiPersistence
 * External dependencies: Annotation, AnnotationPersistence, CommentStoreRecord types
 */

import type {
  Annotation,
  AnnotationPersistence,
  CommentStoreRecord,
} from '../../components/annotation/AnnotationLayer.types'

/** localStorage cache key namespace — kept distinct from legacy map storageKeys. */
const CACHE_PREFIX = 'bc-comments-cache:'

/** Build the per-build cache key. */
function cacheKey(buildId: string): string {
  return `${CACHE_PREFIX}${buildId}`
}

/**
 * Read cached annotations for a build from localStorage. Returns [] on miss or corrupt
 * data. Side effect: reads localStorage. Guarded — never throws (SSR/private-mode safe).
 */
function readCache(buildId: string): Annotation[] {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(cacheKey(buildId))
    if (raw === null) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Annotation[]) : []
  } catch {
    return []
  }
}

/**
 * Write annotations to the localStorage cache. Side effect: writes localStorage.
 * Guarded — Safari private mode throws QuotaExceededError on setItem; we swallow it
 * (the data still lives in React state for the session).
 */
function writeCache(buildId: string, comments: Annotation[]): void {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(cacheKey(buildId), JSON.stringify(comments))
  } catch {
    /* private mode / quota — degrade silently, state retains the data for this session */
  }
}

/**
 * Create an AnnotationPersistence adapter bound to /api/comments for a given route.
 * `route` is sent on POST so the server record records where the build lives.
 */
export function createApiPersistence(route: string): AnnotationPersistence {
  // Per-build in-flight POST guard. save() always sends a FULL replace (the entire current
  // comment list), so two rapid saves race: without sequencing, the earlier POST can land
  // AFTER the later one and clobber the server with stale state. We keep the latest
  // AbortController per build and abort the prior POST before firing the new one — the new
  // POST already carries the complete latest state, so nothing is lost. (The localStorage
  // cache is written synchronously regardless, so client state is never at risk.)
  const inFlight = new Map<string, AbortController>()

  return {
    /**
     * Load annotations: cache-first for resilience, server-authoritative when reachable.
     * Side effects: localStorage read/write, network GET.
     */
    async load(buildId: string): Promise<Annotation[]> {
      const cached = readCache(buildId)
      try {
        const res = await fetch(
          `/api/comments?build=${encodeURIComponent(buildId)}`,
          { method: 'GET' },
        )
        if (!res.ok) return cached
        const record = (await res.json()) as CommentStoreRecord
        const comments = Array.isArray(record.comments) ? record.comments : []
        // Refresh the cache so offline reloads see the latest server state.
        writeCache(buildId, comments)
        return comments
      } catch {
        // Offline or store absent (next dev) — serve the cache.
        return cached
      }
    },

    /**
     * Save annotations: cache synchronously (never lose work), then POST full replace.
     * Fire-and-forget — the caller does not await. Side effects: localStorage write,
     * network POST.
     */
    save(buildId: string, comments: Annotation[]): void {
      writeCache(buildId, comments)

      // Abort any POST still in flight for THIS build, then fire the new full-replace POST.
      // Sequencing guarantee: the latest save always wins server-side (see inFlight above).
      inFlight.get(buildId)?.abort()
      const controller = new AbortController()
      inFlight.set(buildId, controller)

      void fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId, route, comments }),
        signal: controller.signal,
      })
        .then(() => {
          // Clear our controller once settled, but only if a newer save has not replaced it.
          if (inFlight.get(buildId) === controller) inFlight.delete(buildId)
        })
        .catch((err: unknown) => {
          // An AbortError is intentional (a newer save superseded this one) — not a failure.
          if (err instanceof DOMException && err.name === 'AbortError') return
          if (inFlight.get(buildId) === controller) inFlight.delete(buildId)
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(
              '[comments] POST /api/comments failed — comments cached locally only.',
              err,
            )
          }
        })
    },
  }
}
