/**
 * aqi-palette.ts — shared functional-colour helpers for the concept composition layer.
 *
 * Purpose
 *   The single source for two kinds of FUNCTIONAL colour that recur across concept prototypes:
 *
 *     1. AQI severity → BC semantic token. Maps an air-quality severity level (or a raw numeric
 *        value) to the matching `var(--bc-semantic-aqi-*)` token for indicator / background /
 *        text use, plus a human label. These are FUNCTIONAL colours (they encode air-quality
 *        severity, not brand) and must stay consistent wherever AQI is shown. Copied — by value,
 *        not by import — from the proven mapping in jtbd-city-toolkit/_components/ToolPanels.tsx
 *        so the concept layer owns its own copy and no concept depends on another's internals.
 *        Self-contained AqiLevel type (no external data import) so this file stands alone, and
 *        adds aqiTextVar (the *-text tokens) which the toolkit version did not expose.
 *
 *     2. Sensor-tier MAP colours (the Mapbox hex exception). Mapbox GL paint expressions cannot
 *        read CSS custom properties (the basemap canvas is WebGL, not the DOM), so data-driven
 *        marker colours MUST be literal hex. These named consts are the ONE sanctioned place for
 *        those literals in the concept layer; their values mirror the BC tokens (brand ink for
 *        reference-grade, muted slate for low-cost) and are documented here so the no-hardcoded-
 *        hex rule has a single, intentional exception rather than scattered inline literals.
 *
 * Key exports:
 *   - AqiLevel (type)
 *   - aqiIndicatorVar / aqiBgVar / aqiTextVar / aqiLabel / aqiLevelFromValue (AQI helpers)
 *   - SENSOR_TIER_REFERENCE_HEX / SENSOR_TIER_LOWCOST_HEX / SENSOR_TIER_STROKE_HEX /
 *     SENSOR_TIER_FALLBACK_HEX (Mapbox-only hex literals)
 * External dependencies: none.
 */

/**
 * AQI severity levels, ordered good → extreme. Self-contained (not imported) so the concept
 * layer's palette stands alone and no concept's data module is a dependency of this file.
 */
export type AqiLevel =
  | 'good'
  | 'moderate'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous'
  | 'extreme'

/** Maps an AQI severity level to the BC semantic INDICATOR token (dot / chip fill). */
export function aqiIndicatorVar(level: AqiLevel): string {
  const map: Record<AqiLevel, string> = {
    good: 'var(--bc-semantic-aqi-good-indicator)',
    moderate: 'var(--bc-semantic-aqi-moderate-indicator)',
    unhealthy: 'var(--bc-semantic-aqi-unhealthy-indicator)',
    'very-unhealthy': 'var(--bc-semantic-aqi-very-unhealthy-indicator)',
    hazardous: 'var(--bc-semantic-aqi-hazardous-indicator)',
    extreme: 'var(--bc-semantic-aqi-extreme-indicator)',
  }
  return map[level]
}

/** Maps an AQI severity level to the BC semantic BACKGROUND token (tinted surface). */
export function aqiBgVar(level: AqiLevel): string {
  const map: Record<AqiLevel, string> = {
    good: 'var(--bc-semantic-aqi-good-bg)',
    moderate: 'var(--bc-semantic-aqi-moderate-bg)',
    unhealthy: 'var(--bc-semantic-aqi-unhealthy-bg)',
    'very-unhealthy': 'var(--bc-semantic-aqi-very-unhealthy-bg)',
    hazardous: 'var(--bc-semantic-aqi-hazardous-bg)',
    extreme: 'var(--bc-semantic-aqi-extreme-bg)',
  }
  return map[level]
}

/** Maps an AQI severity level to the BC semantic TEXT token (legible on the matching bg). */
export function aqiTextVar(level: AqiLevel): string {
  const map: Record<AqiLevel, string> = {
    good: 'var(--bc-semantic-aqi-good-text)',
    moderate: 'var(--bc-semantic-aqi-moderate-text)',
    unhealthy: 'var(--bc-semantic-aqi-unhealthy-text)',
    'very-unhealthy': 'var(--bc-semantic-aqi-very-unhealthy-text)',
    hazardous: 'var(--bc-semantic-aqi-hazardous-text)',
    extreme: 'var(--bc-semantic-aqi-extreme-text)',
  }
  return map[level]
}

/** Maps an AQI severity level to its human-readable label. */
export function aqiLabel(level: AqiLevel): string {
  const map: Record<AqiLevel, string> = {
    good: 'Good',
    moderate: 'Moderate',
    unhealthy: 'Unhealthy',
    'very-unhealthy': 'Very unhealthy',
    hazardous: 'Hazardous',
    extreme: 'Extreme',
  }
  return map[level]
}

/**
 * Bucket a raw numeric AQI/PM value into a severity level. Thresholds mirror the toolkit's
 * proven banding so any concept reading this helper bands values the same way.
 */
export function aqiLevelFromValue(value: number): AqiLevel {
  if (value <= 25) return 'good'
  if (value <= 50) return 'moderate'
  if (value <= 75) return 'unhealthy'
  if (value <= 100) return 'very-unhealthy'
  if (value <= 150) return 'hazardous'
  return 'extreme'
}

/* ───────────────────────────────────────────────────────────────────────────
   Sensor-tier MAP colours — the documented Mapbox hex exception.
   Mapbox GL paint expressions cannot read CSS custom properties, so these
   data-driven marker colours are literal hex. Values mirror the BC tokens.
   This is the ONLY sanctioned place for these literals in the concept layer.
   ─────────────────────────────────────────────────────────────────────────── */

/** Reference-grade monitors — brand dark-blue ink (mirrors --bc-color-dark-blue). */
export const SENSOR_TIER_REFERENCE_HEX = '#003574'
/** Low-cost / community sensors — muted slate. */
export const SENSOR_TIER_LOWCOST_HEX = '#5b6b7a'
/** White contrast ring around markers so they stay legible over a light basemap. */
export const SENSOR_TIER_STROKE_HEX = '#ffffff'
/** Defensive fallback for any feature whose tier doesn't match (neutral grey). */
export const SENSOR_TIER_FALLBACK_HEX = '#9ca3af'
