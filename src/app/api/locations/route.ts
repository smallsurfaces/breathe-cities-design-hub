/**
 * route.ts — GET /api/locations?city=<slug>
 *
 * Purpose:
 *   Server-side route handler that returns lightweight location metadata for a city.
 *   Unlike /api/stations (which makes per-station /latest calls), this endpoint uses a
 *   single /locations?bbox=... upstream call, making it far cheaper for views that only
 *   need location, ownership, and parameter metadata (no live readings).
 *
 * Key export: GET (Next.js App Router route handler)
 *
 * External dependencies:
 *   - ../../../lib/openaq/adapter (fetchLocationMetas)
 *   - ../../../lib/openaq/cities (isKnownCity, CITY_SLUGS)
 *
 * Caching:
 *   Same pattern as /api/stations — route-level revalidate is a no-op for dynamic routes
 *   that read searchParams; the real cache is the per-fetch next.revalidate in client.ts.
 *
 * Errors:
 *   - 400 for unknown/missing city (with valid city list)
 *   - 502 for upstream failures (details swallowed for safety)
 */

import { NextResponse } from 'next/server'
import { fetchLocationMetas } from '../../../lib/openaq/adapter'
import { CITY_SLUGS, isKnownCity } from '../../../lib/openaq/cities'

/**
 * No-op while this handler reads searchParams (dynamic route). The real 10-minute cache
 * is the per-fetch next.revalidate in client.ts. Kept as documented fallback.
 */
export const revalidate = 600

/**
 * Handle GET /api/locations. Reads `city` from the query string, validates against the
 * registry, and returns LocationMeta[] as JSON. No parameter filter needed — all parameters
 * are included in the metadata.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  if (city === null || !isKnownCity(city)) {
    return NextResponse.json(
      { error: 'Unknown or missing city.', validCities: CITY_SLUGS },
      { status: 400 },
    )
  }

  try {
    const locations = await fetchLocationMetas(city)
    return NextResponse.json(locations)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch location data from the upstream provider.' },
      { status: 502 },
    )
  }
}
