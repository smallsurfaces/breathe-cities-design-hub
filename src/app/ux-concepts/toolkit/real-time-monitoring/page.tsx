/**
 * page.tsx — JTBD City Toolkit · Real-time monitoring COMPONENT PAGE (restructured, increment 2).
 *
 * Purpose:
 *   In increment 1 this route WAS the map (full-viewport). Increment 2 demotes the map to one
 *   embedded live-demo block inside a proper component page:
 *     1. INTRO — what real-time monitoring is + why it is the foundation component of the AQ stack
 *        (a ConceptHero + a short framing section).
 *     2. LIVE DEMO — the interactive map (city switcher, parameter toggle, station provenance, the
 *        "check air quality" probe) contained as a BORDERED block, not full-bleed (MapDemo).
 *     3. ADOPTION — the mock "Bring it to your city" steps + a mock embed snippet (AdoptionGuide),
 *        framing the map as an adoptable open-source component.
 *     4. NAV — visible links back to the toolkit landing AND the dev hub (no dead ends).
 *
 *   This page is a server component: it composes the client MapDemo (the only interactive part) and
 *   the presentational AdoptionGuide. The chrome (PrototypeHeader + BcHeader + BcFooter) is rendered
 *   by layout.tsx.
 *
 * Route: /ux-concepts/toolkit/real-time-monitoring
 *
 * Key exports: ToolkitRtMonitoringPage (default)
 * External dependencies: next/link, @/components/concept (ConceptHero, ConceptCard,
 *   ConceptSectionHeader), ./_components/MapDemo, ./_components/AdoptionGuide.
 */

import Link from 'next/link'
import {
  ConceptHero,
  ConceptCard,
  ConceptSectionHeader,
} from '@/components/concept'
import MapDemo from './_components/MapDemo'
import { AdoptionGuide } from './_components/AdoptionGuide'

export default function ToolkitRtMonitoringPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* ── 1. Intro (eyebrow dropped this pass — shared ConceptHero with no `eyebrow` prop) ─── */}
        <ConceptHero
          headline="Real-time monitoring"
          body="A live map of a city's air-quality sensors — what is measuring, what each station is reading right now, and how fresh that reading is. It is the foundation component of the toolkit: every other capability (benchmarking, forecasting, health alerts, open data) builds on a trustworthy, current picture of the network."
        />

        <ConceptSectionHeader
          heading="Why it comes first"
          body="You cannot benchmark against a standard, forecast a trend, or warn a resident without first knowing what the sensors say — and how much to trust them. This component leads with that honesty: per-sensor freshness, sparse-coverage labelling, and a probe that shows the live sensors behind a reading rather than inventing a single number."
        />

        {/* ── 2. Live demo — the map, contained as a bordered block (not full-bleed) ── */}
        <section className="space-y-4">
          <ConceptSectionHeader heading="Live demo" />
          {/* noPadding + overflow-hidden so the map fills the rounded card to its border. */}
          <ConceptCard noPadding className="overflow-hidden">
            <MapDemo />
          </ConceptCard>
          <p className="text-xs text-muted-foreground">
            Switch cities, toggle the parameter, click a station for its provenance, or use
            &ldquo;Check air quality&rdquo; to list the live sensors nearest a point. Data is a
            committed snapshot by default — the label on the map shows when it was captured.
          </p>
        </section>

        {/* ── 3. Adoption — mock "Bring it to your city" ──────────────────────────── */}
        <AdoptionGuide />

        {/* ── 4. Nav — back to the toolkit landing AND the dev hub (no dead ends) ──── */}
        <nav
          className="flex flex-wrap gap-3 border-t pt-8"
          style={{ borderColor: 'var(--bc-color-steel)' }}
          aria-label="Page navigation"
        >
          <Link
            href="/ux-concepts/toolkit"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bc-semantic-brand)',
              color: 'var(--bc-color-white)',
            }}
          >
            Back to the toolkit
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Dev hub
          </Link>
        </nav>
      </div>
    </main>
  )
}
