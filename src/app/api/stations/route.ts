/**
 * route.ts — GET /api/stations?city=<slug>&parameter=<name>&source=<snapshot|live>
 *
 * Purpose:
 *   Server-side route handler that exposes normalized air-quality stations to the client. It
 *   is the public face of the OpenAQ data core: it validates input, resolves the data SOURCE,
 *   and returns Station[] as JSON. The OpenAQ key never crosses this boundary — only normalized
 *   data goes to the client.
 *
 * Data source (committed data strategy: snapshot-default):
 *   - DEFAULT (no `source`, or `source=snapshot`): serve the committed snapshot for the city+
 *     parameter (src/lib/openaq/snapshot.ts) — deterministic demo data with FROZEN freshness. If
 *     no snapshot is committed for that city+parameter, fall through to a live fetch (so the route
 *     still works for registry cities that were never captured).
 *   - `source=live`: fetch live OpenAQ (the capture mechanism + the future user-facing go-live
 *     toggle). On a live failure, fall BACK to the committed snapshot when one exists; only when
 *     there is no snapshot to fall back to does a live failure surface as a 502.
 *   The resolved source + snapshot capture instant are returned as response headers
 *   (`x-data-source`, `x-snapshot-captured-at`) so the client can render the honest
 *   "Snapshot · data as of <date>" label without changing the JSON body (still a bare Station[]).
 *
 * Parameter surface:
 *   This route is intentionally narrowed to the parameters the toolkit UI can DISPLAY — pm25 and
 *   pm10 (see ROUTE_PARAMETERS). NO2/O3/SO2/CO have no agreed AQI banding in the UI layer
 *   (aqiParameters.ts), so accepting them here would let a caller request data the UI cannot
 *   classify. Other values are rejected with the existing 400 pattern. (The data-core types still
 *   define the broader PARAMETER_NAMES set; the route is deliberately a subset of it.)
 *
 * Key export: GET (Next.js App Router route handler)
 *
 * External dependencies:
 *   - ../../../lib/openaq/adapter (fetchStations)
 *   - ../../../lib/openaq/cities (isKnownCity, CITY_SLUGS)
 *   - ../../../lib/openaq/snapshot (getSnapshot)
 *
 * Errors are returned as safe JSON. Internal details and the API key are never leaked:
 *   - 400 for unknown city, unknown/unsupported parameter, or unknown source (with valid values)
 *   - 502 for a live failure with no snapshot fallback available
 */

import { NextResponse } from 'next/server'
import { fetchStations } from '../../../lib/openaq/adapter'
import { CITY_SLUGS, isKnownCity } from '../../../lib/openaq/cities'
import { getSnapshot } from '../../../lib/openaq/snapshot'

/**
 * No-op while this handler reads searchParams (a dynamic route ignores route-level revalidate).
 * The real 10-minute cache is the per-fetch `next: { revalidate: 600 }` in client.ts. Kept as a
 * documented fallback that would take effect only if the handler stops reading the query string.
 */
export const revalidate = 600

/**
 * Parameters this route accepts — the UI-displayable subset. pm25/pm10 are the only parameters with
 * an agreed AQI banding in aqiParameters.ts; everything else is rejected (NO2 is present-but-disabled
 * in the UI, O3/SO2/CO are not surfaced at all). Narrower than the data-core's PARAMETER_NAMES on
 * purpose — see file header.
 */
const ROUTE_PARAMETERS = ['pm25', 'pm10'] as const
type RouteParameter = (typeof ROUTE_PARAMETERS)[number]

/** The two data sources a caller may request. `snapshot` is the default. */
const DATA_SOURCES = ['snapshot', 'live'] as const
type DataSource = (typeof DATA_SOURCES)[number]

/** Narrow an arbitrary string to a route-accepted parameter. */
function isRouteParameter(value: string): value is RouteParameter {
  return (ROUTE_PARAMETERS as readonly string[]).includes(value)
}

/** Narrow an arbitrary string to a known data source. */
function isDataSource(value: string): value is DataSource {
  return (DATA_SOURCES as readonly string[]).includes(value)
}

/** Build a Station[] JSON response carrying the source-provenance headers. */
function stationsResponse(
  stations: unknown,
  source: 'snapshot' | 'live',
  capturedAt: string | null,
): NextResponse {
  const headers: Record<string, string> = { 'x-data-source': source }
  if (capturedAt !== null) {
    headers['x-snapshot-captured-at'] = capturedAt
  }
  return NextResponse.json(stations, { headers })
}

/**
 * Handle GET /api/stations. Reads `city`, `parameter`, and optional `source` from the query string,
 * validates all three, then resolves the data per the source policy in the file header. Validation
 * runs before any network call so bad input fails fast as a 400 and never reaches the upstream.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const parameter = searchParams.get('parameter')
  const sourceParam = searchParams.get('source')

  if (city === null || !isKnownCity(city)) {
    return NextResponse.json(
      {
        error: 'Unknown or missing city.',
        validCities: CITY_SLUGS,
      },
      { status: 400 },
    )
  }

  if (parameter === null || !isRouteParameter(parameter)) {
    return NextResponse.json(
      {
        error: 'Unknown or unsupported parameter.',
        validParameters: ROUTE_PARAMETERS,
      },
      { status: 400 },
    )
  }

  // Source defaults to 'snapshot' when omitted; an explicit but unknown value is a 400.
  if (sourceParam !== null && !isDataSource(sourceParam)) {
    return NextResponse.json(
      {
        error: 'Unknown source.',
        validSources: DATA_SOURCES,
      },
      { status: 400 },
    )
  }
  const source: DataSource = sourceParam === null ? 'snapshot' : sourceParam

  // ── snapshot-default path ────────────────────────────────────────────────────
  // Serve the committed snapshot when one exists; otherwise fall through to live (so registry
  // cities that were never captured still resolve).
  if (source === 'snapshot') {
    const snapshot = getSnapshot(city, parameter)
    if (snapshot !== null) {
      return stationsResponse(snapshot.stations, 'snapshot', snapshot.capturedAt)
    }
    // No committed snapshot for this city+parameter — fall through to a live fetch.
    try {
      const stations = await fetchStations(city, parameter)
      return stationsResponse(stations, 'live', null)
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch station data from the upstream provider.' },
        { status: 502 },
      )
    }
  }

  // ── live path (explicit ?source=live) ────────────────────────────────────────
  // Fetch live; on failure, fall back to the committed snapshot when one exists rather than erroring.
  try {
    const stations = await fetchStations(city, parameter)
    return stationsResponse(stations, 'live', null)
  } catch {
    const snapshot = getSnapshot(city, parameter)
    if (snapshot !== null) {
      return stationsResponse(snapshot.stations, 'snapshot', snapshot.capturedAt)
    }
    // Swallow the underlying error detail on purpose — it may reference upstream internals.
    return NextResponse.json(
      { error: 'Failed to fetch station data from the upstream provider.' },
      { status: 502 },
    )
  }
}
