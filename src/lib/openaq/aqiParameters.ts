/**
 * aqiParameters.ts — Parameter-aware EPA AQI breakpoints + BC token mapping
 *
 * Purpose:
 *   The SINGLE source of per-parameter AQI banding for the live-data route. The legend
 *   (pattern 2), the marker hue (pattern 2 / markers.ts), and the probe result colour
 *   (pattern 3) all read from this module — there is no second breakpoint table anywhere.
 *   This is the generalisation of direction-1-mapbox-v2/aqi.ts, which was PM2.5-only with
 *   hardcoded hex; that file is intentionally NOT reused (see brief "Out of scope" + the
 *   data-core note that the legacy aqi.ts is what made the v2 prototype PM2.5-only).
 *
 * Key exports:
 *   - AqiTierKey, AqiTier, AQI_TIERS (the six EPA tiers, in order, with token names + labels)
 *   - ParameterKey, PARAMETER_META (display name + unit + availability per parameter)
 *   - getAqiBands(parameter): the parameter's banded ranges for the legend
 *   - classifyAqi(value, parameter): value -> AqiTier (the one place a value becomes a tier)
 *   - resolveTierColors(tier, kind): runtime getComputedStyle read of the BC AQI token
 *   - PARAMETERS_LIVE / PARAMETERS_ALL (selector ordering; NO2 present-but-disabled)
 *
 * External dependencies: none (pure module; the only runtime side effect is the
 *   getComputedStyle read in resolveTierColors, which is browser-only and guarded).
 *
 * Token discipline (brief "Token discipline"):
 *   Colours are NOT inlined as hex here. Each tier names its BC tokens
 *   (--bc-semantic-aqi-{tier}-{indicator|bg|text}); resolveTierColors() reads the live
 *   computed value at runtime so markers (detached SVG) and React UI stay token-driven.
 *   If the cascade is ever unavailable (SSR / detached node before mount), the resolver
 *   returns the empty string and callers fall back to the muted token — never an arbitrary hex.
 *
 * NO2 (brief open question 1): NO2's EPA AQI is defined on a 1-hour ppb basis while PM2.5/PM10
 *   are 24-hour µg/m³, and OpenAQ may return NO2 in µg/m³. That standard/units decision is
 *   unresolved (owner: Jack), so NO2 ships present-but-disabled: it appears in the selector
 *   for completeness but carries `available: false` and NO breakpoint table. No code path
 *   classifies an NO2 value (classifyAqi throws for an unavailable parameter — see below).
 */

// ----------------------------------------------------------------------------
// AQI tiers (6-tier BC token system)
// ----------------------------------------------------------------------------

/** Stable key for one of the six AQI severity tiers. Used to index tokens + labels. */
export type AqiTierKey =
  | 'good'
  | 'moderate'
  | 'unhealthy'
  | 'veryUnhealthy'
  | 'hazardous'
  | 'extreme'

/**
 * One AQI severity tier. `tokenSlug` is the hyphenated fragment used to build the BC
 * token name (e.g. 'very-unhealthy' -> --bc-semantic-aqi-very-unhealthy-indicator). The
 * human label is the same across parameters; only the numeric ranges differ per parameter.
 */
export type AqiTier = {
  key: AqiTierKey
  /** Hyphenated token fragment, matches the --bc-semantic-aqi-<slug>-* token names. */
  tokenSlug: string
  /** Human-readable severity label shown in the legend and popups. */
  label: string
}

/**
 * The six EPA AQI tiers in ascending severity. Order is load-bearing: the legend renders
 * them top-to-bottom in this order, and classifyAqi walks the parameter breakpoints in the
 * same order. The token slugs map 1:1 to the --bc-semantic-aqi-* tokens in tokens.css.
 */
export const AQI_TIERS: readonly AqiTier[] = [
  { key: 'good', tokenSlug: 'good', label: 'Good' },
  { key: 'moderate', tokenSlug: 'moderate', label: 'Moderate' },
  { key: 'unhealthy', tokenSlug: 'unhealthy', label: 'Unhealthy for Sensitive Groups' },
  { key: 'veryUnhealthy', tokenSlug: 'very-unhealthy', label: 'Unhealthy' },
  { key: 'hazardous', tokenSlug: 'hazardous', label: 'Very Unhealthy' },
  { key: 'extreme', tokenSlug: 'extreme', label: 'Hazardous' },
] as const

