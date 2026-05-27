/**
 * page.tsx — Client-facing landing for the breathe-cities-design-hub review snapshot.
 *
 * Purpose
 *   The single landing surface for the public client-review URL. Frames the four UX concept
 *   prototypes for CAF / C40 / Bloomberg and routes into each. This is NOT the internal dev
 *   hub at breath-cities-design-dev — that hub carries the design system, jtbd framework,
 *   integration prototypes, and other surfaces not meant for external eyes.
 *
 *   Content
 *     - Title + single-paragraph framing
 *     - Four cards linking to the four wireframe-locked UX concepts, stacked vertically
 *       in dev-hub display order (Roadmap → Resident Concerns → Toolkit → AQ Network)
 *     - One sentence explaining the inline annotation tool for feedback
 *     - Small Surfaces credit line — quiet signature treatment at the foot of the page
 *
 *   Routing into concepts is single-sourced from the concept registry
 *   (src/app/_data/concept-registry.ts) so concept titles and routes cannot drift between
 *   this landing and each concept's own PrototypeHeader tooling bar. The card labels come
 *   straight from the registry's `title` field — same canonical strings the dev hub uses.
 *
 *   Light mode only. BC semantic tokens only (no hardcoded hex). No emoji.
 *
 *   The wireframe-notice strip (<WireframeNotice />) is mounted ABOVE the BC chrome — the same
 *   vertical position it occupies on concept pages (where PrototypeHeader's Row 2 owns it) — so
 *   the landing reads consistent with the concept pages a reviewer is about to click into. The
 *   strip is single-sourced via the shared component; the copy lives in one place.
 *
 *   Small Surfaces logo
 *     The orange "small surfaces" wordmark (public/brand/small-surfaces-logo-molten.png) sits as
 *     a quiet credit at the bottom of the page, paired with muted "Designed by" preamble. The
 *     wordmark is intentionally outside the BC token palette (BC blue is the primary brand;
 *     the orange is a studio signature) — bottom-of-page placement gives the two colours visual
 *     separation rather than fighting in the header row.
 *
 * Key exports: default page component
 * External dependencies: next/link, next/image, @/components/concept (ConceptCard),
 *   ./_components/WireframeNotice (the shared wireframe-disclaimer strip),
 *   ./_data/concept-registry (CONCEPTS, ConceptId)
 */

import Link from 'next/link'
import Image from 'next/image'
import { ConceptCard } from '@/components/concept'
import { WireframeNotice } from './_components/WireframeNotice'
import { CONCEPTS, type ConceptId } from './_data/concept-registry'

/**
 * Display order for the landing cards. Top-to-bottom order matches the dev hub
 * (Roadmap → Resident Concerns → Toolkit → AQ Network) so the two surfaces present the four
 * concepts in the same sequence — reviewers see the same ordering whichever surface they hit.
 * The ConceptId values resolve to canonical titles + routes via the CONCEPTS registry.
 */
const CONCEPT_ORDER: readonly ConceptId[] = [
  'roadmap',
  'residentConcerns',
  'toolkit',
  'aqNetwork',
]

export default function ClientReviewLanding() {
  return (
    <>
      {/* Wireframe-notice strip ABOVE the BC chrome — same vertical position it occupies on
          concept pages (where PrototypeHeader's Row 2 owns it). Single-sourced component so the
          copy and visual treatment cannot drift between this landing and the concept pages. */}
      <WireframeNotice />

      <main className="min-h-screen bg-background px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* Title + framing paragraph. */}
          <header className="space-y-5">
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--bc-semantic-brand)' }}
            >
              <span
                className="text-base font-bold"
                style={{ color: 'var(--bc-color-white)' }}
              >
                BC
              </span>
            </div>

            <h1
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: 'var(--bc-semantic-text)' }}
            >
              Breathe Cities — Concept Prototypes for Review
            </h1>

            <p
              className="max-w-2xl text-base sm:text-lg"
              style={{ color: 'var(--bc-semantic-muted)' }}
            >
              Four UX concept prototypes for the Breathe Cities Global Site.
            </p>
          </header>

          {/* Vertical card stack. ConceptCard provides the canonical outlined surface. Cards are
              full-width and stacked top-to-bottom; the whole card is a Link so the entire card
              area is the click target. Labels and routes both come from the concept registry —
              no hand-curated strings on this surface. */}
          <section className="flex flex-col gap-4">
            {CONCEPT_ORDER.map((id) => {
              const concept = CONCEPTS[id]
              return (
                <Link
                  key={id}
                  href={concept.route}
                  className="group block transition-shadow hover:shadow-md"
                >
                  <ConceptCard className="flex items-center justify-between gap-4 transition-colors group-hover:bg-muted/40">
                    <span
                      className="text-base font-semibold"
                      style={{ color: 'var(--bc-semantic-text)' }}
                    >
                      {concept.title}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--bc-semantic-muted)' }}
                      aria-hidden="true"
                    >
                      Open &rarr;
                    </span>
                  </ConceptCard>
                </Link>
              )
            })}
          </section>

          {/* Footer block:
                1. Feedback sentence — explains the inline annotation tool that lives in each
                   concept's PrototypeHeader bar. Quiet treatment so it reads as guidance,
                   not a call-to-action.
                2. Small Surfaces credit — quiet "Designed by [wordmark]" signature. Sits below
                   the feedback line, with breathing room. Bottom-of-page placement separates the
                   orange wordmark from the BC blue chrome at the top of the page. */}
          <footer className="space-y-8 pt-2">
            <p
              className="max-w-2xl text-sm"
              style={{ color: 'var(--bc-semantic-muted)' }}
            >
              To leave feedback, use the annotation tool to comment inline on any element.
            </p>

            <div className="flex items-center gap-2">
              <span
                className="text-xs"
                style={{ color: 'var(--bc-semantic-muted)' }}
              >
                Designed by
              </span>
              {/* The wordmark renders at a small fixed display height (~20px); the intrinsic
                  3710×1149 ratio yields ~65px width. next/image with `unoptimized` is intentional
                  here — Next.js's image optimiser is fussy about static export contexts, and the
                  wordmark is already a small PNG, so the optimiser brings no real benefit. */}
              <Image
                src="/brand/small-surfaces-logo-molten.png"
                alt="Small Surfaces"
                width={65}
                height={20}
                priority={false}
                unoptimized
                style={{ height: '20px', width: 'auto' }}
              />
            </div>
          </footer>
        </div>
      </main>
    </>
  )
}
