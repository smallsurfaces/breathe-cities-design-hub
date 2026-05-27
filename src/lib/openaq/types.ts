/**
 * types.ts — OpenAQ v3 response types + normalized Station model
 *
 * Purpose:
 *   Type definitions for the subset of the OpenAQ v3 API this app consumes, plus a
 *   normalized `Station` model that the rest of the codebase reads instead of the raw
 *   upstream shape. Splitting "upstream wire types" from "our domain model" keeps the
 *   adapter as the single place that knows about OpenAQ's quirks.
 *
 * Key exports:
 *   - OpenAQ wire types: OpenAQParameter, OpenAQSensor, OpenAQLocation, OpenAQLatestValue,
 *     OpenAQListResponse<T>
 *   - Domain model: Station, StationParameterReading, StationQuality, ParameterName
 *   - PARAMETER_NAMES (the known parameter keys we accept)
 *
 * External dependencies: none (pure type module).
 *
 * Upstream facts encoded here (probe-verified against the live API, not docs):
 *   - Readings are NOT present on /locations. A location lists which `sensors` exist
 *     (one per parameter) but values come from /locations/{id}/latest, matched by sensorsId.
 *   - Per-sensor staleness is rampant; freshness is derived per parameter sensor, never
 *     from the location's headline datetimeLast.
 */

// ----------------------------------------------------------------------------
// Known parameters
// ----------------------------------------------------------------------------

/**
 * The air-quality parameters this app accepts as query input and projects into Station.
 * Keyed on the OpenAQ `parameter.name` string (not the numeric id — some ids have aliases,
 * so the name is the stable join key per the upstream probe).
 */
export const PARAMETER_NAMES = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'] as const

/** Union of accepted parameter names — used to validate the `?parameter=` query param. */
export type ParameterName = (typeof PARAMETER_NAMES)[number]

// ----------------------------------------------------------------------------
// OpenAQ v3 wire types (the subset we read)
// ----------------------------------------------------------------------------

/** OpenAQ parameter descriptor as embedded in a location's sensor entry. */
export type OpenAQParameter = {
  id: number
  name: string
  units: string
  displayName: string
}

/** A single OpenAQ sensor on a location — one sensor exists per measured parameter. */
export type OpenAQSensor = {
  id: number
  name: string
  parameter: OpenAQParameter
}

/** Geographic coordinate pair as returned by OpenAQ ({latitude, longitude} order). */
export type OpenAQCoordinates = {
  latitude: number
  longitude: number
}

/** Attribution block nested inside a license entry; may be absent. */
export type OpenAQAttribution = {
  name: string
  url: string | null
}

/** A license entry on a location. The whole `licenses` array may be null upstream. */
export type OpenAQLicense = {
  id: number
  name: string
  attribution: OpenAQAttribution | null
  dateFrom: string | null
  dateTo: string | null
}

/** Named entity blocks (country / owner / provider) on a location. */
export type OpenAQNamedEntity = {
  id: number
  name: string
}

/** Country block on a location (carries an ISO code in addition to id/name). */
export type OpenAQCountry = {
  id: number
  code: string
  name: string
}

/**
 * A location from GET /v3/locations. Note: this does NOT carry readings — `sensors` only
 * declares which parameters are measured. Values must be fetched from /locations/{id}/latest.
 */
export type OpenAQLocation = {
  id: number
  name: string
  locality: string | null
  timezone: string
  country: OpenAQCountry
  owner: OpenAQNamedEntity
  provider: OpenAQNamedEntity
  isMobile: boolean
  isMonitor: boolean
  instruments: OpenAQNamedEntity[]
  sensors: OpenAQSensor[]
  coordinates: OpenAQCoordinates
  licenses: OpenAQLicense[] | null
  /**
   * First/last seen timestamps. Probe-verified: the live v3 /locations endpoint returns these as
   * `{utc, local}` objects (OpenAQDatetime), NOT bare strings — `.utc` is the source of truth.
   * (`OpenAQDatetime` is declared below; the type alias is hoisted so the forward reference is fine.)
   * Either may be null. Earlier this was typed `string | null`, which silently mis-described the
   * wire shape — corrected here so consumers read `.utc` rather than coercing an object to a string.
   */
  datetimeFirst: OpenAQDatetime | null
  datetimeLast: OpenAQDatetime | null
}

