/**
 * layout.tsx -- AQ Network v2 layout (chrome for the globe homepage + member profiles).
 *
 * Purpose
 *   Identical chrome contract to the v1 AQ Network layout, but wired to the SHARED concept
 *   composition layer instead of a per-folder BcChrome copy. Wraps every AQ Network v2 page in
 *   two stacked bars, in this order:
 *     1. PrototypeHeader -- the TOOLING bar (sole "Back to hub" + comment widget + "Updated"
 *        stamp). How the team REVIEWS the prototype; not part of BC's site.
 *     2. BcHeader -- the SITE nav, now the SHARED component from `@/components/concept`, driven by
 *        AQ_NETWORK_CHROME (all live routes point at the v2 route, so v2 is self-contained).
 *        BcFooter (also shared, static) closes every page.
 *   Tooling on top, site nav below — matching the v1 layout's convention.
 *
 * Difference from v1: chrome comes from the shared layer (one BcChrome for all concepts, config
 *   as a prop) rather than aq-network-v2/_components/BcChrome.tsx (deleted in v2). The buildName
 *   is updated to distinguish this synchronised v2 copy in the tooling bar.
 *
 * Key exports: AqNetworkV2Layout (default)
 * External dependencies: PrototypeHeader, @/components/concept (BcHeader, BcFooter,
 *   AQ_NETWORK_CHROME), the single-source concept registry (CONCEPTS) for the bar title.
 */

import { PrototypeHeader } from "../../_components/PrototypeHeader";
import { BcHeader, BcFooter, AQ_NETWORK_CHROME } from "@/components/concept";
import { CONCEPTS } from "../../_data/concept-registry";

export default function AqNetworkV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Tooling bar (back-to-hub + comments) ABOVE the BC-site recreation. Title from the
          concept registry so v2 reads the SAME name as v1 and the hub (no "vN — concept"). */}
      <PrototypeHeader buildName={CONCEPTS.aqNetwork.title} />
      {/* BC site nav -- the SHARED chrome, configured for AQ Network (v2 routes). */}
      <BcHeader config={AQ_NETWORK_CHROME} />
      {children}
      <BcFooter />
    </>
  );
}
