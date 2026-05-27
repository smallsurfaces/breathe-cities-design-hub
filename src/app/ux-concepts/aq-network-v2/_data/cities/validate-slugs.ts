/**
 * validate-slugs.ts — BUILD-TIME guard: every CityProfile's OpenAQ slug must be real.
 *
 * Purpose
 *   Each CityProfile.sensorProgramme.openaqCitySlug is used to fetch the LIVE sensor count
 *   from OpenAQ. If a slug is mistyped (e.g. "accraa"), the live fetch silently fails and the
 *   profile renders a fake "network error" — a bug a future city could ship without noticing
 *   (this was BUG 1 from the Accra bug-test). This module asserts, at BUILD time, that every
 *   registered profile's openaqCitySlug is a member of the OpenAQ city registry
 *   (src/lib/openaq/cities.ts), and FAILS THE BUILD (throws) if not.
 *
 * Why this fails the BUILD and is not a runtime check
 *   assertOpenaqSlugsExist() is called at MODULE-EVALUATION time from the city registry
 *   (./index.ts calls it at its top level — see that file). The registry is imported by the
 *   dynamic route's generateStaticParams() and page component, both of which are evaluated
 *   when Next.js statically generates the route during `next build`. So the throw happens
 *   during `next build` and aborts it with a clear error — loud CI failure, exactly as
 *   senior-dev required — rather than a console warning or a runtime-only check that a user
 *   would hit in the browser.
 *
 *   This module takes the profiles as an ARGUMENT (rather than importing CITY_PROFILES from
 *   ./index) on purpose: it avoids a circular import (index → validate → index) that could
 *   otherwise leave CITY_PROFILES uninitialised when the check runs. index.ts owns the array
 *   and passes it in.
 *
 * Key exports: assertOpenaqSlugsExist (called once by ./index at build/SSG time).
 * External dependencies: ../types (CityProfile), @/lib/openaq/cities (CITY_SLUGS).
 */

import type { CityProfile } from '../types'
import { CITY_SLUGS } from '@/lib/openaq/cities'

/**
 * Assert every supplied profile's OpenAQ slug exists in the OpenAQ city registry. Called once
 * at registry module-evaluation (build/SSG time). Collects ALL offenders before throwing so a
 * single build failure reports every bad slug at once, not just the first. Throwing here aborts
 * `next build` — a loud build failure, never a silent console warning.
 */
export function assertOpenaqSlugsExist(
  profiles: readonly CityProfile[],
): void {
  const knownSlugs = new Set(CITY_SLUGS)
  const offenders = profiles.filter(
    (profile) => !knownSlugs.has(profile.sensorProgramme.openaqCitySlug),
  )

  if (offenders.length > 0) {
    const details = offenders
      .map(
        (profile) =>
          `  - ${profile.slug}: openaqCitySlug "${profile.sensorProgramme.openaqCitySlug}" is not in the OpenAQ city registry`,
      )
      .join('\n')
    throw new Error(
      'AQ Network build guard: one or more CityProfile.sensorProgramme.openaqCitySlug ' +
        'values do not exist in the OpenAQ city registry (src/lib/openaq/cities.ts). ' +
        'A mistyped slug renders a fake "network error" at runtime. Fix the slug(s) below ' +
        `or add the city to the OpenAQ registry.\n${details}\n` +
        `Known OpenAQ slugs: ${CITY_SLUGS.join(', ')}`,
    )
  }
}
