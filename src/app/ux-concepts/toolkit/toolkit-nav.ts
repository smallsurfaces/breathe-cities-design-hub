/**
 * toolkit-nav.ts — the single source for the toolkit section's BcHeader nav set.
 *
 * Purpose
 *   wireframe-lock-2026-05-26 client-share build: only the catalogue LANDING surface remains
 *   (/ux-concepts/toolkit); the real-time monitoring COMPONENT subroute was removed because it
 *   depended on a live OpenAQ Mapbox embed. This module is retained because the landing still
 *   imports TOOLKIT_NAV and TOOLKIT_ROUTE, and the shared-nav contract is the right place to
 *   reintroduce additional toolkit surfaces from when they re-enter the snapshot.
 *
 *   Historical context (kept for future agents): the file originally existed because two toolkit
 *   surfaces both rendered the shared BcHeader and the two inline nav arrays had drifted out of
 *   sync. Centralising the nav here made the drift impossible.
 *
 *   Live vs inert follows the BcChrome contract (see components/concept/BcChrome.tsx): an item is
 *   LIVE when href !== '#' (rendered as a clickable link / current-section affordance) and inert
 *   otherwise (a real BC label the prototype does not implement — shown but not clickable). On both
 *   toolkit surfaces the visitor is inside the Toolkit section, so "Toolkit" is the live item; the
 *   remaining standard BC labels stay inert so the chrome still reads as BC's real site IA.
 *
 * Key exports: TOOLKIT_NAV (const)
 * External dependencies: @/components/concept (BcChromeNavItem type)
 */

import type { BcChromeNavItem } from '@/components/concept'

/** The live route for the toolkit landing — the "Toolkit" item's destination and the section home. */
export const TOOLKIT_ROUTE = '/ux-concepts/toolkit'

/**
 * The toolkit section's primary nav, identical across the landing and every component page.
 * "Toolkit" is live (current section); the standard BC labels are inert (`#`). Import this into a
 * surface's chrome config rather than re-declaring the array, so the two surfaces cannot drift.
 */
export const TOOLKIT_NAV: BcChromeNavItem[] = [
  { label: 'Who we are', href: '#' },
  { label: 'Why we do it', href: '#' },
  { label: 'Cities', href: '#' },
  { label: 'Toolkit', href: TOOLKIT_ROUTE },
  { label: 'Voices', href: '#' },
  { label: 'News', href: '#' },
]
