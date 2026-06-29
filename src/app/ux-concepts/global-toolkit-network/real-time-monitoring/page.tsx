/**
 * page.tsx — BC Global Toolkit Network · Real-time monitoring COMPONENT DETAIL PAGE.
 *
 * Provenance
 *   COPIED from toolkit/real-time-monitoring/page.tsx (cp -r) and rewired concept-local — the
 *   original toolkit concept is LOCKED and was NOT edited. This copy lives entirely under
 *   global-toolkit-network/ so the Global Toolkit Network concept has its OWN component detail page.
 *   Differences from the toolkit original:
 *     1. Chrome is NOT re-mounted here. The copied layout.tsx + chrome config were DELETED so this
 *        subroute renders inside the concept's existing layout (global-toolkit-network/layout.tsx),
 *        which already mounts PrototypeHeader + BcHeader + BcFooter. One header, one footer.
 *     2. The "Back to the toolkit" nav link now points at THIS concept's landing
 *        (/ux-concepts/global-toolkit-network), not the locked toolkit landing.
 *     3. A new "BC cities offering something like this" section is homed here: the per-capability
 *        deployment list for 'monitoring', listing the cities that run their OWN version of this
 *        capability, with manifest-gated links to each city's real tool.
 *
 * Page structure (inherited from the original):
 *   1. INTRO — what real-time monitoring is + why it is the foundation component.
 *   2. LIVE DEMO — the interactive map (city switcher, parameter toggle, provenance, probe), bordered.
 *   3. ADOPTION — the mock "Bring it to your city" steps + embed snippet (AdoptionGuide).
 *   4. CITIES OFFERING THIS — the concept-local deployment list (NEW; honest "cities run their own").
 *   5. NAV — visible links back to this concept's landing AND the dev hub (no dead ends).
 *
 *   Server component: composes the client MapDemo (the only interactive part), the presentational
 *   AdoptionGuide, and the static deployment list. Chrome is rendered by the concept layout.tsx.
 *
 * Route: /ux-concepts/global-toolkit-network/real-time-monitoring
 *
 * Key exports: GlobalNetworkRtMonitoringPage (default)
 * External dependencies: next/link, @/components/concept (ConceptHero, ConceptCard,
 *   ConceptSectionHeader), ./_components/MapDemo, ./_components/AdoptionGuide,
 *   ../_data/proof-cities (PROOF_CITIES, getToolDeploymentsByCapability),
 *   ../_components/catalogue-proof.config (CATALOGUE_PROOF_KEYWORDS).
 */

import Link from 'next/link'
import {
  ConceptHero,
  ConceptCard,
  ConceptSectionHeader,
} from '@/components/concept'
import MapDemo from './_components/MapDemo'
import { AdoptionGuide } from './_components/AdoptionGuide'
import { PROOF_CITIES, getToolDeploymentsByCapability } from '../_data/proof-cities'
import { CATALOGUE_PROOF_KEYWORDS } from '../_components/catalogue-proof.config'

export default function GlobalNetworkRtMonitoringPage() {
  // The cities that run their OWN version of real-time monitoring — honest deployment breadth,
  // NOT cities that adopted the BC component. Same proof-cities data the globe + cards draw on.
  // `url` is manifest-gated: a proven-live URL → link to that city's real tool; null → plain text.
  const deployments =
    getToolDeploymentsByCapability(PROOF_CITIES, CATALOGUE_PROOF_KEYWORDS)['monitoring'] ?? []

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* ── 1. Intro ──────────────────────────────────────────────────────────── */}
        <ConceptHero
          headline="Real-time monitoring"
          body="A live map of a city's air-quality sensors — what is measuring, what each station is reading right now, and how fresh that reading is. It is the foundation component of the toolkit: every other capability (benchmarking, forecasting, health alerts, open data) builds on a trustworthy, current picture of the network."
        />

        <ConceptSectionHeader
          heading="Why it comes first"
          body="Reliable benchmarking, forecasting, and resident guidance all depend on one thing: a trustworthy, current picture of the sensor network. This component puts that picture first, with per-sensor freshness indicators, honest sparse-coverage labelling, and a probe that shows the live sensors behind any reading."
        />

        {/* ── 2. Live demo — the map, contained as a bordered block (not full-bleed) ── */}
        <section className="space-y-4">
          <ConceptSectionHeader heading="Live demo" />
          {/* noPadding + overflow-hidden so the map fills the rounded card to its border. */}
          <ConceptCard noPadding className="overflow-hidden">
            <MapDemo />
          </ConceptCard>
          <p className="text-xs text-muted-foreground">
            Switch cities, change the pollutant, or open a station to see where its reading comes
            from. &ldquo;Check air quality&rdquo; lists the live sensors nearest any point. Readings
            are a saved snapshot by default; the map label shows when it was captured.
          </p>
        </section>

        {/* ── 3. Adoption — mock "Bring it to your city" ──────────────────────────── */}
        <AdoptionGuide />

        {/* ── 4. Cities offering something like this — the concept-local deployment list ──
            Each row is a city running its OWN version of real-time monitoring (SIMAT, Airparif,
            AirQo, …) for its residents — NOT an adoption of the BC component. Links are manifest-
            gated: a proven-live url renders a link to that city's real tool; null renders plain text.
            The detail page has room, so the full list shows (no expander). */}
        <section className="space-y-4">
          <ConceptSectionHeader
            heading="Cities already monitoring their air in real time"
            body="Every one of these cities runs its own monitoring network for its residents. Where a city publishes its tool, you can open it directly."
          />
          <ConceptCard>
            <ul className="divide-y divide-border">
              {deployments.map((deployment) => (
                <li
                  key={deployment.slug}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-foreground">{deployment.name}</span>
                  {deployment.url !== null ? (
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={deployment.toolName}
                      className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--bc-semantic-brand)' }}
                    >
                      {deployment.toolName}
                      {/* External-link affordance — inline SVG, currentColor, decorative. */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                      </svg>
                    </a>
                  ) : (
                    <span
                      title={`${deployment.toolName} — no public link yet`}
                      className="text-sm text-muted-foreground"
                    >
                      {deployment.toolName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </ConceptCard>
        </section>

        {/* ── 5. Nav — back to THIS concept's landing AND the dev hub (no dead ends) ── */}
        <nav
          className="flex flex-wrap gap-3 border-t pt-8"
          style={{ borderColor: 'var(--bc-color-steel)' }}
          aria-label="Page navigation"
        >
          <Link
            href="/ux-concepts/global-toolkit-network"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bc-semantic-brand)',
              color: 'var(--bc-color-white)',
            }}
          >
            Back to the toolkit network
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
