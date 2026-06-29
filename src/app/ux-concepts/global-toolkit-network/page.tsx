/**
 * page.tsx — BC Global Toolkit Network concept landing page, /ux-concepts/global-toolkit-network.
 *
 * Purpose
 *   A merged concept combining the AQ Toolkit catalogue with a PROOF-DIRECTORY globe. The page shows:
 *     1. ConceptHero — framing the concept as ENABLEMENT: "everything your city needs to act on its
 *        air quality", shown through the cities already running the toolkit ("this could be your city
 *        too"). The network-JOIN invitation deliberately lives in the closing section (6), not here.
 *     2. Proof directory — ONE merged proof block (Fix 1): the locked heading with the readable
 *        "~82 million" combined-population figure as the visual hero (data-derived, no Estimate pill —
 *        the `~` carries the approximation), and the ProofGlobe: UNIFORM "BC member" pins
 *        (no proven/newly-joined/member tier states) across 16 cities, where clicking ANY pin opens
 *        a panel that leads with the city's one-line adoption story then lists OUR catalogue categories
 *        matched to the real tools that city runs (Fix 2 — category-led, see CityPanel.tsx). Honesty
 *        rides the link state inside the panel alone (v3 — every tool is real and research-grounded; a
 *        tool's CTA is active only where a proven-live URL exists, otherwise the CTA slot renders
 *        nothing, Fix 3), not a city ranking and not invented tools. This is a FRESH, fully-isolated
 *        globe + data set owned by this concept — it does NOT import aq-network-v2's NetworkGlobe,
 *        programme snapshot, or city data.
 *     3. Components catalogue — the COMPONENT_ENTRIES grid, rendered via the concept-local
 *        ProofCatalogueCard, with three ILLUSTRATIVE example tools (AQ Patterns, Air Window,
 *        City Futures) appended to the SAME grid as "Coming soon" cards (v2 founder direction —
 *        replaced the former standalone "Tailored tools" section). The real component cards carry a
 *        prevalence counter ("N cities run their own version") — an honest adoption-breadth
 *        approximation, NOT an implied adoption of the BC component; the example-tool cards carry NO
 *        counter and NO link, only a muted "Coming soon" badge and a single full-colour preview image,
 *        because they are concepts not yet in use. The per-city deployment list is reserved for the
 *        component detail page (the data helper is retained but no longer rendered on the card).
 *     4. Guidance catalogue — the GUIDANCE_ENTRIES grid, same prevalence-counter card treatment.
 *     5. How to implement — a 4-step adoption path (Assess → Choose → Deploy → Communicate),
 *        each step a ConceptCard. The former muted partner-reference line (OpenAQ, Clean Air Fund) was
 *        removed (Fix 5): every onward action on the page is now inert, an accepted concept state.
 *     6. Bring the toolkit to your city — the closing onramp: completes the "you could have this
 *        too" arc and carries the network-join invitation moved out of the hero. ConceptSectionHeader
 *        + ConceptCard + one INERT soft CTA (href="#", shown-not-dead per the no-dead-ends rule).
 *
 *   The toolkit catalogue ENTRIES + sketch preview are imported read-only (shared content, per the
 *   section brief), but the CARD is a concept-local fork (ProofCatalogueCard) so the honest
 *   "cities run their own version" deployment footer never mutates the locked toolkit card
 *   (isolation, spec §5). The aq-network-v2
 *   globe + snapshot are NOT imported — the membership/sensor globe section was replaced by the
 *   proof directory. Chrome is provided by layout.tsx (PrototypeHeader + BcHeader/BcFooter).
 *
 * Honesty (the project's backbone)
 *   The aggregate figure is CITY POPULATION across the plotted cities — never implied "people
 *   reached/served". It is shown as "~N million": the leading `~` carries the approximation (the
 *   Estimate pill was dropped in Fix 1). See proof-cities.ts + CityPanel.tsx for the full honesty model.
 *
 * Key exports: default page component, metadata.
 * External dependencies: next (Metadata), @/components/concept (ConceptHero, ConceptSectionHeader,
 *   ConceptStat, ConceptCard), ./_components/ProofGlobe, ./_data/proof-cities,
 *   COMPONENT_ENTRIES / GUIDANCE_ENTRIES (./_components/toolkit-catalogue.local.config, concept-local),
 *   ./_components/ComingSoonToolCard + ./_components/example-tools.config (illustrative example tools).
 *
 * Route: /ux-concepts/global-toolkit-network
 */

