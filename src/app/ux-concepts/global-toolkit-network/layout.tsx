/**
 * layout.tsx — Global Network concept chrome wrapper.
 *
 * Purpose
 *   Wraps every Global Network page in the two-bar chrome stack:
 *     1. PrototypeHeader — the tooling bar (back-to-hub + comment widget + "Updated" stamp).
 *        Visible to the internal team reviewing the prototype; not part of BC's site.
 *     2. BcHeader — the shared BC site nav, driven by GLOBAL_TOOLKIT_NETWORK_CHROME (all live routes
 *        point at the global-toolkit-network route, so this concept is self-contained).
 *   BcFooter closes every page.
 *
 *   Matches the chrome contract established by aq-network-v2/layout.tsx: tooling bar on top,
 *   site nav below, footer at the bottom. The GLOBAL_TOOLKIT_NETWORK_CHROME config is defined inline
 *   here (not added to the shared bc-chrome.config.ts) — the Global Network concept is a
 *   standalone prototype and does not need to share its chrome with other concepts.
 *
 * Key exports: GlobalNetworkLayout (default)
 * External dependencies: PrototypeHeader (../../_components/PrototypeHeader),
 *   @/components/concept (BcHeader, BcFooter, BcChromeConfig),
 *   ../../_data/concept-registry (CONCEPTS),
 *   ./global-toolkit-network-nav (GLOBAL_TOOLKIT_NETWORK_NAV, GLOBAL_TOOLKIT_NETWORK_ROUTE)
 */

import { PrototypeHeader } from '../../_components/PrototypeHeader'
import { BcHeader, BcFooter } from '@/components/concept'
import type { BcChromeConfig } from '@/components/concept'
import { CONCEPTS } from '../../_data/concept-registry'
import { GLOBAL_TOOLKIT_NETWORK_NAV, GLOBAL_TOOLKIT_NETWORK_ROUTE } from './global-toolkit-network-nav'

/**
 * Chrome config for the Global Network concept. Defined inline — not added to the shared
 * bc-chrome.config.ts — because this is a per-concept config that doesn't need to be shared.
 * The logo and "Toolkit" nav item both point at the Global Network landing.
 */
const GLOBAL_TOOLKIT_NETWORK_CHROME: BcChromeConfig = {
  logoHref: GLOBAL_TOOLKIT_NETWORK_ROUTE,
  nav: GLOBAL_TOOLKIT_NETWORK_NAV,
}

export default function GlobalNetworkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Tooling bar (back-to-hub + comments) ABOVE the BC-site recreation.
          Title from the concept registry so the bar matches the hub catalogue label. */}
      <PrototypeHeader buildName={CONCEPTS.globalToolkitNetwork.title} />
      {/* BC site nav — the shared chrome, configured for Global Network. */}
      <BcHeader config={GLOBAL_TOOLKIT_NETWORK_CHROME} />
      {children}
      <BcFooter />
    </>
  )
}
