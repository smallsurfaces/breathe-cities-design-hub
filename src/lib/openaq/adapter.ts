/**
 * adapter.ts — OpenAQ -> normalized Station, and Station -> legacy Sensor projection
 *
 * Purpose:
 *   The normalization layer. It owns every quirk of the OpenAQ upstream so no other module
 *   has to: the two-step locations+latest fetch, the sensorsId join, per-sensor staleness
 *   math, coordinate reordering, quality mapping, and attribution assembly. Output is the
 *   clean `Station` domain model. A second projection (`toLegacySensors`) maps Station back to
 *   the existing prototype's `Sensor` shape so current triangulation keeps working unchanged.
 *
 * Key exports: fetchStations, toLegacySensors, MAX_STATIONS_PER_CITY, STALE_THRESHOLD_HOURS
 *
 * External dependencies:
 *   - ./client (network), ./cities (registry), ./types (domain + wire types)
 *   - ./sensors (Sensor type — imported, never modified; relocated from
 *     direction-1-mapbox-v2/ into src/lib/openaq/ on the Option A revert)
 *
 * Upstream facts driving this file (probe-verified, not docs):
 *   - Readings are NOT on /locations. We fetch locations, then call /locations/{id}/latest
 *     per location and join the value to a sensor by `sensorsId`.
 *   - Per-sensor staleness is rampant: a location's headline datetimeLast can be today while
 *     its pm25 sensor last reported years ago. Freshness is therefore derived from the
 *     SPECIFIC parameter sensor's reading datetime.utc, never the location headline.
 *   - Policy is "show all, flag age": fetchStations returns stale stations flagged isStale;
 *     it does NOT drop them. Stale exclusion happens later, only in toLegacySensors when the
 *     caller asks (to keep stale values out of a triangulated average).
 */

import { getLocationLatest, getLocationsByBbox } from './client'
import { getCity } from './cities'
import type {
  LocationMeta,
  OpenAQLocation,
  OpenAQSensor,
  Station,
  StationParameterReading,
} from './types'
// Sensor is the existing prototype's model. Imported read-only — do not modify sensors.ts.
// Relocated from src/app/direction-1-mapbox-v2/sensors.ts into src/lib/openaq/sensors.ts on the
// Option A revert (2026-05-27); both this adapter and the triangulation module are now its
// stable consumers.
import type { Sensor } from './sensors'

/**
 * Hard cap on stations fetched per city. Each station costs one extra /latest request, so the
 * cap bounds upstream calls against the 60/min rate limit. Named const so the trade-off is
 * explicit and tunable in one place.
 */
export const MAX_STATIONS_PER_CITY = 30

/** A reading older than this many hours is flagged stale. */
export const STALE_THRESHOLD_HOURS = 24

/** Page size requested from /locations. We over-fetch then cap, since not every location has
 *  a sensor for the requested parameter. 100 is OpenAQ's typical max page size. */
const LOCATIONS_PAGE_LIMIT = 100

/** Milliseconds in one hour — used for age math. */
const MS_PER_HOUR = 1000 * 60 * 60

/**
 * Max number of /latest requests issued at once. The /latest calls are the bulk of upstream
 * traffic (one per candidate station). Firing all MAX_STATIONS_PER_CITY at once can momentarily
 * burst past OpenAQ's 60/min limit and trip 429s on a normal single-city request, so they are
 * processed in bounded batches instead. Small enough to stay under the burst limit, large
 * enough to keep latency reasonable.
 */
const LATEST_FETCH_CONCURRENCY = 6

/**
 * Run an async mapper over `items` in sequential batches of at most `batchSize`, preserving
 * input order in the output. Used to bound concurrent /latest requests so a single city fetch
 * does not burst past the upstream rate limit. Within a batch, requests run in parallel.
 *
 * Failure isolation: each item is settled independently (Promise.allSettled), so a single
 * rejected mapper call — e.g. a transient 5xx or non-429 4xx on one location's /latest — drops
 * only that item (mapped to null) instead of rejecting the whole batch and collapsing the city.
 * This upholds the file's "show all, flag age" policy: one bad station never loses the healthy
 * ones. Callers filter the nulls out (the same filter that removes intentional null results).
 */
async function mapInBatches<TItem, TResult>(
  items: TItem[],
  batchSize: number,
  mapper: (item: TItem) => Promise<TResult>,
): Promise<(TResult | null)[]> {
  const results: (TResult | null)[] = []
  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize)
    const settled = await Promise.allSettled(batch.map((item) => mapper(item)))
    for (const outcome of settled) {
      results.push(outcome.status === 'fulfilled' ? outcome.value : null)
    }
  }
  return results
}

/**
 * Find a location's sensor for a given parameter name. Returns undefined when the location
 * does not measure that parameter. Match is on parameter.name (the stable join key) — not the
 * numeric id, which can be aliased upstream.
 */
function findSensorForParameter(
  location: OpenAQLocation,
  parameterName: string,
): OpenAQSensor | undefined {
  return location.sensors.find((sensor) => sensor.parameter.name === parameterName)
}