import type { Metadata } from 'next'
import { ConceptHero, ConceptSectionHeader, ConceptStat, ConceptCard } from '@/components/concept'
import { ProofGlobe } from './_components/ProofGlobe'
import { PROOF_CITIES, getTotalCityPopulation, getToolUsageCounts } from './_data/proof-cities'
import { COMPONENT_ENTRIES, GUIDANCE_ENTRIES } from './_components/toolkit-catalogue.local.config'
import { ProofCatalogueCard } from './_components/ProofCatalogueCard'
import { CATALOGUE_PROOF_KEYWORDS } from './_components/catalogue-proof.config'
import { EXAMPLE_TOOLS } from './_components/example-tools.config'
import { ComingSoonToolCard } from './_components/ComingSoonToolCard'

export const metadata: Metadata = {
  title: 'BC Global Toolkit Network (concept)',
}

/**
 * LOCKED proof-block copy (ux-writer pass 2026-06-29). Build ships Variant A; B and C are retained
 * here as easy-swap constants so the founder can switch the live wording at review without touching
 * markup. The `~82 million` figure is data-derived at render time (see PROOF_POPULATION_DISPLAY) and
 * is NOT part of this copy — the `~` carries the approximation, so no Estimate pill is used. The label
 * NEVER claims reach: population framing only.
 */
const PROOF_COPY = {
  /** Variant A — the shipped copy. */
  a: {
    heading: 'Breathe Cities member cities already run these tools for their residents.',
    label: 'the combined population of these cities',
  },
  /** Variant B — retained for live swap. */
  b: {
    heading: 'These tools are already in use across Breathe Cities member cities.',
    label: 'people live in the cities already using them',
  },
  /** Variant C — retained for live swap. */
  c: {
    heading: 'Already in use across Breathe Cities member cities.',
    label: 'residents call these cities home',
  },
} as const

/** The proof-block copy variant currently shipped. Swap to `b` or `c` to change the live wording. */
const PROOF_COPY_ACTIVE = PROOF_COPY.a

/** One step in the "How to implement" adoption path. */
type ImplementationStep = {
  /** The step's short imperative title (rendered as an h3). */
  title: string
  /** The one-line description of what the city does in this step. */
  body: string
}

/**
 * The 4-step adoption path shown under "How to implement". Static content — order IS the sequence
 * (Assess → Choose → Deploy → Communicate); the step number is derived from the array index at
 * render time, so the numbering can never drift from the order.
 */
const IMPLEMENTATION_STEPS: ImplementationStep[] = [
  {
    title: 'Assess',
    body: 'Map what your city already monitors, and where the gaps are.',
  },
  {
    title: 'Choose your components',
    body: 'Pick the monitoring, forecasting, and communication pieces that fit your city, from the catalogue on this page.',
  },
  {
    title: 'Deploy',
    body: 'Commission sensors and data infrastructure, then connect them to the tools residents can access: dashboards, maps, and alerts.',
  },
  {
    title: 'Communicate & act',
    body: 'Turn readings into practical guidance for residents, and into the evidence base city leaders need to act.',
  },
]

/**
 * The BC Global Toolkit Network landing page. Server component — the catalogue entries are static
 * config and the proof-directory cities are static data; the ProofGlobe is the only client island.
 * The aggregate city-population stat is computed once here on the server from PROOF_CITIES.
 */