/**
 * Datetime pair on a latest value. `utc` is the freshness source of truth; `local` is the
 * station-local rendering and is not used for staleness math.
 */
export type OpenAQDatetime = {
  utc: string
  local: string
}

/**
 * A single latest reading from GET /v3/locations/{id}/latest. The reading is joined back to
 * a location's sensor via `sensorsId` — that is how we know which parameter this value is for.
 */
export type OpenAQLatestValue = {
  datetime: OpenAQDatetime
  value: number
  coordinates: OpenAQCoordinates
  sensorsId: number
  locationsId: number
}

/** Generic OpenAQ list envelope. The payloads we use carry their rows in `results`. */
export type OpenAQListResponse<T> = {
  results: T[]
}

// ----------------------------------------------------------------------------
// Normalized domain model
// ----------------------------------------------------------------------------

/**
 * Quality tier for a station. Mapped from OpenAQ's `isMonitor` flag:
 * reference-grade monitor -> 'high', everything else -> 'low'. This mirrors the existing
 * prototype's two-tier marker system (triangle = high, circle = low).
 */
export type StationQuality = 'high' | 'low'

/**
 * A single parameter's reading on a normalized station.
 * `ageHours` and `isStale` are derived from THIS reading's datetime.utc — never from the
 * location headline date — because per-sensor staleness is rampant in the upstream data.
 */
export type StationParameterReading = {
  /** Measured concentration value for the parameter. */
  value: number
  /** Unit string from the parameter descriptor (e.g. "µg/m³"). */
  unit: string
  /** ISO-8601 UTC timestamp of this specific reading. */
  datetimeUtc: string
  /**
   * Hours between now and the reading timestamp, or `null` when the timestamp could not be
   * parsed (unknown age). `null` serializes honestly over JSON; an unknown age is always
   * treated as stale (see `isStale`).
   */
  ageHours: number | null
  /** True when the reading is stale: either its age is unknown (`null`) or it exceeds the threshold. */
  isStale: boolean
}

/**
 * Normalized station — the domain model the rest of the app consumes instead of raw OpenAQ.
 * `coordinates` is [longitude, latitude] (GeoJSON / Mapbox order), converted from OpenAQ's
 * {latitude, longitude}. `parameters` is keyed by parameter name and only contains parameters
 * that actually returned a reading.
 */
export type Station = {
  id: string
  name: string
  locality: string | null
  /** [longitude, latitude] — Mapbox/GeoJSON order. */
  coordinates: [number, number]
  quality: StationQuality
  provider: string
  /**
   * The operating organisation that OWNS the station (OpenAQ location.owner.name). Distinct from
   * `provider` (the data feed/network). Often a generic placeholder upstream
   * ("Unknown Governmental Organization") — callers decide whether to show it or prefer provider.
   * A non-null string (OpenAQ always returns an owner block, even when generic).
   */
  owner: string
  /**
   * The station's first-seen timestamp (OpenAQ location.datetimeFirst, ISO-8601 UTC) — i.e. when
   * the station started reporting to the network. `null` when upstream does not expose it for this
   * location. Surfaced as the station's "start date"; never fabricated when absent.
   */
  firstSeen: string | null
  /** Human-readable attribution string built from licenses; null when none present. */
  attribution: string | null
  parameters: Record<string, StationParameterReading>
}

// ----------------------------------------------------------------------------
// Location metadata model (lightweight — no readings, no /latest calls)
// ----------------------------------------------------------------------------

/**
 * Lightweight location metadata for map rendering. Fetched from a single
 * /locations?bbox=... call without any per-station /latest requests, making it
 * far cheaper than Station for views that only need location, ownership, and
 * parameter metadata (e.g. the roadmap city map hero).
 */
export type LocationMeta = {
  id: number
  name: string
  locality: string | null
  /** [longitude, latitude] — Mapbox/GeoJSON order. */
  coordinates: [number, number]
  owner: string
  provider: string
  /**
   * The better of owner vs provider for display purposes. Uses owner when it is
   * a real org name (e.g. "Breathe Accra"); falls back to title-cased provider
   * when owner is generic ("Unknown Governmental Organization", etc.).
   */
  displayLabel: string
  isMonitor: boolean
  instruments: string[]
  parameters: string[]
  datetimeFirst: string | null
  datetimeLast: string | null
}
