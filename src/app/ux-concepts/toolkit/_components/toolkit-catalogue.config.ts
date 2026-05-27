/**
 * toolkit-catalogue.config.ts — the catalogue model + chrome config for the toolkit LANDING.
 *
 * Purpose
 *   The toolkit landing is reframed (increment 2) from the v2 per-city AUDIT ("which tools does this
 *   city have?") to a component CATALOGUE ("everything a complete AQ stack needs, and which parts BC
 *   offers today"). This file is the single source for that catalogue: the eight capabilities, each
 *   tagged with a TIER (Component vs Guidance) and a STATUS (Available vs Coming soon), plus the
 *   route for the one that is live. It also co-locates the BcHeader/BcFooter chrome config for the
 *   landing (the concept-layer pattern: config beside the surface that uses it).
 *
 *   Mapping to the 8 toolkit capabilities (ids match data/toolkit-data.ts TOOL_LABELS so the shared
 *   sketch panels can be keyed off them):
 *     - Components (live digital surfaces a city embeds): monitoring (AVAILABLE), benchmarking,
 *       forecasting, health, openData.
 *     - Guidance (a study / methodology / programme, not a live widget): sourceId, advocacy, action.
 *   Real-time Monitoring is the only Available capability and the only card that links through
 *   (to /ux-concepts/toolkit/real-time-monitoring); the other seven are Coming soon previews.
 *
 * Key exports: CatalogueStatus, CatalogueTier, CatalogueEntry, COMPONENT_ENTRIES, GUIDANCE_ENTRIES,
 *   TOOLKIT_CHROME
 * External dependencies: @/data/toolkit-data (ToolId), @/components/concept (BcChromeConfig type),
 *   ../toolkit-nav (shared TOOLKIT_NAV / TOOLKIT_ROUTE)
 */

import type { ToolId } from '@/data/toolkit-data'
import type { BcChromeConfig } from '@/components/concept'
import { TOOLKIT_NAV, TOOLKIT_ROUTE } from '../toolkit-nav'

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

/**
 * Chrome config for the toolkit landing. The brand mark links to the landing itself. The nav set is
 * the shared TOOLKIT_NAV (toolkit-nav.ts) — defined once and imported by both this landing and the
 * real-time monitoring component so the two cannot drift; "Toolkit" is the live current-section item,
 * the remaining BC labels stay inert (`#`) so the chrome reads as BC's real site IA. Back-to-hub is
 * owned by the PrototypeHeader above this chrome, so no live "Dev hub" nav item is needed here.
 */
export const TOOLKIT_CHROME: BcChromeConfig = {
  logoHref: TOOLKIT_ROUTE,
  nav: TOOLKIT_NAV,
}