/**
 * Compute how many hours ago a reading was taken, relative to `now`. Returns `null` when the
 * reading cannot be dated.
 *
 * Two guards, in order:
 *   1. Unparseable timestamp guard. An empty / malformed / undefined datetime makes
 *      Date(...).getTime() return NaN. Returning a real number here would be a silent lie: the
 *      old `ageMs > 0 ? ... : 0` branch turned NaN into 0, labelling a reading with a broken
 *      timestamp as brand-new — the opposite of safe. We instead return `null` (unknown age),
 *      which the caller always treats as stale (never fresh), so a reading we cannot date is
 *      never trusted as current. `null` is also honest over JSON, where the old +Infinity
 *      serialized to `null` anyway while the type still claimed `number`. Detected via
 *      Number.isFinite.
 *   2. Clock-skew clamp (the legitimate original behaviour). A genuinely valid timestamp that
 *      sits slightly in the future (upstream clock skew) yields ageMs <= 0; clamp to 0 so age is
 *      never negative. This only fires for parseable timestamps.
 */
function computeAgeHours(datetimeUtc: string, now: number): number | null {
  const readingMs = new Date(datetimeUtc).getTime()
  if (!Number.isFinite(readingMs)) {
    // Cannot date this reading — unknown age, which the caller always flags stale (never fresh).
    return null
  }
  const ageMs = now - readingMs
  return ageMs > 0 ? ageMs / MS_PER_HOUR : 0
}

/**
 * Map OpenAQ's monitor flag to our two-tier quality. Reference-grade monitors are 'high';
 * everything else (low-cost sensors, community nodes) is 'low'. Mirrors the prototype's
 * triangle-vs-circle marker distinction.
 */
function mapQuality(isMonitor: boolean): Station['quality'] {
  return isMonitor ? 'high' : 'low'
}

/**
 * Build a human-readable attribution string from a location's licenses. licenses may be null
 * (e.g. Accra), and an entry's attribution may itself be null — both are handled by returning
 * null when nothing usable is present. Multiple attributions are joined for completeness.
 */
function buildAttribution(location: OpenAQLocation): string | null {
  if (location.licenses === null) {
    return null
  }
  const names = location.licenses
    .map((license) => license.attribution?.name)
    .filter((name): name is string => name !== undefined && name.length > 0)
  return names.length > 0 ? names.join(', ') : null
}

/**
 * Fetch normalized stations for a city + parameter.
 *
 * Two-step (per the upstream shape):
 *   1. List locations in the city bbox, keep only those that declare a sensor for the
 *      requested parameter, then cap to MAX_STATIONS_PER_CITY to bound /latest calls.
 *   2. For each kept location, fetch /latest and join the value whose sensorsId matches that
 *      location's parameter sensor. Compute ageHours + isStale from that reading's datetime.utc.
 *
 * Returns ALL matched stations including stale ones (policy: show all, flag age). A location is
 * skipped only when its parameter sensor reported no latest value at all (nothing to show).
 *
 * Throws (via the client) if the API key is missing or the upstream fails — the route handler
 * turns those into safe HTTP errors.
 */
export async function fetchStations(
  citySlug: string,
  parameterName: string,
): Promise<Station[]> {
  const city = getCity(citySlug)
  if (city === undefined) {
    // Defensive: the route validates first, but the adapter must not assume a valid slug.
    throw new Error(`Unknown city slug: ${citySlug}`)
  }

  const locations = await getLocationsByBbox(city.bbox, { limit: LOCATIONS_PAGE_LIMIT })

  // Step 1: keep only locations that measure the requested parameter, then cap.
  const candidates = locations
    .filter((location) => findSensorForParameter(location, parameterName) !== undefined)
    .slice(0, MAX_STATIONS_PER_CITY)

  // Step 2: fetch latest per candidate (in bounded batches to respect the rate limit) and
  // join by sensorsId. `now` is captured once so every station's age is measured against the
  // same instant.
  const now = Date.now()
  const settled = await mapInBatches(
    candidates,
    LATEST_FETCH_CONCURRENCY,
    async (location): Promise<Station | null> => {
      const sensor = findSensorForParameter(location, parameterName)
      if (sensor === undefined) {
        return null
      }

      const latestValues = await getLocationLatest(location.id)
      const reading = latestValues.find((value) => value.sensorsId === sensor.id)
      if (reading === undefined) {
        // The parameter sensor exists but reported no latest value — nothing to display.
        return null
      }

      // Runtime validation of the joined reading. OpenAQ types value as `number` upstream, but
      // occasionally emits null/NaN for a sensor mid-calibration. A non-finite value violates
      // StationParameterReading.value (and would poison downstream triangulation/AQI with NaN),
      // and there is nothing to plot, so drop the whole station (the trailing filter removes it).
      if (!Number.isFinite(reading.value)) {
        return null
      }

      // A present-but-unparseable datetime is handled inside computeAgeHours: the value is kept
      // but its age comes back null (unknown) and is flagged stale (never fresh) — only a
      // non-finite VALUE drops the station.
      const ageHours = computeAgeHours(reading.datetime.utc, now)
      const parameterReading: StationParameterReading = {
        value: reading.value,
        unit: sensor.parameter.units,
        datetimeUtc: reading.datetime.utc,
        ageHours,
        // Unknown age (null) is always stale; otherwise stale once past the threshold.
        isStale: ageHours === null || ageHours > STALE_THRESHOLD_HOURS,
      }

      const station: Station = {
        id: String(location.id),
        name: location.name,
        locality: location.locality,
        // OpenAQ gives {latitude, longitude}; convert to [lng, lat] for Mapbox/GeoJSON.
        coordinates: [location.coordinates.longitude, location.coordinates.latitude],
        quality: mapQuality(location.isMonitor),
        provider: location.provider.name,
        // Owner (operating org) and first-seen date come from the location block. Owner is always a
        // non-null string upstream (may be a generic placeholder). datetimeFirst is an {utc, local}
        // object (probe-verified) — take .utc as the ISO start date; null when upstream omits it.
        // Never fabricated.
        owner: location.owner.name,
        firstSeen: location.datetimeFirst?.utc ?? null,
        attribution: buildAttribution(location),
        parameters: {
          [parameterName]: parameterReading,
        },
      }
      return station
    },
  )

  // Drop every null: locations whose parameter sensor had no reading, whose reading value was
  // non-finite (dropped above), or whose /latest call failed (settled to null in mapInBatches).
  return settled.filter((station): station is Station => station !== null)
}