/** Look up a tier definition by key. Throws on an unknown key (programmer error, not data). */
function tierByKey(key: AqiTierKey): AqiTier {
  const tier = AQI_TIERS.find((candidate) => candidate.key === key)
  if (tier === undefined) {
    throw new Error(`Unknown AQI tier key: ${key}`)
  }
  return tier
}

// ----------------------------------------------------------------------------
// Parameters
// ----------------------------------------------------------------------------

/**
 * The parameters this route exposes. Keyed on the OpenAQ parameter name (the same string
 * the data-core /api/stations endpoint accepts) so a key passes straight through to fetch.
 */
export type ParameterKey = 'pm25' | 'pm10' | 'no2'

/**
 * Per-parameter metadata used by the selector, legend, and copy.
 * - `available: false` means present-but-disabled (NO2): shown in the selector, never fetched,
 *   never classified. `unit` is null when unavailable (no agreed unit yet — see file header).
 * - `disabledReason` populates the "coming soon" affordance on a disabled selector entry.
 */
export type ParameterMeta = {
  key: ParameterKey
  /** Short selector label, e.g. "PM2.5". */
  label: string
  /** Legend title, e.g. "PM2.5 Air Quality Index". */
  legendTitle: string
  /** Display unit string, or null when the parameter is unavailable. */
  unit: string | null
  /** Whether this parameter is wired for live data. NO2 is false (open question 1). */
  available: boolean
  /** Shown on a disabled selector entry to explain why; empty for available parameters. */
  disabledReason: string
}

/**
 * One band of a parameter's AQI scale: the tier it belongs to and the inclusive upper edge of
 * the concentration range. `upper: null` marks the open-ended top tier (everything above the
 * previous edge). Ranges are derived from these edges for display so the legend and the
 * classifier can never disagree.
 */
export type AqiBandDef = {
  tierKey: AqiTierKey
  /** Inclusive upper bound of this band in the parameter's unit; null = open-ended top tier. */
  upper: number | null
}

/**
 * EPA breakpoint edges per parameter, ascending. Only the available parameters have a table;
 * NO2 has none until its standard/units are decided (open question 1).
 *
 * PM2.5 — US EPA 24-hour breakpoints (µg/m³): 12.0 / 35.4 / 55.4 / 150.4 / 250.4. These match
 *   the edges the validated spike used and the brief's stated PM2.5 numbers. Six tiers; the
 *   top tier is open-ended above 250.4.
 * PM10 — US EPA 24-hour breakpoints (µg/m³): 54 / 154 / 254 / 354 / 424. Six tiers; the top
 *   tier is open-ended above 424. (EPA's PM10 table continues to 504/604; collapsed into the
 *   open-ended top tier here to keep one consistent 6-tier scale across parameters.)
 */
const PARAMETER_BANDS: Record<ParameterKey, readonly AqiBandDef[] | null> = {
  pm25: [
    { tierKey: 'good', upper: 12.0 },
    { tierKey: 'moderate', upper: 35.4 },
    { tierKey: 'unhealthy', upper: 55.4 },
    { tierKey: 'veryUnhealthy', upper: 150.4 },
    { tierKey: 'hazardous', upper: 250.4 },
    { tierKey: 'extreme', upper: null },
  ],
  pm10: [
    { tierKey: 'good', upper: 54 },
    { tierKey: 'moderate', upper: 154 },
    { tierKey: 'unhealthy', upper: 254 },
    { tierKey: 'veryUnhealthy', upper: 354 },
    { tierKey: 'hazardous', upper: 424 },
    { tierKey: 'extreme', upper: null },
  ],
  // NO2: no agreed AQI standard/units yet (open question 1). Present-but-disabled.
  no2: null,
}

/** Display + availability metadata for every parameter. */
export const PARAMETER_META: Record<ParameterKey, ParameterMeta> = {
  pm25: {
    key: 'pm25',
    label: 'PM2.5',
    legendTitle: 'PM2.5 Air Quality Index',
    unit: 'µg/m³',
    available: true,
    disabledReason: '',
  },
  pm10: {
    key: 'pm10',
    label: 'PM10',
    legendTitle: 'PM10 Air Quality Index',
    unit: 'µg/m³',
    available: true,
    disabledReason: '',
  },
  no2: {
    key: 'no2',
    label: 'NO2',
    legendTitle: 'NO2 Air Quality Index',
    unit: null,
    available: false,
    // Brief open question 1: NO2 AQI standard/averaging-window/units undecided.
    disabledReason: 'Coming soon',
  },
}

