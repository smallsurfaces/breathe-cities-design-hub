/**
 * concept-routes.config.ts — concept-local route overrides for the Global Toolkit Network catalogue.
 *
 * Purpose
 *   The catalogue entries are imported read-only from the LOCKED toolkit concept, where
 *   `entry.href` for the one available capability ('monitoring') points at the toolkit's OWN detail
 *   route (/ux-concepts/toolkit/real-time-monitoring). This concept has its OWN copy of that detail
 *   page (global-toolkit-network/real-time-monitoring), so the catalogue card must link there instead
 *   — WITHOUT mutating the locked toolkit catalogue config (isolation constraint).
 *
 *   This map provides a concept-local override per catalogue entry id. ProofCatalogueCard consults it
 *   first; any id not present falls back to the entry's own `href`. Only 'monitoring' is overridden
 *   today (it is the only available, link-through capability); the rest are coming-soon (unlinked).
 *
 * Key exports: CONCEPT_ROUTE_OVERRIDES (Record<string, string>)
 * External dependencies: none (plain config consumed by ProofCatalogueCard).
 */

/**
 * Per-catalogue-id route override. Keyed by the toolkit CatalogueEntry id; value is the concept-local
 * route to link to instead of the entry's own `href`. Ids absent here fall back to `entry.href`.
 */
export const CONCEPT_ROUTE_OVERRIDES: Record<string, string> = {
  monitoring: '/ux-concepts/global-toolkit-network/real-time-monitoring',
}
