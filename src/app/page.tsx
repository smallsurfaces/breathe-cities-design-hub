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
 *     - Four cards linking to the four wireframe-locked UX concepts
 *     - One sentence explaining the inline annotation tool for feedback
 *
 *   Routing into concepts is single-sourced from the concept registry
 *   (src/app/_data/concept-registry.ts) so concept titles and routes cannot drift between
 *   this landing and each concept's own PrototypeHeader tooling bar.
 *
 *   Light mode only. BC semantic tokens only (no hardcoded hex). No emoji.
 *
 *   The wireframe-notice strip (<WireframeNotice />) is mounted ABOVE the BC chrome — the same
 *   vertical position it occupies on concept pages (where PrototypeHeader's Row 2 owns it) — so
 *   the landing reads consistent with the concept pages a reviewer is about to click into. The
 *   strip is single-sourced via the shared component; the copy lives in one place.
 *
 * Key exports: default page component
 * External dependencies: next/link, @/components/concept (ConceptCard),
 *   ./_components/WireframeNotice (the shared wireframe-disclaimer strip),
 *   ./_data/concept-registry (CONCEPTS)
 */

import Link from 'next/link'
import { ConceptCard } from '@/components/concept'
import { WireframeNotice } from './_components/WireframeNotice'
import { CONCEPTS } from './_data/concept-registry'

/**
 * Card labels for this surface. The concept-registry titles read "Global Site Concept - <name>"
 * — the right voice for the internal hub. For the client landing the cards use the short
 * concept name (the brief's labels) so the four-card grid scans cleanly on first read. Routes
 * remain single-sourced from the registry, so a registry route change still propagates here.
 */
const CONCEPT_CARDS: readonly { label: string; route: string }[] = [
  { label: 'Best Practice Roadmap', route: CONCEPTS.roadmap.route },
  { label: 'AQ Network', route: CONCEPTS.aqNetwork.route },
  { label: 'Resident Concerns', route: CONCEPTS.residentConcerns.route },
  { label: 'City AQ Toolkit', route: CONCEPTS.toolkit.route },
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

          {/* Four-card grid. ConceptCard provides the canonical outlined surface. The whole card
              is a Link so the entire card area is the click target (a single-line label and an
              "Open" affordance share the surface). */}
          <section className="grid gap-4 sm:grid-cols-2">
            {CONCEPT_CARDS.map((card) => (
              <Link
                key={card.route}
                href={card.route}
                className="group block transition-shadow hover:shadow-md"
              >
                <ConceptCard className="flex items-center justify-between gap-4 transition-colors group-hover:bg-muted/40">
                  <span
                    className="text-base font-semibold"
                    style={{ color: 'var(--bc-semantic-text)' }}
                  >
                    {card.label}
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
            ))}
          </section>

          {/* Feedback sentence — explains the inline annotation tool that lives in each concept's
              PrototypeHeader bar. Quiet treatment so it reads as guidance, not a call-to-action. */}
          <footer className="pt-2">
            <p
              className="max-w-2xl text-sm"
              style={{ color: 'var(--bc-semantic-muted)' }}
            >
              To leave feedback, use the annotation tool to comment inline on any element.
            </p>
          </footer>
        </div>
      </main>
    </>
  )
}
