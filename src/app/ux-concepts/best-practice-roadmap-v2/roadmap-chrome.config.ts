/**
 * roadmap-chrome.config.ts — per-concept chrome config for Best Practice Roadmap v2.
 *
 * Purpose
 *   Co-located BcChromeConfig for the v2 reskin. The shared BcHeader takes this config so the
 *   nav items point at the v2 routes, keeping the concept fully self-contained. The "Cities"
 *   slot and "Roadmap" slot are live; all other BC primary-nav labels remain inert (href === '#')
 *   so the chrome reads as BC's real IA without dead-end links.
 *
 *   Lives in the v2 folder (not in src/components/concept/bc-chrome.config.ts) per the parallel-
 *   safety rule — only files under best-practice-roadmap-v2/ are edited in this wave.
 *
 * Key exports: ROADMAP_V2_CHROME (const)
 * External dependencies: @/components/concept (BcChromeConfig type)
 */

import type { BcChromeConfig } from '@/components/concept'

/**
 * Best Practice Roadmap v2 chrome config. All live routes target the v2 path so the concept is
 * self-contained. The brand mark and the "Roadmap" slot both point at the v2 overview; the
 * "Cities" slot points at the v2 cities listing.
 */
export const ROADMAP_V2_CHROME: BcChromeConfig = {
  logoHref: '/ux-concepts/best-practice-roadmap-v2',
  nav: [
    { label: 'Who we are', href: '#' },
    { label: 'What we do', href: '#' },
    { label: 'Why we do it', href: '#' },
    { label: 'Cities', href: '/ux-concepts/best-practice-roadmap-v2/cities' },
    { label: 'Roadmap', href: '/ux-concepts/best-practice-roadmap-v2' },
    { label: 'Voices', href: '#' },
    { label: 'News', href: '#' },
  ],
}
