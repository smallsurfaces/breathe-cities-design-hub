/**
 * types.ts — the SensorSnapshot data model for the AQ Network sensor-growth map.
 *
 * Purpose
 *   The "Sensors & coverage" section renders an interactive map + linked counters from a
 *   committed SNAPSHOT (captured once from OpenAQ — see
 *   scripts/capture-aq-network-snapshot.mjs), NOT from a live call (decision #7,
 *   "don't burn the API"). This file is the shape that snapshot JSON conforms to, shared by
 *   the loader (index.ts) and the SensorGrowthMap component.
 *
 *   The snapshot is keyed by OpenAQ city slug so the section generalises to other cities by
 *   DATA alone (London next): capture a city → drop its JSON here → the map works, no
 *   component change.
 *
 * Honesty contract (encoded in the types so the data can't drift from the concept)
 *   - Per-sensor `type` and position are REAL OpenAQ data; `type` is derived from isMonitor
 *     (reference-grade monitor vs low-cost sensor) — never air-quality colouring.
 *   - `firstSeen` is the real OpenAQ datetimeFirst when present; `firstSeenEstimated` flags
 *     sensors whose first-seen was missing and were placed at the dataset median year.
 *   - Each timeline year carries `isEstimate`: true for the guesstimated pre-data runway
 *     years (where the SENSOR count is modelled), false for real years. Districts + people
 *     are derived/guesstimated in every year (the UI always labels population an estimate).
 *
 * Key exports: SensorType, SnapshotSensor, SnapshotYear, SensorSnapshot
 * External dependencies: none (pure type module).
 */

/**
 * Sensor hardware tier, derived from OpenAQ `isMonitor`:
 * 'reference' = reference-grade regulatory monitor (isMonitor true);
 * 'low-cost'  = low-cost / community sensor (everything else).
 * This is the ONLY thing the map markers encode — there is no air-quality colouring.
 */
export type SensorType = 'reference' | 'low-cost'

/**
 * One sensor in the snapshot. Position + type are real OpenAQ data. `firstSeenYear` is the
 * year the marker appears on the timeline (real, or the dataset median when estimated).
 */
export type SnapshotSensor = {
  /** OpenAQ location id, as a string (stable React key + map marker id). */
  id: string
  /** Location name (for the marker tooltip). */
  name: string
  /** Longitude — [lng, lat] / Mapbox order. */
  lng: number
  /** Latitude. */
  lat: number
  /** Hardware tier, from isMonitor (reference vs low-cost). Drives marker style + legend. */
  type: SensorType
  /** Year this sensor first appears on the timeline (real firstSeen year, or median when estimated). */
  firstSeenYear: number
  /** Full ISO firstSeen timestamp when OpenAQ provided one; null when it was missing. */
  firstSeen: string | null
  /** True when firstSeen was missing upstream and firstSeenYear was assigned (median). */
  firstSeenEstimated: boolean
}

/**
 * One year on the growth curve — the values the three counters read for a scrubbed year.
 * sensorCount is real for real years and guesstimated for runway years (see isEstimate).
 * districtsCovered + peopleInRange are derived/guesstimated from the sensor count.
 */
export type SnapshotYear = {
  /** The calendar year this row describes. */
  year: number
  /** Sensors deployed by this year (cumulative). Real for real years, modelled for runway years. */
  sensorCount: number
  /** Districts covered by this year — derived/guesstimated from the sensor count. */
  districtsCovered: number
  /** People within sensor range by this year — derived/guesstimated. Always an estimate in the UI. */
  peopleInRange: number
  /** True when the SENSOR count for this year is guesstimated (the pre-data runway years). */
  isEstimate: boolean
}

/**
 * A complete sensor-growth snapshot for one city. Captured once from OpenAQ and committed;
 * the page reads this at build time (no per-load network call).
 */
export type SensorSnapshot = {
  /** OpenAQ city slug this snapshot is for (the registry key). */
  citySlug: string
  /** Display name (e.g. "Accra"). */
  cityName: string
  /** ISO timestamp the snapshot was captured (provenance). */
  capturedAt: string
  /** Human-readable source line. */
  source: string
  /** Map centre [lng, lat] for this city (carried here so the page passes one object). */
  center: [number, number]
  /** Initial map zoom for this city. */
  zoom: number
  /** First year on the timeline (earliest real year minus the guesstimated runway). */
  startYear: number
  /** Last year on the timeline (the "now" end of the story). */
  endYear: number
  /** Headline tallies (total / reference / low-cost / how many had a missing firstSeen). */
  counts: {
    total: number
    reference: number
    lowCost: number
    firstSeenMissing: number
  }
  /** Plain-language notes on exactly what is real vs guesstimated (for honesty/audit). */
  estimateNotes: {
    sensors: string
    districtsAndPeople: string
  }
  /** Every sensor (real position + type; first-seen year real or estimated). */
  sensors: SnapshotSensor[]
  /** The per-year growth curve the counters read. Ordered startYear → endYear. */
  timeline: SnapshotYear[]
}
