/**
 * global-toolkit-network-nav.ts — nav config for the Global Network concept.
 *
 * Purpose
 *   The Global Network concept has one surface (the landing page). This module provides
 *   the nav array and live route used by both the BcHeader chrome config in layout.tsx and
 *   any future sub-pages that need the same nav. Defined once here so nav entries cannot
 *   drift across surfaces — mirrors the pattern in toolkit-nav.ts.
 *
 *   "Toolkit" is the live current-section item (href !== '#') because the Global Network
 *   concept lives under the Toolkit pillar in BC's IA. All other BC labels stay inert (#)
 *   so the chrome reads as BC's real site navigation without pointing at pages the prototype
 *   does not implement.
 *
 * Key exports: GLOBAL_TOOLKIT_NETWORK_ROUTE (const string), GLOBAL_TOOLKIT_NETWORK_NAV (const array)
 * External dependencies: @/components/concept (BcChromeNavItem type)
 */

import type { BcChromeNavItem } from '@/components/concept'

/** The live route for the Global Network landing — the "Toolkit" item's destination and the section home. */
export const GLOBAL_TOOLKIT_NETWORK_ROUTE = '/ux-concepts/global-toolkit-network'

/**
 * The Global Network section's primary nav. "Toolkit" is the live current-section item;
 * the remaining standard BC labels are inert (`#`). Import this into the layout's chrome
 * config — do not redeclare the array elsewhere.
 */
export const GLOBAL_TOOLKIT_NETWORK_NAV: BcChromeNavItem[] = [
  { label: 'Who we are', href: '#' },
  { label: 'Why we do it', href: '#' },
  { label: 'Cities', href: '#' },
  { label: 'Toolkit', href: GLOBAL_TOOLKIT_NETWORK_ROUTE },
  { label: 'Voices', href: '#' },
  { label: 'News', href: '#' },
]
