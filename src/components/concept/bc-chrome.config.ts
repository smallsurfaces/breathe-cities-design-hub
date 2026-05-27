/**
 * bc-chrome.config.ts — per-concept configuration for the shared BcChrome site nav.
 *
 * Purpose
 *   The shared BcHeader/BcFooter (BcChrome.tsx) is a single, reusable recreation of Breathe
 *   Cities' real site chrome. What differs BETWEEN concept prototypes is only which nav items
 *   are LIVE and where the brand mark / "Cities" slot point. This file holds that per-concept
 *   config as data, so one BcChrome component can serve every concept by taking a config prop.
 *
 *   In each concept BC's "Cities" page IS that concept (the AQ Network globe home, etc.), so the
 *   Cities slot carries the concept's own home route. The remaining BC labels (Who we are / Why
 *   we do it / Voices / News) stay inert (href === '#') so the chrome still reads as BC's real
 *   site IA without inventing pages that don't exist in the prototype.
 *
 *   Today only AQ_NETWORK_CHROME is defined — pointed at the v2 route so the shared layer ships
 *   self-contained against aq-network-v2. Configs for the other three concepts (cities /
 *   best-practice-roadmap / jtbd-city-toolkit) come in later waves; add them here when those
 *   concepts adopt the shared chrome.
 *
 * Key exports: BcChromeNavItem (type), BcChromeConfig (type), AQ_NETWORK_CHROME (const)
 * External dependencies: none.
 */

/**
 * One primary-nav entry. `href === '#'` marks an INERT label (a real BC nav item the prototype
 * does not implement) — the renderer derives "live" from `href !== '#'` and styles/links
 * accordingly, so an inert item is shown but not clickable (no dead-end navigation).
 */
export type BcChromeNavItem = {
  /** The visible nav label (BC's real primary-nav wording). */
  label: string
  /** The route this item links to, or '#' to mark it inert (shown, not clickable). */
  href: string
}

/**
 * Per-concept chrome configuration. Carries where the brand mark (logo) links and the
 * primary-nav set (with the concept's own home in the live slot). One config drives both the
 * header and the mobile overlay; the footer is static and takes none.
 */
export type BcChromeConfig = {
  /** Where the brand logo links — the concept's own home route. */
  logoHref: string
  /** The primary-nav set; the concept's home occupies the live "Cities" slot. */
  nav: BcChromeNavItem[]
}

/**
 * AQ Network chrome config — all live routes target the v2 route (`/ux-concepts/aq-network-v2`)
 * so v2 is fully self-contained. The brand mark and the "Cities" slot both point at the v2 globe
 * home; every other BC label stays inert (`#`) so the chrome still reads as BC's real IA.
 */
export const AQ_NETWORK_CHROME: BcChromeConfig = {
  logoHref: '/ux-concepts/aq-network-v2',
  nav: [
    { label: 'Who we are', href: '#' },
    { label: 'Why we do it', href: '#' },
    { label: 'Cities', href: '/ux-concepts/aq-network-v2' },
    { label: 'Voices', href: '#' },
    { label: 'News', href: '#' },
  ],
}
