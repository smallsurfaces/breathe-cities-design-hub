/**
 * page.tsx — City AQ Toolkit LANDING (component catalogue), increment 2.
 *
 * Purpose
 *   The toolkit landing, reframed from the v2 per-city AUDIT to a component CATALOGUE: it lays out
 *   everything a complete air-quality stack needs, grouped into Components (live digital surfaces a
 *   city embeds) and Guidance (studies / methodologies / programmes), and shows which parts BC
 *   offers today. Real-time Monitoring is the one Available capability and links through to its
 *   component page; the other seven are Coming-soon previews (sketch kept, card de-emphasised, not
 *   linked).
 *
 *   Dropped from the v2 shell (deliberately, per the reframe): the city selector, the per-city
 *   lit/dim mechanic, and the sensor-density strip. The catalogue is about the STACK, not one city.
 *
 *   Chrome is rendered INLINE here (PrototypeHeader + BcHeader + BcFooter) rather than via a
 *   toolkit-level layout.tsx — a layout at this segment would also wrap the nested
 *   /toolkit/real-time-monitoring route (which has its own chrome), double-rendering it. Rendering
 *   chrome in the page keeps the two surfaces independent.
 *
 * Route: /ux-concepts/toolkit
 *
 * Key exports: ToolkitLandingPage (default)
 * External dependencies: @/components/concept (ConceptHero, ConceptSectionHeader, BcHeader,
 *   BcFooter), ../../_components/PrototypeHeader, ../../_data/concept-registry (CONCEPTS),
 *   ./_components/{toolkit-catalogue.config, CatalogueCard}
 */

import { PrototypeHeader } from '../../_components/PrototypeHeader'
import { CONCEPTS } from '../../_data/concept-registry'
import {
  ConceptHero,
  ConceptSectionHeader,
  BcHeader,
  BcFooter,
} from '@/components/concept'
import {
  COMPONENT_ENTRIES,
  GUIDANCE_ENTRIES,
  TOOLKIT_CHROME,
} from './_components/toolkit-catalogue.config'
import { CatalogueCard } from './_components/CatalogueCard'

export default function ToolkitLandingPage() {
  return (
    <>
      {/* Tooling bar (back-to-hub + comments + "Updated" stamp) ABOVE the BC-site recreation.
          Title from the concept registry so the bar matches the hub label (no "concept" suffix). */}
      <PrototypeHeader buildName={CONCEPTS.toolkit.title} />
      {/* BC site nav — the SHARED chrome, configured for the toolkit landing. */}
      <BcHeader config={TOOLKIT_CHROME} />

      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-12">
          {/* ── Hero — the catalogue pitch. Eyebrow dropped this pass (Jack's decision): uses the
                shared ConceptHero with no `eyebrow` prop. */}
          <ConceptHero
            headline="Everything a complete air-quality stack needs"
            body="A catalogue of the digital components and guidance a city needs to understand, communicate, and act on its air quality — and which parts Breathe Cities offers today. Real-time monitoring is the foundation, and it is available now; the rest are on the way."
          />

          {/* ── Components tier ──────────────────────────────────────────────────── */}
          <section className="space-y-5">
            <ConceptSectionHeader
              heading="Components"
              body="Live digital surfaces a city embeds — the interactive pieces residents and city teams use directly."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COMPONENT_ENTRIES.map((entry) => (
                <CatalogueCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>

          {/* ── Guidance tier ────────────────────────────────────────────────────── */}
          <section className="space-y-5">
            <ConceptSectionHeader
              heading="Guidance"
              body="Studies, methodologies, and programmes — the expertise that turns the data into the right action."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDANCE_ENTRIES.map((entry) => (
                <CatalogueCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Shared static footer. */}
      <BcFooter />
    </>
  )
}
