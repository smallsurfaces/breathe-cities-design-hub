/**
 * page.tsx — City detail page, /ux-concepts/best-practice-roadmap-v2/city/[slug].
 *
 * Purpose
 *   Synchronised v2 copy of the city detail page. SAME structure, content, data, and
 *   interactions as v1. The ONLY differences are skin-level:
 *     - Internal breadcrumb and domain badge links point at -v2 routes.
 *     - Domain "also active in" links point at -v2 domain routes.
 *
 * Key exports: default page component, generateStaticParams, generateMetadata
 * External dependencies: @/data/roadmap-data, shadcn Badge, v2 _components (CityMapHero,
 *   PracticeCardTile)
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  CITIES,
  COVERAGE_MATRIX,
  getCityBySlug,
  getCoverageCount,
  getPracticesByCity,
  getDomainById,
} from '@/data/roadmap-data'
import { CityMapHero } from '../../_components/CityMapHero'
import { PracticeCardTile } from '../../_components/PracticeCardView'

interface CityPageProps {
  params: Promise<{ slug: string }>
}

/** Pre-generate pages for all city slugs. */
export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  return {
    title: city
      ? `${city.name} — Best Practice Roadmap v2`
      : 'City — Best Practice Roadmap v2',
  }
}

export default async function CityDetailV2Page({ params }: CityPageProps) {
  const { slug } = await params
  const city = getCityBySlug(slug)

  if (!city) {
    notFound()
  }

  const coverageCount = getCoverageCount(city.slug)
  const practices = getPracticesByCity(city.slug)
  const coverage = COVERAGE_MATRIX[city.slug] ?? []

  // Group practices by domain for display — identical to v1.
  const practicesByDomain = new Map<number, typeof practices>()
  for (const practice of practices) {
    const existing = practicesByDomain.get(practice.domainId) ?? []
    existing.push(practice)
    practicesByDomain.set(practice.domainId, existing)
  }

  // Domains active in coverage matrix but without practice cards.
  const activeDomainIds = coverage
    .map((active, idx) => (active ? idx + 1 : null))
    .filter((id): id is number => id !== null)

  const domainsWithCards = new Set(practicesByDomain.keys())
  const domainsWithoutCards = activeDomainIds.filter(
    (id) => !domainsWithCards.has(id)
  )

  return (
    <main className="min-h-screen bg-background pb-0">
      {/* Header */}
      <section className="border-b bg-muted/30 px-4 pt-16 pb-10">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex items-center gap-2">
            <Link
              href="/ux-concepts/best-practice-roadmap-v2"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Roadmap
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{city.name}</span>
          </div>

          <div className="flex items-start gap-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-sm font-bold text-foreground">
              {city.flag}
            </span>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {city.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                <span>{city.country}</span>
                <span>&middot;</span>
                <span>{city.populationLabel} people</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sensor map hero */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <CityMapHero citySlug={slug} />
        </div>
      </section>

      {/* Contributions by domain */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Contributions by Domain
          </h2>

          {practices.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {practices.flatMap((practice) =>
                practice.cityExamples
                  .filter((ex) => ex.citySlug === city.slug)
                  .map((example) => (
                    <PracticeCardTile
                      key={`${practice.id}-${example.citySlug}`}
                      practice={practice}
                      example={example}
                      linkCity={false}
                      showDomainTag={true}
                    />
                  ))
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                No practice cards authored yet
              </p>
              <p className="text-xs text-muted-foreground">
                {city.name} has coverage in {coverageCount} domains but detailed
                practice cards have not been written for this city yet.
              </p>
            </div>
          )}

          {/* Domains active in matrix but without practice cards — links at -v2 routes. */}
          {domainsWithoutCards.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Also active in ({domainsWithoutCards.length} domains &mdash; cards coming soon)
              </h3>
              <div className="flex flex-wrap gap-2">
                {domainsWithoutCards.map((domainId) => {
                  const domain = getDomainById(domainId)
                  if (!domain) return null
                  return (
                    <Link
                      key={domainId}
                      href={`/ux-concepts/best-practice-roadmap-v2/domain/${domain.slug}`}
                    >
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                        {domain.shortName}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
