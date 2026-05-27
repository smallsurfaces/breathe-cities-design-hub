/**
 * layout.tsx — Cities (Resident Concerns showcase) layout
 *
 * Purpose: Adds the standard prototype chrome bar ABOVE the cities pages, covering
 * both the index (/ux-concepts/cities) and the per-city pages
 * (/ux-concepts/cities/[slug]) in one place — the same seam the roadmap uses.
 *
 * These pages render BC's own site chrome (BcHeader/BcFooter) per-page as their
 * CONTENT (the in-context recreation IS the build), so this layout deliberately does
 * NOT render BcHeader/BcFooter — it only prepends the PrototypeHeader. The bar owns
 * the back-to-hub affordance; BcChrome's own honest "mock" marker stays in the pages.
 *
 * The "Updated [date]" stamp resolves from the route via build-date.ts: both the
 * index and [slug] match the "/ux-concepts/cities" prefix, so they share the build's
 * date (dynamic [slug] pages inherit their parent build's date by design).
 *
 * Key exports: CitiesLayout (default)
 * External dependencies: PrototypeHeader, the single-source concept registry (CONCEPTS).
 */

import { PrototypeHeader } from "../../_components/PrototypeHeader";
import { CONCEPTS } from "../../_data/concept-registry";

export default function CitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Standard prototype chrome ABOVE the BC-site recreation. Content (incl. each
          page's own BcHeader/BcFooter) renders below. Title from the concept registry so the
          bar matches the hub label (no "vN — concept"). */}
      <PrototypeHeader buildName={CONCEPTS.residentConcerns.title} />
      {children}
    </>
  );
}
