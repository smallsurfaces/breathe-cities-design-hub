/**
 * index.ts — the AQ Network city registry.
 *
 * Purpose
 *   The single lookup the dynamic route and the index page read to find a city's profile.
 *   This is the seam that makes the concept data-driven: to add the NEXT city (e.g. London)
 *   you author one CityProfile file and add ONE line to CITY_PROFILES here — no component
 *   or route changes. The route resolves a [city] slug through getCityProfile(); an unknown
 *   slug returns undefined so the route can render a 404.
 *
 * Key exports:
 *   - CITY_PROFILES — every member profile, in display order
 *   - CITY_PROFILE_SLUGS — slugs only (for generateStaticParams + the index list)
 *   - getCityProfile(slug) — lookup, undefined when unknown
 *
 * External dependencies: ../types (CityProfile), ./accra (the Accra profile),
 *   ./validate-slugs (the build-time OpenAQ-slug guard). Adding a city adds one import + one
 *   array entry here.
 *
 * BUILD-TIME GUARD: immediately after CITY_PROFILES is defined, this module calls
 *   assertOpenaqSlugsExist(CITY_PROFILES) at its top level. Because this file is imported by
 *   the dynamic route during `next build` (generateStaticParams + the page), that call runs at
 *   build/SSG time and THROWS — failing the build loudly — if any profile's openaqCitySlug is
 *   not a member of the OpenAQ city registry. This is not a runtime check.
 */

import type { CityProfile } from '../types'
import { accraProfile } from './accra'
import { londonProfile } from './london'
import { assertOpenaqSlugsExist } from './validate-slugs'

/**
 * Every AQ Network member profile, in the order they should appear on the index.
 * NEXT CITY = import its profile above and add it to this array. That is the whole change.
 */
export const CITY_PROFILES: readonly CityProfile[] = [
  accraProfile,
  londonProfile,
] as const

// Build-time side effect: validate every profile's OpenAQ slug against the OpenAQ registry.
// Runs at module evaluation (build/SSG time via the route's import chain) and throws — aborting
// `next build` — on any unknown slug. A mistyped slug would otherwise render a fake runtime
// "network error" (BUG 1 from the Accra bug-test). Loud CI failure by design.
assertOpenaqSlugsExist(CITY_PROFILES)

/** All registered profile slugs — used by generateStaticParams and the index list. */
export const CITY_PROFILE_SLUGS: readonly string[] = CITY_PROFILES.map(
  (profile) => profile.slug,
)

/**
 * Look up a city profile by slug. Returns undefined for an unknown slug so the dynamic
 * route can respond with notFound() rather than throwing.
 */
export function getCityProfile(slug: string): CityProfile | undefined {
  return CITY_PROFILES.find((profile) => profile.slug === slug)
}
