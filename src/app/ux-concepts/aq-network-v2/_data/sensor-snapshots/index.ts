/**
 * index.ts — the sensor-snapshot registry (keyed by OpenAQ city slug).
 *
 * Purpose
 *   The single lookup the "Sensors & coverage" section uses to get a city's committed
 *   sensor-growth snapshot. Snapshots are captured once from OpenAQ
 *   (scripts/capture-aq-network-snapshot.mjs) and committed as JSON; this module imports
 *   each JSON, validates its shape against SensorSnapshot, and exposes getSensorSnapshot(slug).
 *
 *   Keying by OpenAQ slug is what makes the section generalise by DATA: to add London, run
 *   the capture script for London, import the new JSON here in one line, and the same map +
 *   counters render it — no component change.
 *
 * Key exports: getSensorSnapshot, SENSOR_SNAPSHOT_SLUGS
 * External dependencies: ./types (SensorSnapshot), the per-city snapshot JSON files.
 */

import type { SensorSnapshot } from './types'
// Each city's committed snapshot JSON (captured once from OpenAQ; not fetched at page load).
// Plain JSON import (resolveJsonModule) — matches the repo's existing build-dates.json import.
import accra from './accra.json'
// London: 100 reference-grade OpenAQ locations (the dense /locations page cap), real firstSeen
// on every sensor → growth 2016 (18) → 2026 (100). Captured via the per-city snapshot script.
import london from './london.json'

/**
 * The snapshot registry. JSON imports are typed as the broad inferred shape, so each entry is
 * asserted to SensorSnapshot here — the one place the JSON↔type contract is enforced. Add a
 * city by importing its JSON above and adding one line here.
 */
const SNAPSHOTS: Readonly<Record<string, SensorSnapshot>> = {
  accra: accra as SensorSnapshot,
  london: london as SensorSnapshot,
}

/** All slugs that have a committed snapshot — convenient for validation/iteration. */
export const SENSOR_SNAPSHOT_SLUGS: readonly string[] = Object.keys(SNAPSHOTS)

/**
 * Look up a city's sensor snapshot by OpenAQ slug. Returns undefined when no snapshot has
 * been captured for that city yet, so the caller can render a graceful fallback rather than
 * throwing (an early city may have a profile before its snapshot exists).
 */
export function getSensorSnapshot(slug: string): SensorSnapshot | undefined {
  return SNAPSHOTS[slug]
}
