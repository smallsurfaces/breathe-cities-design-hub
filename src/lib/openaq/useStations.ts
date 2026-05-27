/**
 * useStations.ts — Data hook for the live-data map (fetch + four network states + freshness)
 *
 * Purpose:
 *   Owns every fetch of GET /api/stations?city=&parameter= for the route and reduces it to the
 *   four distinct outcomes the brief requires (pattern 4), plus the freshness counts the header
 *   readout (pattern 1) and the probe tiers (pattern 3) read from. The hard line — and the whole
 *   point of the hook — is "loaded, found nothing" (a true state of the world) vs "failed to load"
 *   (an error with Retry). The dominant London reality (stations exist, ~all stale) is its own
 *   honest state ('empty-stale'), never an error.
 *
 * Key exports: useStations, StationsState, NetworkStatus, freshCount
 *
 * External dependencies:
 *   - react (useState/useEffect/useCallback/useRef)
 *   - ../../lib/openaq/types (Station, ParameterName — read-only)
 *   - ./aqiParameters (ParameterKey)
 *
 * Concurrency (prototype-build-standard item 2): city/parameter switches fire overlapping
 *   fetches. Each fetch is tagged with a monotonically increasing request id; only the latest
 *   request is allowed to commit state. A stale in-flight response (user switched again before it
 *   resolved) is dropped — it can never overwrite the current selection's data. The same id guard
 *   covers unmount (the ref simply stops matching).
 *
 * Side effects: network fetch; no localStorage, no DOM. AbortController is used to cancel the
 *   superseded request where supported, but the request-id guard is the authoritative protection.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Station } from './types'
import type { ParameterKey } from './aqiParameters'

/**
 * The four mutually exclusive network outcomes (brief pattern 4), plus 'idle' before the first
 * fetch settles:
 *   - 'loading'     — fetch in flight (initial, city switch, parameter switch)
 *   - 'empty'       — fetch ok, zero stations for this city+parameter ("found nothing", not error)
 *   - 'empty-stale' — fetch ok, stations exist but zero are fresh (dominant London; NOT error)
 *   - 'ready'       — fetch ok, at least one fresh station
 *   - 'error'       — fetch failed (network / non-2xx); offers Retry
 */
export type NetworkStatus = 'idle' | 'loading' | 'empty' | 'empty-stale' | 'ready' | 'error'

/**
 * Which data source to request from /api/stations:
 *   - 'live'     — hit OpenAQ live (the integration/plumbing route default; the future go-live toggle)
 *   - 'snapshot' — serve the committed snapshot (the toolkit demo default; deterministic, frozen)
 * The route resolves the source and reports back which one it actually served via response headers.
 */
export type DataSource = 'live' | 'snapshot'

/** The full resolved state the hook exposes to the view. */
export type StationsState = {
  status: NetworkStatus
  /** All stations returned for the current city+parameter (includes stale — render flags age). */
  stations: Station[]
  /** Count of fresh (non-stale) stations for the active parameter — the "N" in "N of M live". */
  freshCount: number
  /** Total stations returned for the active parameter — the "M" in "N of M live". */
  totalCount: number
  /**
   * Which source the route ACTUALLY served (from the `x-data-source` response header). May differ
   * from the requested source: a 'snapshot' request for an un-captured city falls through to live,
   * and a 'live' request that fails falls back to snapshot. null until the first fetch settles.
   */
  servedSource: DataSource | null
  /**
   * ISO-8601 capture instant when the served data is a snapshot (from `x-snapshot-captured-at`).
   * null when the served data is live (live data has no single capture instant). Drives the honest
   * "Snapshot · data as of <date>" label.
   */
  capturedAt: string | null
  /** Re-issue the current city+parameter fetch (used by the error Retry action). */
  retry: () => void
}

/**
 * Count stations whose reading for `parameter` is fresh (isStale === false). A station missing
 * the parameter, or carrying a stale reading, does not count. This is the single definition of
 * "N" used by the readout, the empty-stale detection, and the probe tier selection — so they can
 * never disagree.
 */
export function freshCount(stations: Station[], parameter: ParameterKey): number {
  let count = 0
  for (const station of stations) {
    const reading = station.parameters[parameter]
    if (reading !== undefined && reading.isStale === false) {
      count += 1
    }
  }
  return count
}

/** Derive the network status from a successful response body. Encodes the empty / empty-stale /
 *  ready trichotomy in one place: 0 total -> empty; total>0 but 0 fresh -> empty-stale; else ready. */
function statusForResult(stations: Station[], fresh: number): NetworkStatus {
  if (stations.length === 0) {
    return 'empty'
  }
  if (fresh === 0) {
    return 'empty-stale'
  }
  return 'ready'
}

