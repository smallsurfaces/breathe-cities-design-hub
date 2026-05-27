/**
 * AdoptionGuide.tsx — the mock "Bring it to your city" adoption block for the component page.
 *
 * Purpose:
 *   Frames the real-time monitoring map as an ADOPTABLE open-source component: a short, illustrative
 *   set of steps a city or partner would follow to stand it up, plus a mock embed/code snippet. The
 *   tone is generous open-source gap-filler ("here is the component, here is how you'd run it") — it
 *   is illustrative, NOT a working install (the snippet is a realistic mock, not copy-pasteable
 *   wiring). It exists to communicate that this is a reusable component, not a one-off page.
 *
 *   Structure: a numbered step list (4 steps) + a mock code/embed block. Both sit on the shared
 *   concept surfaces so the section matches the rest of the page.
 *
 * Key exports: AdoptionGuide
 * External dependencies: react, @/components/concept (ConceptCard, ConceptSectionHeader)
 *
 * Token discipline: numbered step badges use the BC brand pairing via inline tokens; the code block
 *   uses the canonical dark-blue/light-teal code-block pairing (structural, the same pairing the
 *   toolkit's Open Data panel uses), not decorative colour. Light mode. No emoji.
 */

import React from 'react'
import { ConceptCard, ConceptSectionHeader } from '@/components/concept'

/** One illustrative adoption step. */
type AdoptionStep = {
  title: string
  body: string
}

/**
 * The four illustrative adoption steps. Deliberately high-level and tool-agnostic — they describe
 * the SHAPE of adopting the component, not a literal install transcript.
 */
const STEPS: readonly AdoptionStep[] = [
  {
    title: 'Point it at your city',
    body: 'Add your city to the registry with a map centre and a bounding box. One entry is all the data layer needs to start pulling stations for that area.',
  },
  {
    title: 'Connect an open data source',
    body: 'The component reads from OpenAQ out of the box. Bring your own monitoring network the same way — any source that can return stations, readings, and timestamps.',
  },
  {
    title: 'Embed the map',
    body: 'Drop the component into any page. It ships with the city switcher, the parameter toggle, station provenance, and the "check air quality" probe already wired.',
  },
  {
    title: 'Keep it honest',
    body: 'Freshness is shown per sensor, sparse coverage is labelled, and the probe lists the live sensors behind a reading rather than inventing a single number. Your residents see exactly what the network knows.',
  },
]

/**
 * A realistic-looking MOCK embed snippet. Illustrative only — it communicates "this is a component
 * you configure and mount", it is not a working integration. No real keys or endpoints.
 */
const MOCK_SNIPPET = `import { RealTimeMonitoringMap } from '@breathe-cities/aq-toolkit'

<RealTimeMonitoringMap
  cities={['accra', 'bangkok', 'paris', 'london']}
  parameters={['pm25', 'pm10']}
  dataSource="openaq"
  defaultCity="accra"
/>`

export function AdoptionGuide(): React.ReactElement {
  return (
    <section className="space-y-6">
      <ConceptSectionHeader
        heading="Bring it to your city"
        body="Real-time monitoring is an open-source component, built to be adopted. Here is the shape of standing it up for a new city — illustrative, to show how the pieces fit."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Numbered step cards */}
        {STEPS.map((step, index) => (
          <ConceptCard key={step.title} className="flex gap-4">
            {/* Step number badge — BC brand pairing (functional wayfinding, not decoration). */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{
                backgroundColor: 'var(--bc-color-light-teal)',
                color: 'var(--bc-color-dark-blue)',
              }}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          </ConceptCard>
        ))}
      </div>

      {/* Mock embed snippet — illustrative, on the canonical code-block pairing. */}
      <ConceptCard noPadding className="overflow-hidden">
        <div
          className="flex items-center justify-between border-b px-4 py-2.5"
          style={{ borderColor: 'var(--bc-color-steel)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Mock embed
          </span>
          <span className="text-[11px] text-muted-foreground">illustrative — not a working install</span>
        </div>
        <pre
          className="overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-relaxed"
          style={{
            backgroundColor: 'var(--bc-color-dark-blue)',
            color: 'var(--bc-color-light-teal)',
            margin: 0,
          }}
        >
          <code>{MOCK_SNIPPET}</code>
        </pre>
      </ConceptCard>
    </section>
  )
}
