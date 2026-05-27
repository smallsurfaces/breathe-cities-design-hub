/**
 * programme-types.ts — the ProgrammeSnapshot data model for the AQ Network GLOBE homepage.
 *
 * Purpose
 *   The AQ Network homepage (/ux-concepts/aq-network) is an interactive 3D globe showing the
 *   WHOLE Breathe Cities sensor network worldwide. Like the per-city sensor-growth map, it
 *   renders from a committed SNAPSHOT captured once from OpenAQ (decision #7, "don't burn the
 *   API") — never a live call. This file is the shape that programme.json conforms to, shared
 *   by the loader (programme.ts) and the NetworkGlobe component.
 *
 *   Where SensorSnapshot (types.ts) is ONE city, ProgrammeSnapshot is the AGGREGATE across all
 *   member cities: every sensor tagged with its city, plus a network-wide per-year curve
 *   {year, cities, sensors, population} that the homepage's three programme counters read.
 *
 * Honesty contract (encoded in the types so the data can't drift from the concept)
 *   - Per-sensor `type` and position are REAL OpenAQ data; `type` is derived from isMonitor.
 *   - `firstSeen` is the real OpenAQ datetimeFirst when present; `firstSeenEstimated` flags
 *     sensors whose first-seen was missing (placed at the programme-wide median year).
 *   - Per-year `cities` + `sensors` are the TRUE cumulative network deployment.
 *   - Per-year `population` is a documented guesstimate (city-scale, not a measured catchment),
 *     scaled by each city's deployment fraction so it lands on the curated sum at the end year.
 *     `isEstimate` flags thin early years where the sensor curve is sparse.
 *
 * Key exports: ProgrammeSensor, ProgrammeCity, ProgrammeYear, ProgrammeSnapshot
 * External dependencies: none (pure type module).
 */

import type { SensorType } from './types'

/**
 * One sensor in the programme (globe) snapshot. Position + type are real OpenAQ data; the
 * sensor is tagged with the member city it belongs to so the globe can colour/emphasise it.
 */
export type ProgrammeSensor = {
  /** Globally-unique id: `${citySlug}-${openaqLocationId}` (stable React/map key). */
  id: string
  /** Location name (for tooltips). */
  name: string
  /** OpenAQ city slug this sensor belongs to. */
  city: string
  /** Display name of the city (denormalised for convenience in tooltips/legend). */
  cityName: string
  /** True when the city is a Breathe Cities member (drives globe emphasis). */
  isMember: boolean
  /** Longitude — [lng, lat] / Mapbox order. */
  lng: number
  /** Latitude. */
  lat: number
  /** Hardware tier, from isMonitor (reference vs low-cost). */
  type: SensorType
  /** Year this sensor first appears on the timeline (real firstSeen year, or median when estimated). */
  firstSeenYear: number
  /** Full ISO firstSeen when OpenAQ provided one; null when it was missing. */
  firstSeen: string | null
  /** True when firstSeen was missing upstream and firstSeenYear was assigned (median). */
  firstSeenEstimated: boolean
}

/**
 * One member city's summary in the programme snapshot — used for the globe legend, present-day
 * tallies, and the per-city emphasis. `joinedYear` is the year the city's earliest sensor
 * appears (when it "joined" the visible network).
 */
export type ProgrammeCity = {
  /** OpenAQ city slug. */
  slug: string
  /** Display name. */
  name: string
  /** Map centre [lng, lat]. */
  center: [number, number]
  /** True for Breathe Cities member cities. */
  isMember: boolean
  /** Documented present-day people-in-range guesstimate (city-scale, not a measured catchment). */
  populationInRange: number
  /** Total sensors captured in this city. */
  sensorCount: number
  /** Year this city first appears on the timeline (earliest sensor firstSeenYear). */
  joinedYear: number
}

/**
 * One year on the network-wide growth curve — the values the three programme counters read for
 * a scrubbed year. `cities` + `sensors` are real cumulative deployment; `population` is derived.
 */
export type ProgrammeYear = {
  /** The calendar year this row describes. */
  year: number
  /** Member cities with >=1 sensor deployed by this year (cumulative, REAL). */
  cities: number
  /** Sensors deployed network-wide by this year (cumulative, REAL). */
  sensors: number
  /** People within sensor range network-wide by this year (DERIVED/GUESSTIMATE). */
  population: number
  /** True when the sensor curve is sparse this year (modelled lead-in for the UI to label). */
  isEstimate: boolean
}

/**
 * The complete network-wide snapshot for the globe homepage. Captured once from OpenAQ
 * (aggregated across all member cities) and committed; the page reads it at build time.
 */
export type ProgrammeSnapshot = {
  /** Discriminator — always 'programme' (distinguishes from a per-city SensorSnapshot). */
  kind: 'programme'
  /** ISO timestamp the snapshot was captured (provenance). */
  capturedAt: string
  /** Human-readable source line. */
  source: string
  /** First year on the network timeline (earliest city's joined year). */
  startYear: number
  /** Last year on the timeline (the "now" end of the story). */
  endYear: number
  /** Present-day headline tallies across the whole network. */
  counts: {
    cities: number
    memberCities: number
    sensors: number
    reference: number
    lowCost: number
    population: number
    firstSeenMissing: number
  }
  /** Plain-language notes on exactly what is real vs guesstimated (for honesty/audit). */
  estimateNotes: {
    sensors: string
    population: string
  }
  /** Per-city summaries (legend, present-day tallies, emphasis). */
  cities: ProgrammeCity[]
  /** Every sensor across the whole network (real position + type; tagged by city). */
  sensors: ProgrammeSensor[]
  /** The network-wide per-year growth curve. Ordered startYear → endYear. */
  timeline: ProgrammeYear[]
}