/** Selector ordering — all three parameters, in display order (NO2 last, disabled). */
export const PARAMETERS_ALL: readonly ParameterKey[] = ['pm25', 'pm10', 'no2'] as const

/** The parameters that are actually wired for live data (excludes NO2). */
export const PARAMETERS_LIVE: readonly ParameterKey[] = PARAMETERS_ALL.filter(
  (key) => PARAMETER_META[key].available,
)

/** Type guard: is this parameter available (has a breakpoint table and a unit)? */
export function isParameterAvailable(parameter: ParameterKey): boolean {
  return PARAMETER_META[parameter].available
}

// ----------------------------------------------------------------------------
// Legend bands + classification
// ----------------------------------------------------------------------------

/** A legend-ready band: tier metadata plus a formatted range string in the parameter's unit. */
export type AqiLegendBand = {
  tier: AqiTier
  /** Formatted numeric range, e.g. "12.1–35.4" or "250.5+". Unit is rendered separately. */
  range: string
}

/**
 * Format a single band's range string from its lower edge (exclusive of the previous band)
 * and its own inclusive upper edge. The lower edge shown is `previousUpper + step` where step
 * matches the decimal precision of the table, so bands read continuously (…12.0 / 12.1…). The
 * open-ended top band renders as "{lower}+".
 */
function formatRange(lowerDisplay: number, upper: number | null, decimals: number): string {
  const lower = lowerDisplay.toFixed(decimals)
  if (upper === null) {
    return `${lower}+`
  }
  return `${lower}–${upper.toFixed(decimals)}`
}

/**
 * Display decimal precision for a parameter's concentration values — the SINGLE source of the
 * per-parameter precision signal. Inferred from the breakpoint edges: a parameter whose EPA edges
 * carry a fractional part (PM2.5, e.g. 35.4) is shown to 1 dp; one whose edges are whole numbers
 * (PM10, e.g. 154) is shown to 0 dp. Both the legend ranges (getAqiBands) and any rendered reading
 * (formatReading) read precision from here, so they can never disagree.
 *
 * Returns 0 for an unavailable parameter (NO2 has no table) — it is never classified or rendered,
 * so the value is moot, but 0 is the safe default rather than throwing on a precision lookup.
 */
function displayDecimals(parameter: ParameterKey): number {
  const bands = PARAMETER_BANDS[parameter]
  if (bands === null) {
    return 0
  }
  const hasFractionalEdge = bands.some(
    (band) => band.upper !== null && !Number.isInteger(band.upper),
  )
  return hasFractionalEdge ? 1 : 0
}

/**
 * Format a raw concentration reading for DISPLAY at the active parameter's precision (PM2.5 -> 1 dp,
 * PM10 -> 0 dp; see displayDecimals). This is the one place a raw upstream float (e.g.
 * 46.17916615804037) becomes a human-facing string — applied at the render sites only (station
 * popup value, probe per-sensor list, marker hover title). The DATA LAYER keeps the full-precision
 * value untouched; rounding is presentation, never mutation, so classification/triangulation always
 * operate on the raw number.
 *
 * Non-finite input returns an em dash rather than "NaN"/"Infinity" — a defensive last line; the
 * data-core already drops non-finite readings, so this only guards programmer error.
 */
export function formatReading(value: number, parameter: ParameterKey): string {
  if (!Number.isFinite(value)) {
    return '—'
  }
  return value.toFixed(displayDecimals(parameter))
}

/**
 * Build the parameter's legend bands (tier + formatted range). Returns an empty array for an
 * unavailable parameter (NO2) — the caller decides how to present "scale not available yet".
 *
 * The displayed lower edge of each band is derived from the previous band's upper edge plus a
 * one-step increment matching the table's decimal precision (0.1 for PM2.5, 1 for PM10), so the
 * legend ranges are contiguous and never overlap. Precision comes from displayDecimals — the same
 * per-parameter signal formatReading uses — so legend ranges and rendered readings always agree.
 */
