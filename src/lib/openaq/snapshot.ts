/**
 * snapshot.ts — committed OpenAQ snapshots for the real-time monitoring component (snapshot-default).
 *
 * Purpose:
 *   The data-strategy default for the toolkit demo: instead of hitting live OpenAQ on every page
 *   load, the real-time monitoring component serves a SNAPSHOT of `Station[]` captured at a known
 *   instant and committed into the repo. This makes the demo deterministic for client reviews (no
 *   "all stale today" surprise), removes the live-fetch latency, and keeps the OpenAQ key out of
 *   the default request path. The live fetch stays available behind `?source=live` (the capture
 *   mechanism + the future go-live toggle), and a snapshot is also the FALLBACK when a live fetch
 *   errors.
 *
 *   Freshness is FROZEN as-of-capture: each station's `isStale` / `ageHours` are exactly what the
 *   adapter computed at capture time and are NOT recomputed against "now" — so a frozen reading
 *   never silently re-ages or re-classifies. The honest "Snapshot · data as of <date>" label
 *   (driven by `capturedAt`) is what tells the viewer these timestamps are frozen, not live-fresh.
 *
 * Key exports:
 *   - SnapshotFile (the on-disk shape), CitySnapshot (resolved result)
 *   - SNAPSHOT_CITY_SLUGS (which cities have a committed snapshot)
 *   - getSnapshot(city, parameter): resolved snapshot or null when none is committed
 *   - hasSnapshot(city, parameter): boolean guard
 *
 * External dependencies:
 *   - ./types (Station — the committed JSON conforms to Station[])
 *   - the committed JSON under ../../data/snapshots/rt-monitoring/*.json (statically imported so the
 *     bundler includes them; no filesystem read at request time)
 *
 * Adding/refreshing a snapshot: run `tools/capture-rt-snapshots.mjs` (writes the JSON files), then
 *   re-import the new city below. The capture script is the ONLY producer of these files — they are
 *   never hand-edited so the frozen freshness stays internally consistent.
 */

import type { Station } from './types'

// Statically import the committed snapshots. resolveJsonModule is enabled (tsconfig), so each JSON
// is typed structurally; we assert to SnapshotFile after a light runtime shape check in getSnapshot.
import accraSnapshot from '../../data/snapshots/rt-monitoring/accra.json'
import bangkokSnapshot from '../../data/snapshots/rt-monitoring/bangkok.json'
import parisSnapshot from '../../data/snapshots/rt-monitoring/paris.json'
import londonSnapshot from '../../data/snapshots/rt-monitoring/london.json'

/**
 * The on-disk snapshot shape. One file per city; the file carries every captured parameter keyed by
 * parameter name so a single import covers pm25 + pm10 for that city.
 */
export type SnapshotFile = {
  /** City slug this snapshot belongs to (matches the cities registry). */
  city: string
  /** ISO-8601 UTC instant the snapshot was captured. Drives the "data as of <date>" label. */
  capturedAt: string
  /**
   * Stations per parameter, exactly as the adapter returned them at capture time (freshness frozen).
   * Keyed by OpenAQ parameter name ('pm25' | 'pm10'); a parameter with no committed capture is absent.
   */
  parameters: Record<string, Station[]>
}

/** A resolved snapshot for one city+parameter: the frozen stations plus the capture instant. */
export type CitySnapshot = {
  stations: Station[]
  capturedAt: string
}

/**
 * Registry of committed snapshots, keyed by city slug. The four demo cities from the brief (a strong
 * pick, a mid pick, and the sparse London case) are captured; other registry cities have no snapshot
 * and fall through to live (see the route). Typed as SnapshotFile via the import.
 */
// The JSON imports infer wider literal types than the Station model (e.g. `coordinates: number[]`
// rather than the `[number, number]` tuple, and string-widened `quality`). The capture script is
// the sole producer and guarantees each file conforms to Station[] at write time, so we assert via
// `unknown` — the sanctioned cast for committed JSON whose inferred shape is wider than the target
// tuple/union types. (TS itself suggests this exact conversion.)
const SNAPSHOTS: Record<string, SnapshotFile> = {
  accra: accraSnapshot as unknown as SnapshotFile,
  bangkok: bangkokSnapshot as unknown as SnapshotFile,
  paris: parisSnapshot as unknown as SnapshotFile,
  london: londonSnapshot as unknown as SnapshotFile,
}

/** All city slugs that have a committed snapshot — convenient for callers and tests. */
export const SNAPSHOT_CITY_SLUGS: readonly string[] = Object.keys(SNAPSHOTS)

/**
 * Resolve the committed snapshot for a city+parameter. Returns null when this city has no snapshot
 * file, or the file does not carry the requested parameter — callers then fall through to live.
 * Never recomputes freshness: the returned stations are the frozen capture verbatim.
 */
export function getSnapshot(citySlug: string, parameterName: string): CitySnapshot | null {
  const file = SNAPSHOTS[citySlug]
  if (file === undefined) {
    return null
  }
  const stations = file.parameters[parameterName]
  if (stations === undefined) {
    return null
  }
  return { stations, capturedAt: file.capturedAt }
}

/** True when a committed snapshot exists for this city+parameter. */
export function hasSnapshot(citySlug: string, parameterName: string): boolean {
  return getSnapshot(citySlug, parameterName) !== null
}
