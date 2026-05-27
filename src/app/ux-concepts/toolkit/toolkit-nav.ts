/**
 * toolkit-nav.ts — the single source for the toolkit section's BcHeader nav set.
 *
 * Purpose
 *   The toolkit has two surfaces that both render the shared BcHeader: the catalogue LANDING
 *   (/ux-concepts/toolkit) and the real-time monitoring COMPONENT (/ux-concepts/toolkit/
 *   real-time-monitoring). Their nav bars must read identically — same labels, same order, with
 *   "Toolkit" as the live (current-section) item on both. Previously each surface defined its own
 *   nav array inline and the two drifted out of sync (one gained News and dropped Toolkit; the
 *   other did the reverse). This module exists so the nav is defined ONCE and imported into both
 *   configs, making that drift impossible.
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
