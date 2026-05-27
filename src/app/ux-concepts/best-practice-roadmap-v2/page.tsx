/**
 * page.tsx — Best Practice Roadmap v2 overview, /ux-concepts/best-practice-roadmap-v2.
 *
 * Purpose
 *   The roadmap overview surface. Same data and interactions as v1, but with a redesigned
 *   visual hierarchy. Updated 2026-05-26 (iteration 2) following Jack's live review of the
 *   first hierarchy pass — see workflow log `roadmap-v2-jack-fixes-2026-05-26.md`.
 *
 *   Three-tier scale jumps (post-iteration-2):
 *     - Tier 1 — STAGE chapter headings (Seeing / Understanding / Acting / Enabling) rendered
 *       at ~clamp(2.25rem, 4vw, 3rem) bold dark-blue with a stage-coloured dot. NO numbered
 *       prefix ("01 / 04") — dropped in iteration 2 to clean the chapter-scale typography.
 *       Inline custom treatment — NOT the shared ConceptSectionHeader (this page consumes its
 *       own chapter scale; the shared component is untouched so other concepts render unchanged).
 *     - Tier 2 — DOMAIN titles ("Monitoring", "Data & Tech", etc.) rendered as quiet
 *       sentence-case column headers above each card. NO uppercase "domain" eyebrow label —
 *       dropped in iteration 2; the sentence-case name alone is sufficient.
 *     - Tier 3 — CARD content inverted via PracticeCardHero. The card is split into two
 *       columns: LEFT column = self-contained outcome hero, prominent city name, quiet
 *       practice description, footer metadata; RIGHT column = chart viz. Both columns
 *       top-aligned for predictable vertical rhythm card-to-card.
 *
 *   Detail pages (city/[slug], domain/[slug]) continue to use PracticeCardTile so their
 *   behaviour is unchanged — the new hierarchy only applies to this overview surface.
 *
 *   The hero (ConceptHero + four ConceptStat figures) is unchanged from the previous pass.
 *
 * Chrome: provided by best-practice-roadmap-v2/layout.tsx (PrototypeHeader + shared BcHeader/
 *   BcFooter). This page renders no chrome of its own. Light mode only. No emoji.
 *
 * Stage hue → tint mapping (flagged for design-qa/Jack review):
 *   Seeing     → var(--bc-color-blue)       cool blue  — data/sensing = blue
 *   Understanding → var(--bc-color-teal)    teal       — analysis/insight = teal
 *   Acting     → var(--bc-color-dark-blue)  deep navy  — action/impact = weight
 *   Enabling   → var(--bc-color-steel)      steel grey — support/infrastructure = neutral
 *
 * Unique build signal (for deploy-poll verification): the string
 * "120 low-cost sensors citywide" (London/Monitoring hero) appears in PracticeCardHero
 * composition only after this iteration — used as the unique-string poll target post-deploy.
 *
 * Key exports: default page component
 * External dependencies: next/link, @/components/concept (ConceptHero, ConceptStat),
 *   @/data/roadmap-data (DOMAINS, PRACTICE_CARDS, Stage),
 *   ./_components/PracticeCardHero (overview-only outcome-as-hero card)
 */

import Link from 'next/link'
import {
  ConceptHero,
  ConceptStat,
} from '@/components/concept'
import {
  DOMAINS,
  PRACTICE_CARDS,
  type Stage,
} from '@/data/roadmap-data'
import { PracticeCardHero } from './_components/PracticeCardHero'

/**
 * Stage dot style override — 4 DISTINCT --bc-* token tints applied at the presentation
 * layer so v2 uses BC brand colours instead of the tailwind blue/amber/green/gray from
 * STAGE_COLORS in roadmap-data.ts. The shared data file is NOT edited.
 *
 * Hue → stage rationale (flagged for design-qa/Jack):
 *   Seeing        → --bc-color-blue       (cool blue — data collection, sensing)
 *   Understanding → --bc-color-teal       (teal — analysis, insight)
 *   Acting        → --bc-color-dark-blue  (deep navy — intervention, weight)
 *   Enabling      → --bc-color-steel      (steel grey — infrastructure, support)
 *
 * dotColor is now used at chapter scale (larger w-3 h-3 dot beside the stage heading) and
 * also as the colour of the "01 / 04" prefix numeral for that stage.
 */
const STAGE_DOT_STYLE: Record<Stage, { dotColor: string }> = {
  Seeing: { dotColor: 'var(--bc-color-blue)' },
  Understanding: { dotColor: 'var(--bc-color-teal)' },
  Acting: { dotColor: 'var(--bc-color-dark-blue)' },
  Enabling: { dotColor: 'var(--bc-color-steel)' },
}

/**
 * Featured card per domain — picks the most visually compelling example.
 * Identical to v1: keyed by domainId; cardIndex/exampleIndex select within the practice data.
 */
const FEATURED: Record<number, { cardIndex: number; exampleIndex: number }> = {
  1: { cardIndex: 0, exampleIndex: 0 },   // London sensors
  2: { cardIndex: 0, exampleIndex: 1 },   // Accra source analysis
  3: { cardIndex: 0, exampleIndex: 0 },   // Paris health study
  4: { cardIndex: 0, exampleIndex: 3 },   // Brussels policy timeline
  5: { cardIndex: 1, exampleIndex: 0 },   // Mexico City vehicle restriction
  6: { cardIndex: 0, exampleIndex: 1 },   // Johannesburg fuel transition
  7: { cardIndex: 0, exampleIndex: 1 },   // Milan tree planting
  8: { cardIndex: 0, exampleIndex: 3 },   // Bangkok awareness timeline
  9: { cardIndex: 0, exampleIndex: 1 },   // Warsaw governance staircase
  10: { cardIndex: 0, exampleIndex: 1 },  // Warsaw funding progression
  12: { cardIndex: 0, exampleIndex: 3 },  // Bogota open data
}

