/**
 * index.ts — barrel export for the concept composition layer.
 *
 * Purpose
 *   A single import surface for the shared concept primitives so concept pages import from
 *   `@/components/concept` rather than reaching into individual files. Re-exports the chrome
 *   (config + components), the layout/typography primitives, and the functional-colour palette.
 *
 * Key exports: see the re-exports below.
 * External dependencies: the sibling modules in this folder.
 */

export type { BcChromeNavItem, BcChromeConfig } from './bc-chrome.config'
export { AQ_NETWORK_CHROME } from './bc-chrome.config'

export { BcHeader, BcFooter } from './BcChrome'

export { ConceptHero } from './ConceptHero'
export { ConceptSectionHeader } from './ConceptSectionHeader'
export { ConceptCard } from './ConceptCard'
export { ConceptStat } from './ConceptStat'
export { InfoTooltip } from './InfoTooltip'

export type { AqiLevel } from './aqi-palette'
export {
  aqiIndicatorVar,
  aqiBgVar,
  aqiTextVar,
  aqiLabel,
  aqiLevelFromValue,
  SENSOR_TIER_REFERENCE_HEX,
  SENSOR_TIER_LOWCOST_HEX,
  SENSOR_TIER_STROKE_HEX,
  SENSOR_TIER_FALLBACK_HEX,
} from './aqi-palette'
