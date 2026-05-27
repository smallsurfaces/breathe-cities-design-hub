/**
 * bc-chrome.config.ts — co-located chrome config for the Cities (Resident Concerns) concept.
 *
 * Purpose
 *   The shared BcHeader/BcFooter (from @/components/concept) is config-driven: the only thing that
 *   differs between concepts is which nav items are LIVE and where the brand mark / "Cities" slot
 *   point. This file holds that config for the Cities concept, co-located in the concept folder so
 *   the concept owns its own chrome wiring (the shared bc-chrome.config.ts in @/components/concept
 *   ships only AQ_NETWORK_CHROME — per-concept configs that aren't yet promoted to the shared layer
 *   live beside their concept, exactly as this one does).
 *
 *   For the Cities concept, BC's "Cities" page IS this concept (the concern landing), so the Cities
 *   slot — and the brand mark — both carry this concept's own home route. All other BC labels
 *   (Who we are / What we do / Why we do it / Voices / News) stay inert (href === '#') so the
 *   chrome still reads as BC's real site IA without inventing pages the prototype doesn't have.
 *
 *   Routes target the canonical `/ux-concepts/cities` route (the concern landing) — the concept's
 *   single canonical home after the v1/v2 collapse.
 *
 * Concern-centric note (restructure 2026-05-25): this replaces the v1+v2 chrome configs. The
 *   concept is one canonical build at `/ux-concepts/cities` (no more cities-v2 split), so every
 *   route here points at the canonical landing.
 *
 * Key exports: CITIES_CHROME (const)
 * External dependencies: @/components/concept (BcChromeConfig type)
 */

import type { BcChromeConfig } from '@/components/concept'

/**
 * Cities chrome config — the brand mark and the live "Cities" slot both point at the canonical
 * cities concern landing (`/ux-concepts/cities`); every other BC label stays inert (`#`) so the
 * chrome still reads as BC's real IA with no dead-end navigation. Nav wording mirrors BC's real
 * primary nav (Who we are / What we do / Why we do it / Cities / Voices / News).
 */
export const CITIES_CHROME: BcChromeConfig = {
  logoHref: '/ux-concepts/cities',
  nav: [
    { label: 'Who we are', href: '#' },
    { label: 'What we do', href: '#' },
    { label: 'Why we do it', href: '#' },
    { label: 'Cities', href: '/ux-concepts/cities' },
    { label: 'Voices', href: '#' },
    { label: 'News', href: '#' },
  ],
}
