/**
 * page.tsx — Cities index page, /ux-concepts/best-practice-roadmap-v2/cities.
 *
 * Purpose
 *   Synchronised v2 copy of the cities listing page. SAME structure, content, data, and
 *   interactions as v1. The ONLY differences are skin-level:
 *     - City card links point at -v2 city routes so the concept is self-contained.
 *     - The hero eyebrow uses inline style with var(--bc-color-blue) instead of text-bc-blue
 *       utility class (per the v2 styling convention).
 *     - Decorative gradient fills and the gradient-dependent text scrim have been replaced with
 *       the family's outlined card treatment (rounded-2xl border border-border bg-background
 *       shadow-sm) — functional-colour rule: colour encodes data/status, never decoration.
 *       No hardcoded hex. No emoji. Light mode only.
 *
 * Key exports: default page component
 * External dependencies: next/link, lucide-react, @/data/roadmap-data, @/components/concept
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CITIES, getCoverageCount } from '@/data/roadmap-data'

/** Region filter chip labels — inert, for IA fidelity with the real BC site. */
const REGION_FILTERS = [
  'All regions',
  'Europe',
  'Africa',
  'Asia',
  'Latin America',
]

export default function CitiesV2Page() {
  return (
    <main className="min-h-screen bg-background pb-0">
      {/* Hero section */}
      <section className="border-b border-border px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Eyebrow: inline style replaces v1's text-bc-blue utility class. */}
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--bc-color-blue)' }}
          >
            Cities
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A network of cities cutting air pollution.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            14 cities across four continents, working together through the
            Breathe Cities family to deliver measurable clean-air progress.
          </p>
        </div>
      </section>

      {/* Region filter chips — inert, first chip styled as active. */}
      <section className="border-b border-border px-4 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-2">
          {REGION_FILTERS.map((label, i) => {
            const isActive = i === 0
            return (
              <span
                key={label}
                className={[
                  'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium',
                  isActive
                    ? 'text-white'
                    : 'border border-border text-muted-foreground',
                ].join(' ')}
                style={
                  isActive
                    ? { backgroundColor: 'var(--bc-color-dark-blue)' }
                    : undefined
                }
                aria-disabled="true"
              >
                {label}
              </span>
            )
          })}
        </div>
      </section>

      {/* City card grid — outlined card treatment per functional-colour rule.
          Each card is a neutral outlined surface (rounded-2xl border border-border
          bg-background shadow-sm) with dark text on light background. The gradient
          fill and gradient-dependent text scrim have been removed. Links and grid
          layout are unchanged. */}
      <section className="px-4 py-10 sm:py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city) => {
            const coverage = getCoverageCount(city.slug)

            return (
              <Link
                key={city.slug}
                href={`/ux-concepts/best-practice-roadmap-v2/city/${city.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Top row: city name + hover arrow. */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-snug">
                      {city.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {city.country}
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>

                {/* Coverage badge — bottom of card. */}
                <p className="mt-4 text-xs font-medium text-muted-foreground">
                  {coverage} {coverage === 1 ? 'domain' : 'domains'} covered
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Footnote */}
      <section className="border-t border-border px-4 py-6">
        <p className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
          Outlined cards replace the gradient city-imagery stand-ins — functional-colour rule.
        </p>
      </section>
    </main>
  )
}