export function getAqiBands(parameter: ParameterKey): AqiLegendBand[] {
  const bands = PARAMETER_BANDS[parameter]
  if (bands === null) {
    return []
  }
  // Display precision + the contiguity step both follow the shared per-parameter signal.
  const decimals = displayDecimals(parameter)
  const step = decimals === 1 ? 0.1 : 1

  const result: AqiLegendBand[] = []
  let previousUpper = 0
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index]
    // First band starts at 0; subsequent bands start one step above the previous upper edge.
    const lowerDisplay = index === 0 ? 0 : Math.round((previousUpper + step) * 10) / 10
    result.push({
      tier: tierByKey(band.tierKey),
      range: formatRange(lowerDisplay, band.upper, decimals),
    })
    if (band.upper !== null) {
      previousUpper = band.upper
    }
  }
  return result
}

/**
 * Classify a concentration value into its AQI tier for the given parameter — the ONLY place a
 * raw value becomes a tier. Walks the parameter's bands in ascending order and returns the
 * first band whose upper edge the value does not exceed; the open-ended top band catches the
 * rest. This is the function the markers and the probe result both call so colour and label
 * are always consistent with the legend.
 *
 * Guards:
 *   - Throws for an unavailable parameter (NO2): there is no agreed scale, so classifying an
 *     NO2 value would be a fabricated result. Callers must not classify a parameter they have
 *     not confirmed is available (the route never fetches NO2, so this is a safety net).
 *   - Throws for a non-finite value: NaN/Infinity must never silently land in a tier. The
 *     data-core already drops non-finite readings, so this only catches programmer error.
 */
export function classifyAqi(value: number, parameter: ParameterKey): AqiTier {
  const bands = PARAMETER_BANDS[parameter]
  if (bands === null) {
    throw new Error(`Cannot classify AQI for unavailable parameter: ${parameter}`)
  }
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot classify a non-finite AQI value: ${value}`)
  }
  for (const band of bands) {
    if (band.upper === null || value <= band.upper) {
      return tierByKey(band.tierKey)
    }
  }
  // Unreachable: the last band always has upper === null. Kept for exhaustiveness/typing.
  return tierByKey('extreme')
}

// ----------------------------------------------------------------------------
// Runtime token resolution (token-driven colour, no inlined hex)
// ----------------------------------------------------------------------------

/** Which colour role of a tier to resolve. */
export type TierColorKind = 'indicator' | 'bg' | 'text'

/**
 * Cache of resolved token values, keyed by the full token name. getComputedStyle is cheap but
 * not free, and markers can be built dozens at a time on every render/refetch; resolving each
 * unique token once per session is plenty (the tokens do not change at runtime). Cleared never
 * — token values are static for the life of the page.
 */
const tokenValueCache = new Map<string, string>()

/** Build the BC token name for a tier + colour role. */
function tierTokenName(tier: AqiTier, kind: TierColorKind): string {
  return `--bc-semantic-aqi-${tier.tokenSlug}-${kind}`
}

/**
 * Resolve a tier's BC colour token to its live computed value (a hex string) by reading the
 * cascade off :root. This is what keeps markers and popups token-driven without inlining hex:
 * the source of truth stays tokens.css; we read whatever it currently resolves to.
 *
 * Side effect: reads document.documentElement's computed style (browser only) and memoises the
 * result. Returns '' when unavailable — i.e. during SSR (no document) or before the stylesheet
 * has applied. Callers treat '' as "fall back to the muted token / a neutral", never as a colour;
 * this upholds the brief's "never reintroduce arbitrary hardcoded hex" rule.
 */
export function resolveTierColor(tier: AqiTier, kind: TierColorKind): string {
  const tokenName = tierTokenName(tier, kind)
  const cached = tokenValueCache.get(tokenName)
  if (cached !== undefined) {
    return cached
  }
  // SSR / non-browser guard: no document means no cascade to read.
  if (typeof document === 'undefined') {
    return ''
  }
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim()
  // Only cache a real value; an empty read (stylesheet not applied yet) should be retried later.
  if (resolved.length > 0) {
    tokenValueCache.set(tokenName, resolved)
  }
  return resolved
}

/**
 * Resolve the muted/steel token (--bc-semantic-muted) — the "present but dead" colour for stale
 * markers and the universal fallback when a tier colour cannot be read. Same caching + SSR
 * guard as resolveTierColor. Returns '' only in SSR / pre-apply; callers handle that.
 */
export function resolveMutedColor(): string {
  const tokenName = '--bc-semantic-muted'
  const cached = tokenValueCache.get(tokenName)
  if (cached !== undefined) {
    return cached
  }
  if (typeof document === 'undefined') {
    return ''
  }
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim()
  if (resolved.length > 0) {
    tokenValueCache.set(tokenName, resolved)
  }
  return resolved
}
