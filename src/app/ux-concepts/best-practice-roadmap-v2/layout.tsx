/**
 * layout.tsx — Best Practice Roadmap v2 layout (synchronised skin).
 *
 * Purpose
 *   Wraps every Best Practice Roadmap v2 page in the standard two-bar chrome, in this order:
 *     1. PrototypeHeader — tooling bar (sole "Back to hub" + comment widget). Not part of BC's site.
 *     2. BcHeader — the SHARED concept chrome component, driven by ROADMAP_V2_CHROME so all live
 *        routes point at the v2 paths and the concept is self-contained.
 *        BcFooter (shared, static) closes every page.
 *   Tooling bar on top, site nav below — matching the aq-network-v2 layout convention.
 *
 *   Difference from v1: chrome comes from the shared concept layer (BcHeader/BcFooter from
 *   @/components/concept) rather than the per-folder _components/BcChrome.tsx copy. The
 *   ROADMAP_V2_CHROME config is co-located in this folder (roadmap-chrome.config.ts) so this
 *   wave touches no shared file.
 *
 * Key exports: RoadmapV2Layout (default)
 * External dependencies: PrototypeHeader, @/components/concept (BcHeader, BcFooter),
 *   ./roadmap-chrome.config (ROADMAP_V2_CHROME), the single-source concept registry (CONCEPTS).
 */

import { PrototypeHeader } from '../../_components/PrototypeHeader'
import { BcHeader, BcFooter } from '@/components/concept'
import { ROADMAP_V2_CHROME } from './roadmap-chrome.config'
import { CONCEPTS } from '../../_data/concept-registry'

export default function RoadmapV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Tooling bar (back-to-hub + comments) ABOVE the BC-site recreation. Title from the
          concept registry so v2 reads the SAME name as v1 and the hub (no "vN — concept"). */}
      <PrototypeHeader buildName={CONCEPTS.roadmap.title} />
      {/* BC site nav — the SHARED chrome, configured for Roadmap v2 routes. */}
      <BcHeader config={ROADMAP_V2_CHROME} />
      {children}
      <BcFooter />
    </>
  )
}
