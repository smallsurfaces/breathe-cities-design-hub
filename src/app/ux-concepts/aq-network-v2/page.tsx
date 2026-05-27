/**
 * page.tsx — AQ Network v2 homepage, /ux-concepts/aq-network-v2.
 *
 * Purpose
 *   The synchronised v2 copy of the AQ Network homepage. SAME structure, content, data, and
 *   interactions as v1 — exactly three sections (sensor map / globe, member-city grid, collective
 *   goal & impact). The ONLY differences from v1 are skin-level:
 *     - the hero renders via the shared ConceptHero with no eyebrow prop (the eyebrow was dropped
 *       in the concept-housekeeping pass; the former ConceptHeroPlain wrapper was retired once
 *       ConceptHero's eyebrow became optional) and the two section headers via the shared
 *       ConceptSectionHeader, instead of inline header markup, and
 *     - all internal links (member-city links) point at the v2 route so v2 is self-contained.
 *
 *   Both the globe AND the grid are sourced from the programme snapshot's `cities` (the canonical
 *   member list) and gated against the SAME profile registry the dynamic route uses
 *   (CITY_PROFILE_SLUGS), so a new member city appears automatically and becomes a live link the
 *   moment its profile is registered — no edit to this file.
 *
 * Chrome: provided by aq-network-v2/layout.tsx — the PrototypeHeader (back-to-hub + comments +
 *   "Updated" stamp) AND the SHARED BcHeader/BcFooter site nav. This page therefore renders no
 *   chrome of its own. Page theme: light. The globe canvas itself is dark (deliberate — the
 *   network pops against dark space); see NetworkGlobe. No emoji.
 *
 * Key exports: default page component, metadata.
 * External dependencies: next/link, next (Metadata), @/components/concept (ConceptHero,
 *   ConceptSectionHeader), NetworkGlobe, CollectiveGoalImpact, the programme snapshot loader, the
 *   profile-slug registry in ./_data/cities. Chrome is owned by aq-network-v2/layout.tsx.
 *
 * Route: /ux-concepts/aq-network-v2
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ConceptHero, ConceptSectionHeader } from '@/components/concept'
import { NetworkGlobe } from './_components/NetworkGlobe'
import { CollectiveGoalImpact } from './_components/CollectiveGoalImpact'
import { getProgrammeSnapshot } from './_data/sensor-snapshots/programme'
import { CITY_PROFILE_SLUGS } from './_data/cities'

export const metadata: Metadata = {
  title: 'AQ Network v2 (concept)',
}

/**
 * The v2 homepage. Renders exactly three sections: the sensor map (hero + counters + interactive
 * globe + scrubber), the compact member-city grid, then the standalone collective goal & impact
 * section. The globe and the grid both read the committed programme snapshot; the grid is gated
 * against CITY_PROFILE_SLUGS so it grows automatically with the registry (live links for cities
 * with a profile, inert otherwise). Hero + section headers use the shared concept primitives.
 */
export default function AqNetworkV2Index() {
  // Programme snapshot is bundled JSON — read synchronously on the server, passed to the globe.
  const programme = getProgrammeSnapshot()

  // The member grid is gated against the profile registry (CITY_PROFILE_SLUGS — today accra +
  // london): cities with a profile become live links, the rest stay inert (muted) so there are no
  // dead-ends. Sourcing the grid from the snapshot means new member cities appear automatically,
  // and a city goes live the moment its profile is registered — no edit to this file.
  const profileSlugs = new Set<string>(CITY_PROFILE_SLUGS)

  // The compact member grid lists ALL member cities from the snapshot, sorted by name for a tidy
  // name grid.
  const memberCities = [...programme.cities].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return (
    // Chrome (PrototypeHeader + shared BcHeader/BcFooter) is rendered by aq-network-v2/layout.tsx.
    <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          {/* Eyebrow dropped this pass (Jack's decision) — ConceptHero with no `eyebrow` prop. */}
          <ConceptHero
            headline={`One air-quality network, ${programme.counts.cities} cities, worldwide.`}
            body={`Every Breathe Cities member is part of one growing sensor network. Spin the globe to see where the ${programme.counts.sensors.toLocaleString()} sensors are, and play the timeline to watch the network grow.`}
          />

          {/* SECTION 1 — SENSOR MAP. The hero: counters (in the globe) + the interactive 3D
                network globe + its own scrubber. Skin-only copy of v1; behaviour identical. */}
          <section className="mt-10">
            <NetworkGlobe snapshot={programme} />
          </section>

          {/* SECTION 2 — MEMBER CITIES. A COMPACT grid of all member city NAMES. Cities with a
                profile page are live links (to the v2 route); the rest are inert (muted) so there
                are never dead-ends. The live-vs-inert styling mirrors the BcChrome nav pattern. */}
          <ConceptSectionHeader
            heading="Member cities"
            body={`All ${programme.counts.cities} Breathe Cities members. City-authored profiles are rolling out one city at a time — linked cities are live now; the rest are on the way.`}
            className="mt-16"
          />

          <section className="mt-6">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {memberCities.map((city) => {
                // A city is "live" when its slug has a registered profile page.
                const live = profileSlugs.has(city.slug)
                return (
                  <li key={city.slug}>
                    {live ? (
                      <Link
                        href={`/ux-concepts/aq-network-v2/${city.slug}`}
                        // Hover colour uses the shadcn-bridged `primary` token (globals.css maps
                        // --primary → --bc-semantic-brand = brand blue), so the hover is brand blue
                        // via a bridged semantic — NOT a `*-bc-*` utility and NOT a JS handler,
                        // keeping this page a server component (matching v1).
                        className="flex h-full items-center justify-center rounded-xl border border-border bg-background px-3 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {city.name}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="flex h-full cursor-default items-center justify-center rounded-xl border border-border bg-muted/40 px-3 py-3 text-center text-sm font-medium text-muted-foreground/70"
                      >
                        {city.name}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Descriptive meta line ("The globe above already shows… More city profiles will go
              live here as they land.") was HIDDEN in the concept-housekeeping pass — purely
              descriptive, not load-bearing. */}

          {/* SECTION 3 — COLLECTIVE GOAL & IMPACT. The shared 2030 goal card + the collective
                health-impact card, stacked, in their own standalone section AFTER the grid.
                Figures are Breathe Cities' published projection, attributed via DataSource inside
                the component. */}
          <ConceptSectionHeader
            heading="Collective goal & impact"
            body="One shared goal across the whole network — and the collective health prize for reaching it."
            className="mt-16"
          />

          <section className="mt-6">
            <CollectiveGoalImpact
              goalLabel="30% cleaner air by 2030"
              impact={{
                asthmaCases: '~79,000',
                economicSavings: '~$107 billion',
                deathsAvoided: '~39,000',
              }}
            />
          </section>
        </div>
      </main>
  )
}