/** Four pillars displayed in order with descriptions — identical to v1. */
const PILLAR_ORDER: { stage: Stage; label: string; description: string }[] = [
  { stage: 'Seeing', label: 'Seeing', description: 'Building the data infrastructure to see air quality clearly' },
  { stage: 'Understanding', label: 'Understanding', description: 'Turning data into evidence — where pollution comes from and who it hurts' },
  { stage: 'Acting', label: 'Acting', description: 'Interventions that measurably reduce pollution and exposure' },
  { stage: 'Enabling', label: 'Enabling', description: 'The cross-cutting infrastructure that makes seeing, understanding, and acting work' },
]

export default function RoadmapV2Page() {
  return (
    <main className="min-h-screen bg-background pb-0">
      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* Hero — unchanged from previous pass: shared ConceptHero + four ConceptStat figures. */}
        <ConceptHero
          headline="Breathe Cities Air Quality Roadmap"
          body="14 Breathe Cities serving 77 million people are on the same journey toward clean air: seeing, understanding, acting and enabling. This roadmap organises 12 domains of practice across those four stages, with measurable results."
        >
          <div className="flex flex-wrap items-end gap-6 pt-2">
            <ConceptStat value="14" label="cities" />
            <ConceptStat value="77M" label="people" />
            <ConceptStat value="12" label="domains" />
            <ConceptStat value="30%" label="reduction target by 2030" />
          </div>
        </ConceptHero>

        {/* Stage chapter sections — Tier 1 hierarchy. Each stage is its own section with a
            chapter-scale heading and generous top margin so the four stages read as distinct
            chapters rather than as siblings to the cards.

            Iteration 2: dropped the "01 / 04 ·" stage counter prefix. Stage number prefix is
            no longer rendered — the dot + chapter title alone carry the hierarchy.

            mt-32 (was mt-24) gives extra clearance between stage sections so the next stage's
            chapter heading cannot visually butt against the previous stage's card grid even
            when cards in the last row have variable heights or trailing Explore links. */}
        {PILLAR_ORDER.map((pillar) => {
          const pillarDomains = DOMAINS.filter((d) => d.stage === pillar.stage)
          const stageStyle = STAGE_DOT_STYLE[pillar.stage]

          return (
            <section key={pillar.stage} className="mt-32 first:mt-20">
              {/* Tier 1 — STAGE chapter heading. Inline custom treatment (NOT the shared
                  ConceptSectionHeader) so this page can carry its own chapter scale without
                  rippling into other concepts. Stage dot + chapter title + quiet one-line
                  description. The "01 / 04" stage counter prefix was removed in iteration 2. */}
              <header className="mb-10 space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stageStyle.dotColor }}
                    aria-hidden="true"
                  />
                  <h2
                    className="font-bold tracking-tight text-foreground leading-[1.05]"
                    style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)' }}
                  >
                    {pillar.label}
                  </h2>
                </div>
                <p className="text-base text-muted-foreground max-w-2xl pl-6">
                  {pillar.description}
                </p>
              </header>

              {/* Domain card grid — each cell renders the Tier 2 domain title above a Tier 3
                  PracticeCardHero card. items-start on the grid keeps cards top-aligned when
                  their heights differ (which they will, since chart types vary).

                  Iteration 2 — the per-cell wrapper uses flex-col so the Explore link sits
                  at a stable position relative to the card, and `min-h` is unset so cards
                  size to their own content (top-alignment owned by grid items-start). */}
              <div className="grid gap-x-6 gap-y-10 grid-cols-1 lg:grid-cols-2 items-start">
                {pillarDomains.filter((d) => FEATURED[d.id]).map((domain) => {
                  const domainCards = PRACTICE_CARDS.filter((p) => p.domainId === domain.id)
                  const featured = FEATURED[domain.id]
                  const card = domainCards[featured?.cardIndex ?? 0]
                  const example = card?.cityExamples[featured?.exampleIndex ?? 0]

                  if (!card || !example) {
                    return (
                      <div key={domain.id} className="flex flex-col gap-2">
                        <DomainTitle name={domain.shortName} />
                        <Link
                          href={`/ux-concepts/best-practice-roadmap-v2/domain/${domain.slug}`}
                          className="block"
                        >
                          <div className="rounded-2xl border border-border bg-background shadow-sm p-5 hover:bg-muted transition-colors">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {domain.description}
                            </p>
                          </div>
                        </Link>
                      </div>
                    )
                  }

                  return (
                    <div key={domain.id} className="flex flex-col gap-3">
                      {/* Tier 2 — quiet domain title above the card. Sentence-case heading,
                          no uppercase "domain" eyebrow label (dropped in iteration 2 — the
                          name alone is sufficient). */}
                      <DomainTitle name={domain.shortName} />
                      <PracticeCardHero practice={card} example={example} />
                      <Link
                        href={`/ux-concepts/best-practice-roadmap-v2/domain/${domain.slug}`}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                      >
                        Explore {domain.shortName} &rarr;
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}

/**
 * DomainTitle — Tier 2 quiet column-header treatment for a domain title. Sentence-case
 * domain name; renders quieter than the stage chapter heading and quieter than the card
 * outcome hero. Iteration 2 — the uppercase "domain" eyebrow label that previously sat
 * above the name was dropped; the name alone is sufficient signal.
 */
function DomainTitle({ name }: { name: string }) {
  return (
    <div className="text-base font-medium text-foreground/80">{name}</div>
  )
}