/**
 * Title-case a string by capitalizing the first letter of each word.
 * Used to clean up lowercase provider names like "london stationary" -> "London Stationary".
 */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Fetch lightweight location metadata for a city. Uses a single /locations?bbox=... call
 * with no per-station /latest requests, making it far cheaper than fetchStations for views
 * that only need location, ownership, and parameter metadata (e.g. roadmap city map hero
 * with ownership coloring and legends).
 *
 * Returns LocationMeta[] — no readings, no staleness math, no rate-limit concern.
 */
export async function fetchLocationMetas(citySlug: string): Promise<LocationMeta[]> {
  const city = getCity(citySlug)
  if (city === undefined) {
    throw new Error(`Unknown city slug: ${citySlug}`)
  }

  const locations = await getLocationsByBbox(city.bbox, { limit: 100 })

  return locations.map((loc) => {
    // Pick the better of owner vs provider for display. Owner is often
    // "Unknown Governmental Organization" etc. — provider has real names
    // like "London Air Quality Network", "EEA", "Air4Thai". But for some
    // cities (Accra), owner IS the good label ("Breathe Accra", "EPA Ghana").
    const displayLabel = loc.owner.name.startsWith('Unknown')
      ? titleCase(loc.provider.name)
      : loc.owner.name

    return {
      id: loc.id,
      name: loc.name,
      locality: loc.locality,
      coordinates: [loc.coordinates.longitude, loc.coordinates.latitude] as [number, number],
      owner: loc.owner.name,
      provider: loc.provider.name,
      displayLabel,
      isMonitor: loc.isMonitor,
      instruments: loc.instruments.map((i) => i.name),
      parameters: loc.sensors.map((s) => s.parameter.displayName),
      // datetimeFirst/Last are {utc, local} objects upstream (probe-verified); LocationMeta carries
      // the ISO string, so take .utc. (Previously these assigned the raw object into a string-typed
      // field — a latent mismatch the corrected wire type now surfaces; .utc is the right value.)
      datetimeFirst: loc.datetimeFirst?.utc ?? null,
      datetimeLast: loc.datetimeLast?.utc ?? null,
    }
  })
}

/**
 * Project normalized stations to the existing prototype's `Sensor` shape so current
 * triangulation/AQI code keeps working without changes. The `pm25` field on Sensor is the
 * legacy carrier for "the selected parameter's value" — it holds whichever parameter was
 * requested, not necessarily PM2.5.
 *
 * When `excludeStale` is true, stale stations are omitted. This is the knob that keeps
 * out-of-date readings out of any triangulated average; when false, all stations pass through
 * (e.g. for a raw map render that flags age visually instead of hiding it).
 *
 * Stations missing the requested parameter are skipped defensively (fetchStations should never
 * produce one, but the projection must not assume it).
 */
export function toLegacySensors(
  stations: Station[],
  parameterName: string,
  excludeStale: boolean,
): Sensor[] {
  const sensors: Sensor[] = []
  for (const station of stations) {
    const reading = station.parameters[parameterName]
    if (reading === undefined) {
      continue
    }
    if (excludeStale && reading.isStale) {
      continue
    }
    sensors.push({
      id: station.id,
      name: station.name,
      coordinates: station.coordinates,
      quality: station.quality,
      pm25: reading.value,
    })
  }
  return sensors
}
