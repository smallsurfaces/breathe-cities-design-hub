/**
 * example-tools.config.ts — concept-local data for the three illustrative example tools shown as
 * "Coming soon" catalogue cards inside the Components grid of the Global Toolkit Network concept.
 *
 * Purpose
 *   These are founder-named ILLUSTRATIVE concepts — tools NOT yet in use. They are the reference
 *   examples Santiago presented in the Data Visualisation briefing Annex ("brain teasers … reference
 *   examples only … do not represent final products"). After the v2 founder review they no longer live
 *   in a standalone section: each tool is now a "Coming soon" card appended to the Components catalogue
 *   grid (page.tsx Section 2), sitting uniformly alongside the real COMPONENT_ENTRIES cards.
 *
 * What each entry carries (v2)
 *   A name + locked description + ONE representative full-colour preview image (the positive state),
 *   embedded from `public/ux-concepts/global-toolkit-network/example-tools/`. The card renders a muted
 *   "Coming soon" badge (matching the ProofCatalogueCard coming-soon treatment) — there is NO
 *   prevalence counter, NO stat line, and NO link/CTA. The other three state PNGs remain in the repo
 *   (unused for now; a future detail page may use them).
 *
 * Honesty (this concept's backbone)
 *   The "Coming soon" badge is the only status marker; these tools are not in use. The image stays
 *   full-colour (it is the showcase) — it does NOT take the grayscale/opacity de-emphasis the sketch
 *   coming-soon cards use. The placeholder content inside the image is illustrative mock content.
 *
 * Copy is LOCKED (ux-writer pass 2026-06-29) — British English, founder-locked names. Verbatim from
 * the build spec; do not alter.
 *
 * Key exports: EXAMPLE_TOOLS (readonly ExampleTool[]), ExampleTool (type).
 * External dependencies: none (plain config consumed by ComingSoonToolCard).
 */

/** One illustrative example tool: name, locked description, and its single full-colour preview image. */
export type ExampleTool = {
  /** Stable id, used as the React key. */
  id: string
  /** Founder-locked tool name, rendered as an h3. */
  name: string
  /** The locked description copy, rendered muted beneath the name. */
  description: string
  /** Status — always 'coming-soon' for these illustrative tools; drives the muted badge. */
  status: 'coming-soon'
  /** Public path to the single representative (positive-state) preview screenshot under /public. */
  image: string
  /** Descriptive alt text for accessibility — describes what the preview screenshot shows. */
  imageAlt: string
}

/**
 * The three illustrative example tools, in presentation order (AQ Patterns → Air Window →
 * City Futures). Copy is locked and verbatim; the image path points at the concept-local public
 * folder and uses the positive-state PNG as the single representative thumbnail.
 */
export const EXAMPLE_TOOLS: readonly ExampleTool[] = [
  {
    id: 'aq-patterns',
    name: 'AQ Patterns',
    description:
      'A pattern view of air quality over time. See which days, weeks, and months tend to be clean or poor, filtered by pollutant or by the groups most affected. It turns the data a city already collects into trends people can read at a glance.',
    status: 'coming-soon',
    image: '/ux-concepts/global-toolkit-network/example-tools/aq-patterns-good.png',
    imageAlt: 'AQ Patterns calendar view showing a month of mostly clean air-quality days.',
  },
  {
    id: 'air-window',
    name: 'Air Window',
    description:
      'A neighbourhood view of air quality through the day, so residents can time outdoor activity for the cleanest hours. Built for the people who run, cycle, walk the school run, or play sport outside.',
    status: 'coming-soon',
    image: '/ux-concepts/global-toolkit-network/example-tools/air-window-good.png',
    imageAlt: 'Air Window neighbourhood view showing good air quality across the day.',
  },
  {
    id: 'city-futures',
    name: 'City Futures',
    description:
      "An interactive city model that turns air quality into cause and effect. Change a city's transport and infrastructure choices and watch the air respond from 2026 to 2030. It doubles as a learning tool, helping students, residents, and decision-makers see how today's choices shape tomorrow's air.",
    status: 'coming-soon',
    image: '/ux-concepts/global-toolkit-network/example-tools/city-futures-2030.png',
    imageAlt: 'City Futures interactive model showing the simulated city in 2030 after infrastructure changes.',
  },
]