/**
 * Fetch + state hook. Refetches whenever city or parameter changes. The view passes the current
 * city slug and parameter; the hook returns the resolved StationsState. NO2 (an unavailable
 * parameter) must never be passed here — the route gates that upstream (the parameter selector
 * cannot select NO2), so the hook always receives an available parameter.
 *
 * @param citySlug   active city slug from the city registry (e.g. 'london')
 * @param parameter  active, AVAILABLE parameter key ('pm25' | 'pm10')
 * @param source     which data source to request. Defaults to 'live' so existing callers (the
 *                   live-data integration route) keep hitting OpenAQ; the toolkit component passes
 *                   'snapshot' for the deterministic, frozen demo data.
 */
export function useStations(
  citySlug: string,
  parameter: ParameterKey,
  source: DataSource = 'live',
): StationsState {
  const [status, setStatus] = useState<NetworkStatus>('idle')
  const [stations, setStations] = useState<Station[]>([])
  // Which source the route actually served + the snapshot capture instant (from response headers).
  const [servedSource, setServedSource] = useState<DataSource | null>(null)
  const [capturedAt, setCapturedAt] = useState<string | null>(null)

  // Monotonic request id: only the latest request may commit state. Guards against an earlier
  // slow response landing after the user has already switched city/parameter (item 2).
  const requestIdRef = useRef<number>(0)
  // Tracks the in-flight controller so a superseded request can be aborted where supported.
  const controllerRef = useRef<AbortController | null>(null)

  /**
   * Run a fetch for the given city+parameter+source. Tags the request, aborts any prior in-flight
   * request, and commits state only if this request is still the latest when it resolves.
   * Used by both the city/parameter effect and the Retry action.
   */
  const load = useCallback(
    (slug: string, param: ParameterKey, src: DataSource): void => {
      const id = requestIdRef.current + 1
      requestIdRef.current = id

      // Abort the previous in-flight request (best-effort; the id guard is authoritative).
      if (controllerRef.current !== null) {
        controllerRef.current.abort()
      }
      const controller = new AbortController()
      controllerRef.current = controller

      setStatus('loading')

      const url = `/api/stations?city=${encodeURIComponent(slug)}&parameter=${encodeURIComponent(param)}&source=${encodeURIComponent(src)}`
      // Capture the source-provenance headers off the Response, then parse the body. The body
      // contract is unchanged (a bare Station[]); the headers carry which source was served.
      let servedFromHeader: DataSource | null = null
      let capturedAtFromHeader: string | null = null
      fetch(url, { signal: controller.signal })
        .then((response): Promise<Station[]> => {
          if (!response.ok) {
            // Non-2xx (400/502/etc) is a load failure -> error state with Retry.
            throw new Error(`Request failed with status ${response.status}`)
          }
          const sourceHeader = response.headers.get('x-data-source')
          servedFromHeader =
            sourceHeader === 'snapshot' || sourceHeader === 'live' ? sourceHeader : null
          capturedAtFromHeader = response.headers.get('x-snapshot-captured-at')
          return response.json() as Promise<Station[]>
        })
        .then((data: Station[]): void => {
          // Drop a stale response: a newer request has superseded this one.
          if (requestIdRef.current !== id) {
            return
          }
          const fresh = freshCount(data, param)
          setStations(data)
          setServedSource(servedFromHeader)
          setCapturedAt(capturedAtFromHeader)
          setStatus(statusForResult(data, fresh))
        })
        .catch((error: unknown): void => {
          // An abort is an intentional cancellation, not an error — ignore it. Any other
          // failure (and only if still the latest request) becomes the error state.
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }
          if (requestIdRef.current !== id) {
            return
          }
          setStations([])
          setServedSource(null)
          setCapturedAt(null)
          setStatus('error')
        })
    },
    [],
  )

  // Refetch on city / parameter / source change. Cleanup aborts the in-flight request on unmount.
  useEffect(() => {
    load(citySlug, parameter, source)
    return () => {
      if (controllerRef.current !== null) {
        controllerRef.current.abort()
      }
    }
  }, [citySlug, parameter, source, load])

  /** Retry re-issues the CURRENT city+parameter+source fetch (brief pattern 4 acceptance criterion). */
  const retry = useCallback((): void => {
    load(citySlug, parameter, source)
  }, [citySlug, parameter, source, load])

  const fresh = freshCount(stations, parameter)
  return {
    status,
    stations,
    freshCount: fresh,
    totalCount: stations.length,
    servedSource,
    capturedAt,
    retry,
  }
}
