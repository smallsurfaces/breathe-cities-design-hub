/**
 * toolkit-catalogue.local.config.ts — the catalogue model for the global-toolkit-network landing.
 *
 * Purpose
 *   Concept-local vendored copy of the toolkit catalogue model for the global-toolkit-network concept
 *   (promotion to client review hub, 2026-06-29): the concept stands alone with zero dependency on
 *   any sibling `toolkit` concept. This file is the single source for the catalogue: the eight
 *   capabilities, each tagged with a TIER (Component vs Guidance) and a STATUS (Available vs Coming
 *   soon), plus the route for the one that is live.
 *
 *   The source file also exported a TOOLKIT_CHROME chrome config (used by the toolkit landing). The
 *   global-toolkit-network concept supplies its OWN chrome via global-toolkit-network-nav.ts, so the
 *   chrome config and its sibling toolkit-nav dependency are intentionally dropped from this copy —
 *   only the catalogue model the concept consumes (entries + types) is vendored here.
 *
 *   Mapping to the 8 capabilities (ids match toolkit-data.local.ts TOOL_LABELS so the concept-local
 *   sketch panels can be keyed off them):
 *     - Components (live digital surfaces a city embeds): monitoring (AVAILABLE), benchmarking,
 *       forecasting, health, openData.
 *     - Guidance (a study / methodology / programme, not a live widget): sourceId, advocacy, action.
 *   Real-time Monitoring is the only Available capability and the only card that links through; the
 *   other seven are Coming soon previews.
 *
 * Key exports: CatalogueStatus, CatalogueTier, CatalogueEntry, COMPONENT_ENTRIES, GUIDANCE_ENTRIES
 * External dependencies: ./toolkit-data.local (ToolId, concept-local)
 */

import type { ToolId } from './toolkit-data.local'

/** Whether a capability is shipping today or previewed. */
export type CatalogueStatus = 'available' | 'coming-soon'

/** Which tier a capability belongs to: a live digital component, or guidance/methodology. */
export type CatalogueTier = 'component' | 'guidance'

/** One catalogue entry — a capability with its tier, status, framing copy, and optional live route. */
export type CatalogueEntry = {
  /** Matches the toolkit-data ToolId so the shared sketch panel can be selected for the preview. */
  id: ToolId
  /** Card title. */
  title: string
  /** One-line framing of what this capability is (catalogue voice, not per-city). */
  blurb: string
  tier: CatalogueTier
  status: CatalogueStatus
  /** Where the card links when available; null for coming-soon (card not linked). */
  href: string | null
}

/** The live route for the one shipping component. */
const RT_MONITORING_ROUTE = '/ux-concepts/toolkit/real-time-monitoring'

/**
 * Component-tier entries — live digital surfaces a city would embed. Real-time Monitoring ships
 * today (links through); the rest are previewed as Coming soon.
 */
export const COMPONENT_ENTRIES: readonly CatalogueEntry[] = [
  {
    id: 'monitoring',
    title: 'Real-time Monitoring',
    blurb:
      'A live map of a city’s air-quality sensors — what is measuring, what it reads now, and how fresh that reading is. The foundation the rest of the stack builds on.',
    tier: 'component',
    status: 'available',
    href: RT_MONITORING_ROUTE,
  },
  {
    id: 'benchmarking',
    title: 'Standards Benchmarking',
    blurb:
      'Reading against the WHO guideline and the national standard, so a number becomes a judgement: safe, or not.',
    tier: 'component',
    status: 'coming-soon',
    href: null,
  },
  {
    id: 'forecasting',
    title: 'Forecasting',
    blurb:
      'A short-range outlook of the days ahead, so residents and city teams can plan around poor-air days.',
    tier: 'component',
    status: 'coming-soon',
    href: null,
  },
  {
    id: 'health',
    title: 'Health & Education',
    blurb:
      'Plain-language guidance tied to the current reading — what to do today, for the people most at risk.',
    tier: 'component',
    status: 'coming-soon',
    href: null,
  },
  {
    id: 'openData',
    title: 'Open Data Access',
    blurb:
      'The underlying readings, downloadable and queryable, so researchers and developers can build on the network.',
    tier: 'component',
    status: 'coming-soon',
    href: null,
  },
]

/**
 * Guidance-tier entries — a study, methodology, or programme rather than a live widget. All previewed
 * as Coming soon.
 */
export const GUIDANCE_ENTRIES: readonly CatalogueEntry[] = [
  {
    id: 'sourceId',
    title: 'Source Identification study',
    blurb:
      'A source-apportionment study that attributes pollution to its causes — traffic, industry, burning — so action targets the right thing.',
    tier: 'guidance',
    status: 'coming-soon',
    href: null,
  },
  {
    id: 'advocacy',
    title: 'Advocacy & Storytelling playbook',
    blurb:
      'Turning the data into a case for change — trends, comparisons, and narratives that move decision-makers.',
    tier: 'guidance',
    status: 'coming-soon',
    href: null,
  },
  {
    id: 'action',
    title: 'Action & Behaviour Change programme',
    blurb:
      'Translating awareness into behaviour — the interventions and nudges that change what people and institutions do.',
    tier: 'guidance',
    status: 'coming-soon',
    href: null,
  },
]

// Note: the source `toolkit-catalogue.config.ts` also exported TOOLKIT_CHROME (the BcChromeConfig for
// the toolkit landing). It is intentionally omitted from this concept-local copy — the
// global-toolkit-network concept supplies its own chrome via global-toolkit-network-nav.ts, and the
// concept never imported TOOLKIT_CHROME. Dropping it removes the sibling toolkit-nav cross-concept
// dependency, keeping this file self-contained.
