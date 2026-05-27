/**
 * page.tsx — Domain detail page, /ux-concepts/best-practice-roadmap-v2/domain/[slug].
 *
 * Purpose
 *   Synchronised v2 copy of the domain detail page. SAME structure, content, data, and
 *   interactions as v1. The ONLY differences are skin-level:
 *     - Internal breadcrumb and PracticeCardTile links point at -v2 routes.
 *     - StageBadge imported from the v2 _components folder (BC-token tints, not Tailwind classes).
 *
 * Key exports: default page component, generateStaticParams, generateMetadata
 * External dependencies: @/data/roadmap-data, v2 _components (PracticeCardTile, StageBadge)
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  DOMAINS,
  getDomainBySlug,
  getPracticesByDomain,
} from '@/data/roadmap-data'
import { PracticeCardTile } from '../../_components/PracticeCardView'
import { StageBadge } from '../../_components/StageBadge'

interface DomainPageProps {
  params: Promise<{ slug: string }>
}

/** Pre-generate pages for all domain slugs. */
export function generateStaticParams() {
  return DOMAINS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({
  params,
}: DomainPageProps): Promise<Metadata> {
  const { slug } = await params
  const domain = getDomainBySlug(slug)
  return {
    title: domain
      ? `${domain.shortName} — Best Practice Roadmap v2`
      : 'Domain — Best Practice Roadmap v2',
  }
}

export default async function DomainDetailV2Page({ params }: DomainPageProps) {
  const { slug } = await params
  const domain = getDomainBySlug(slug)

  if (!domain) {
    notFound()
  }

  const practices = getPracticesByDomain(domain.id)
  const hasPractices = practices.length > 0

  return (
    <main className="min-h-screen bg-background pb-0">
      {/* Header */}
      <section className="border-b bg-muted/30 px-4 pt-16 pb-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Link
              href="/ux-concepts/best-practice-roadmap-v2"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Roadmap
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{domain.shortName}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* v2 StageBadge — BC-token tints, not Tailwind colour utilities. */}
            <StageBadge stage={domain.stage} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {domain.name}
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl">
            {domain.description}
          </p>
        </div>
      </section>

      {/* Practice cards */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          {hasPractices ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {practices.flatMap((practice) =>
                practice.cityExamples.map((example) => (
                  <PracticeCardTile
                    key={`${practice.id}-${example.citySlug}`}
                    practice={practice}
                    example={example}
                    // wireframe-lock-2026-05-26 client-share build: city/[slug]
                    // detail route was removed, so the city name renders as an
                    // inert label here (visual preserved).
                    linkCity={false}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Practice cards coming soon
              </p>
              <p className="text-xs text-muted-foreground">
                This domain has city coverage in the matrix but detailed practice
                cards have not been authored yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