export default function GlobalToolkitNetworkPage() {
  // Aggregate CITY POPULATION across every plotted city — the section's "why it matters" stat.
  // City population, NEVER implied reach (honesty rule 1). Rendered as a readable "~N million" figure
  // (Fix 1): data-derived from the same PROOF_CITIES the globe uses, never hardcoded. The exact total
  // is ~82.77M; floored to whole millions so the figure reads ~82 million, matching the locked copy
  // (rounding to nearest would read 83 and contradict the verbatim ux-writer figure). The leading `~`
  // carries the approximation, so the old Estimate pill is dropped.
  const totalCityPopulation = getTotalCityPopulation(PROOF_CITIES)
  const proofPopulationDisplay = `~${Math.floor(totalCityPopulation / 1_000_000)} million`

  // Per-capability prevalence counts: for each catalogue capability, HOW MANY cities offer their own
  // version of it (SIMAT, Airparif, AirQo, …) — an honest adoption-breadth approximation, NOT cities
  // that adopted the BC component. Computed once on the server from the same PROOF_CITIES the globe
  // uses. The detailed WHICH-cities list is reserved for the component detail page, so the card needs
  // only the count here (getToolDeploymentsByCapability remains available for that page).
  const counts = getToolUsageCounts(PROOF_CITIES, CATALOGUE_PROOF_KEYWORDS)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">

        {/* SECTION 0 — HERO. Reframed from membership (a network you JOIN) to ENABLEMENT
            (what your city could be running too). The join invitation now lives in the closing
            onramp section, not here. Body reframed (Fix 4) from the page-mechanic line to the
            verified 2030 OUTCOME: cities using these tools are working toward the Breathe Cities goal.
            "Contributing to" framing — the goal is stated as an aim, never as achieved. Locked copy. */}
        <ConceptHero
          headline="Everything your city needs to act on its air quality"
          body="The digital tools and guidance that help a city understand its air, communicate the risks, and act on them. Cities already using them are working toward the Breathe Cities goal: contributing to a 30% reduction in air pollution by 2030."
        />

        {/* SECTION 1 — PROOF DIRECTORY (Fix 1: header + stat merged into ONE block).
            The big "~82 million" figure is the visual hero, sitting directly under the locked Variant A
            heading — no separate section-header sentence, no "Every pin is real." line, no Estimate pill
            (the `~` carries the approximation). Then the proof-directory globe (16 cities). Every pin is
            a real BC member city; clicking a pin opens a panel that leads with the city's adoption story
            then lists OUR catalogue categories matched to the real tools it runs. */}
        <section className="mt-12">
          {/* Merged proof block: heading + the population figure as the visual hero, in one card.
              ConceptStat renders the big figure; the heading sits above it. */}
          <ConceptCard>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {PROOF_COPY_ACTIVE.heading}
            </h2>
            <div className="mt-4">
              <ConceptStat value={proofPopulationDisplay} label={PROOF_COPY_ACTIVE.label} />
            </div>
          </ConceptCard>
          {/* The proof-directory globe — fresh, fully-isolated component + data for this concept. */}
          <div className="mt-6">
            <ProofGlobe cities={PROOF_CITIES} />
          </div>
        </section>

        {/* SECTION 2 — COMPONENTS CATALOGUE. Live digital surfaces a city embeds — imported
            directly from the Toolkit concept's catalogue config. Source files are untouched. */}
        <ConceptSectionHeader
          heading="Components"
          body="Interactive tools residents and city teams use directly: dashboards, maps, alerts, and data feeds."
          className="mt-16"
        />
        <section className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENT_ENTRIES.map((entry) => (
              <ProofCatalogueCard
                key={entry.id}
                entry={entry}
                cityCount={counts[entry.id] ?? 0}
              />
            ))}
            {/* Illustrative example tools (AQ Patterns, Air Window, City Futures), appended AFTER the
                real COMPONENT_ENTRIES so they sit uniformly in the same grid. Each is a "Coming soon"
                card with a single full-colour preview image and the locked blurb — NO counter, NO link
                (concept honesty: these are not yet in use). v2 founder direction replaced the former
                standalone "Tailored tools" section with this in-grid placement. */}
            {EXAMPLE_TOOLS.map((tool) => (
              <ComingSoonToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* SECTION 3 — GUIDANCE CATALOGUE. Studies, methodologies, and programmes — imported
            directly from the Toolkit concept's catalogue config. Source files are untouched. */}
        <ConceptSectionHeader
          heading="Guidance"
          body="Studies, methodologies, and programmes that help cities interpret data, set standards, and make the case for action."
          className="mt-16"
        />
        <section className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDANCE_ENTRIES.map((entry) => (
              <ProofCatalogueCard
                key={entry.id}
                entry={entry}
                cityCount={counts[entry.id] ?? 0}
              />
            ))}
          </div>
        </section>

        {/* SECTION 4 — HOW TO IMPLEMENT. The "coming soon" placeholder is replaced with the real
            4-step adoption path: each step is a numbered ConceptCard. The former muted reference line
            (Guidance catalogue + OpenAQ / Clean Air Fund partner links) was removed (Fix 5): with it
            gone, every onward action on the page is now inert — an accepted concept state, not a bug. */}
        <ConceptSectionHeader
          heading="How to implement"
          body="Four steps, from first assessment to residents receiving real guidance."
          className="mt-16"
        />
        <section className="mt-6">
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {IMPLEMENTATION_STEPS.map((step, index) => (
              <li key={step.title}>
                <ConceptCard className="h-full">
                  {/* Step number — brand-blue marker; encodes sequence (functional colour). */}
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--bc-color-blue)' }}
                  >
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </ConceptCard>
              </li>
            ))}
          </ol>
        </section>

        {/* SECTION 5 — BRING THE TOOLKIT TO YOUR CITY. The closing onramp — completes the
            "you could have this too" arc and carries the network-join invitation deliberately
            moved out of the hero. The CTA is INERT (href="#"): shown as a real styled button per
            the no-dead-ends rule, but it goes nowhere in this concept. Brand-blue fill, white
            label, 56px minimum touch target. */}
        <ConceptSectionHeader
          heading="Bring the toolkit to your city"
          body="Every city here started where yours is now. Breathe Cities works with you to assess, choose, and deploy the tools that fit your context and your residents."
          className="mt-16"
        />
        <section className="mt-6">
          <ConceptCard>
            <a
              href="#"
              className="inline-flex min-h-[56px] items-center justify-center rounded-xl px-6 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--bc-color-blue)' }}
            >
              Get in touch
            </a>
          </ConceptCard>
        </section>

      </div>
    </main>
  )
}
