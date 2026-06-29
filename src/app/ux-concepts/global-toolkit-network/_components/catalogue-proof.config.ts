/**
 * catalogue-proof.config.ts — concept-local mapping that powers the "Used by N BC cities" proof
 * line on the catalogue cards (proof-directory v2, §5 second pass).
 *
 * Purpose
 *   The catalogue entries are capability-voice ("Real-time Monitoring", id `monitoring`) while the
 *   proof-cities tool rows are product/city-voice ("LondonAir (LAQN)", "ARPA Lombardia"). To thread
 *   an honest "Used by N BC cities" adoption count onto each card we map each catalogue capability id
 *   (the
 *   ToolId from the shared toolkit config) to the KEYWORDS that signal that capability's presence in
 *   a city's tool list, then count distinct cities via getToolUsageCounts (proof-cities.ts).
 *
 *   This is a concept-prototype approximation of "adoption breadth", NOT a production data contract
 *   (concept-prototype fidelity). It deliberately lives concept-local so the shared `toolkit`
 *   catalogue config is never mutated (isolation constraint, spec §5).
 *
 * Honesty note
 *   The count is "how many plotted BC cities run a tool of this kind" — an adoption-breadth figure
 *   (number-homes rule: cards carry breadth, never human scale / population). It draws on the same
 *   proof-cities data the globe uses, so the card claim and the globe stay consistent.
 *
 * Key exports: CATALOGUE_PROOF_KEYWORDS (Record<ToolId-string, readonly string[]>)
 * External dependencies: none (plain config consumed by getToolUsageCounts).
 */

/**
 * Keyword sets per catalogue capability id. A city "uses" the capability if any of its tool
 * name/blurb strings contains one of these keywords (case-insensitive substring). Keywords are
 * tuned to the v3 real-tool vocabulary (product names + research-grounded blurbs) in proof-cities.ts,
 * chosen as an honest adoption-breadth approximation — broad enough that every capability matches
 * somewhere, narrow enough that none over-matches into a meaningless "all 16".
 */
export const CATALOGUE_PROOF_KEYWORDS: Record<string, readonly string[]> = {
  // Components
  monitoring: [
    'monitoring network',
    'reference network',
    'sensor network',
    'sensor app',
    'dashboard',
    'londonair',
    'arpa',
    'airbkk',
    'gioś',
    'rmcab',
    'monitorar',
    'simat',
    'airparif',
    'airqo',
    'saaqis',
    'afriqair',
    'real-time aqi',
  ],
  openData: ['open data', 'open-data', 'uk-air', 'data.rio', ' api', 'machine-readable', 'downloadable'],
  forecasting: ['forecast'],
  health: ['health-risk', 'health advice', 'airtext', 'action guidance', 'pre-activity', 'mask'],
  benchmarking: ['eea', 'european', 'peer comparison', ' index', 'benchmarked'],
  // Guidance
  sourceId: ['source apportionment', 'emissions inventory', 'source-apportionment'],
  advocacy: ['advocacy', 'citizen', 'curieuzenair', "cittadini"],
  action: ['low emission zone', 'boiler', 'clean air zone', 'heating-system replacement'],
}
