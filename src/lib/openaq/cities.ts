/**
 * cities.ts — Typed city registry for OpenAQ data fetching
 *
 * Purpose:
 *   The single source of truth for which cities the data core can serve. Each city carries
 *   the map framing (center, zoom) and the OpenAQ query bbox. Adding a new city is one entry
 *   in CITIES — no other file needs to change.
 *
 * Key exports: City, CITIES, getCity, isKnownCity, CITY_SLUGS
 * External dependencies: none.
 *
 * Why bbox, not radius: OpenAQ v3 /locations supports a `radius` filter but caps it at 25 km,
 * which is smaller than these cities. bbox is the only geographic filter that reliably scopes
 * a whole city (probe-verified — parameter-scoped latest endpoints ignore bbox entirely).
 * bbox order is [minLon, minLat, maxLon, maxLat].
 */

/**
 * A city served by the data core.
 * `center` is [longitude, latitude] (Mapbox order). `bbox` is [minLon, minLat, maxLon, maxLat]
 * (the order OpenAQ's /locations endpoint expects).
 */
export type City = {
  slug: string
  name: string
  center: [number, number]
  zoom: number
  bbox: [number, number, number, number]
}

/**
 * Registry of supported cities. bboxes are probe-verified against the live OpenAQ API
 * (London returns >100 locations; Accra returns 83). Centers/zooms are chosen to frame each
 * city sensibly on the existing Mapbox view.
 */
export const CITIES: readonly City[] = [
  {
    slug: 'paris',
    name: 'Paris',
    center: [2.349, 48.864],
    zoom: 11,
    bbox: [2.22, 48.81, 2.47, 48.92],
  },
  {
    slug: 'london',
    name: 'London',
    center: [-0.118, 51.509],
    zoom: 10.5,
    bbox: [-0.51, 51.287, 0.334, 51.692],
  },
  {
    slug: 'mexico-city',
    name: 'Mexico City',
    center: [-99.133, 19.432],
    zoom: 10,
    bbox: [-99.35, 19.15, -98.95, 19.65],
  },
  {
    slug: 'milan',
    name: 'Milan',
    center: [9.190, 45.464],
    zoom: 11.5,
    bbox: [9.05, 45.38, 9.35, 45.55],
  },
  {
    slug: 'brussels',
    name: 'Brussels',
    center: [4.352, 50.847],
    zoom: 11.5,
    bbox: [4.25, 50.78, 4.48, 50.92],
  },
  {
    slug: 'jakarta',
    name: 'Jakarta',
    center: [106.845, -6.208],
    zoom: 10.5,
    bbox: [106.65, -6.40, 107.05, -6.05],
  },
  {
    slug: 'johannesburg',
    name: 'Johannesburg',
    center: [28.047, -26.204],
    zoom: 10.5,
    bbox: [27.85, -26.40, 28.25, -26.00],
  },
  {
    slug: 'accra',
    name: 'Accra',
    center: [-0.187, 5.604],
    zoom: 11,
    bbox: [-0.35, 5.45, 0.1, 5.85],
  },
  {
    slug: 'nairobi',
    name: 'Nairobi',
    center: [36.817, -1.286],
    zoom: 11,
    bbox: [36.65, -1.45, 37.00, -1.10],
  },
  {
    slug: 'bangkok',
    name: 'Bangkok',
    center: [100.501, 13.756],
    zoom: 10.5,
    bbox: [100.30, 13.55, 100.75, 13.95],
  },
  {
    slug: 'bogota',
    name: 'Bogota',
    center: [-74.072, 4.711],
    zoom: 11,
    bbox: [-74.25, 4.50, -73.90, 4.85],
  },
  {
    slug: 'rio-de-janeiro',
    name: 'Rio de Janeiro',
    center: [-43.173, -22.907],
    zoom: 10.5,
    bbox: [-43.45, -23.10, -42.90, -22.70],
  },
  {
    slug: 'sofia',
    name: 'Sofia',
    center: [23.321, 42.698],
    zoom: 11.5,
    bbox: [23.15, 42.60, 23.50, 42.80],
  },
  {
    slug: 'warsaw',
    name: 'Warsaw',
    center: [21.012, 52.230],
    zoom: 11,
    bbox: [20.85, 52.10, 21.20, 52.35],
  },
] as const

/** All registered city slugs — convenient for error messages and validation. */
export const CITY_SLUGS: readonly string[] = CITIES.map((city) => city.slug)

/**
 * Look up a city by slug. Returns undefined for unknown slugs so callers can decide how to
 * respond (the route handler turns this into an HTTP 400 rather than throwing).
 */
export function getCity(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug)
}

/** Type guard: true when `slug` matches a registered city. */
export function isKnownCity(slug: string): boolean {
  return CITIES.some((city) => city.slug === slug)
}
