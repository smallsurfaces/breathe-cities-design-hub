/**
 * markers.ts — Live-data station marker construction (three-channel encoding), light basemap.
 *
 * Provenance: part of the BC Global Toolkit Network concept (/ux-concepts/global-toolkit-network/real-time-monitoring).
 *   Concept-local copy of toolkit/real-time-monitoring/_components/markers.ts: copied, original (a locked concept) untouched.
 *
 * Purpose:
 *   Builds the detached DOM/SVG element for a single Station marker on the real-time monitoring
 *   map. Component copy of direction-2-live-data/markers.ts carrying the LIGHT-BASEMAP re-tune
 *   (Option A) from feature/direction-2-light-basemap verbatim — this route renders on
 *   mapbox/light-v11, so the marker colour polarity is the light-ground treatment, not the dark.
 *
 *   Three channels (design-owned — NOT redesigned here):
 *     - Hue   = AQI value     (active parameter -> EPA tier -> BC AQI indicator token)
 *     - Shape = quality        (high -> triangle, low -> circle)
 *     - Fill  = freshness       (fresh -> SOLID full hue + dark-blue ink outline + drop shadow +
 *                                inverted halo; stale -> HOLLOW neutral-grey outline only, no fill,
 *                                no shadow, AQI hue fully drained)
 *   Fresh markers are sized a hair larger so the few live readings win attention against the many
 *   stale ghosts (the dominant London case).
 *
 *   LIGHT-BASEMAP re-tune (Option A) — the polarity flip of the dark treatment, for the light
 *   ground. The three-signal model above is UNCHANGED; only the colour polarity changed:
 *     - FRESH border: dark-blue INK hairline (#003574 = --bc-color-dark-blue) replaces the white
 *       border (white vanishes on light). This ink edge carries the mild tiers whose pale fills
 *       stop doing the work on a light basemap.
 *     - HALO inverted: a near-white under-stroke + an ink over-stroke, so fresh markers separate
 *       from the light ground.
 *     - STALE recedes by DARKENING: a neutral dark-grey (#5a6675) hollow outline.
 *     - Drop shadow tinted toward the ink (rgba(0,53,116,0.35)) rather than black.
 *
 * Key exports: createStationMarkerElement
 *
 * External dependencies:
 *   - ../../../../lib/openaq/types (Station type only — read-only, never modified)
 *   - ../../../direction-2-live-data/aqiParameters (classifyAqi + runtime token resolution; the
 *     single AQI source, imported read-only)
 *
 * Token discipline (brief): the AQI fill hue is NOT inlined — it is read at runtime from the BC
 *   indicator token via aqiParameters.resolveTierColor. The ink outline, the light halo
 *   under-stroke, and the stale neutral-grey are structural marker chrome (not AQI semantics),
 *   kept as documented literals. The ink equals the BC token --bc-color-dark-blue (#003574). The
 *   stale neutral (#5a6675) is NOT yet a token — a spike-only neutral, flagged to
 *   design-system-keeper for possible tokenisation. If the AQI token cannot be resolved
 *   (SSR/pre-apply), the helper returns '' and the fresh fill falls back to the muted token / a
 *   neutral grey — never an arbitrary AQI hex.
 */

import type { Station } from '@/lib/openaq/types'
import {
  classifyAqi,
  formatReading,
  resolveMutedColor,
  resolveTierColor,
  type ParameterKey,
} from '@/lib/openaq/aqiParameters'

/**
 * Dark-blue ink hairline for fresh/solid markers (replaces the dark spike's white border, which is
 * invisible on a light ground). Structural marker chrome, not AQI semantics. Equals the BC token
 * --bc-color-dark-blue (#003574). Load-bearing: gives the mild tiers a crisp edge on light.
 */
const INK = '#003574'

/**
 * Near-white halo under-stroke for fresh markers (the inverted, light-ground halo). Drawn first and
 * fatter so a sliver of light separates the ink over-stroke from a dark/busy patch of the basemap.
 * Structural chrome, not AQI.
 */
const HALO_LIGHT = 'rgba(255,255,255,0.9)'

/**
 * Option-A stale outline — a neutral dark-grey, deliberately darker than the live steel (#b2c2d5)
 * so stale markers recede by DARKENING on a light ground rather than washing out. NOT a token:
 * spike-only neutral. Flagged to design-system-keeper for possible tokenisation. Structural chrome.
 */
const STALE_NEUTRAL = '#5a6675'

/** Last-resort neutral if even the muted token cannot be resolved (SSR/pre-apply only). */
const NEUTRAL_FALLBACK = 'rgba(178,194,213,0.9)'

/**
 * Resolve the marker fill hue for a fresh reading: the active parameter's AQI tier colour,
 * read live from the BC indicator token. Falls back to the muted token if the tier colour
 * cannot be read (never an inlined AQI hex).
 */
function freshHueFor(value: number, parameter: ParameterKey): string {
  const tier = classifyAqi(value, parameter)
  const hue = resolveTierColor(tier, 'indicator')
  if (hue.length > 0) {
    return hue
  }
  const muted = resolveMutedColor()
  return muted.length > 0 ? muted : NEUTRAL_FALLBACK
}

/**
 * Stale marker outline colour (Option A): the neutral dark-grey that recedes by darkening on the
 * light basemap. A function (rather than using STALE_NEUTRAL inline) so the single stale-stroke
 * source is named at the call site and easy to retarget if STALE_NEUTRAL is later tokenised.
 */
function staleStroke(): string {
  return STALE_NEUTRAL
}

/**
 * Triangle SVG (reference grade), light re-tune. `fresh` switches between a solid AQI-filled triangle
 * with a dark-blue ink outline + inverted halo (light under-stroke drawn first + ink over-stroke),
 * and a hollow neutral-grey-outlined triangle (no fill, no halo). The fresh halo stops a pale-green
 * triangle dissolving into the light basemap; the ink outline is the crisp edge the mild tiers rely
 * on. Stale stays quiet — a single thin neutral stroke that already reads against the light ground.
 */
function triangleSVG(size: number, fresh: boolean, hue: string): string {
  const half = size / 2
  const pts = `${half},2 ${size - 2},${size - 2} 2,${size - 2}`
  if (fresh) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <polygon points="${pts}" fill="none" stroke="${HALO_LIGHT}" stroke-width="3.5" stroke-linejoin="round"/>
      <polygon points="${pts}" fill="${hue}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"
        style="filter:drop-shadow(0 1px 2.5px rgba(0,53,116,0.35))"/>
    </svg>`
  }
  // Hollow: a single thin neutral-grey outline, no fill (AQI hue drained), no halo (stays quiet).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <polygon points="${pts}" fill="none" stroke="${hue}" stroke-width="1.75" stroke-linejoin="round"/>
  </svg>`
}

/**
 * Circle SVG (low-cost sensor), light re-tune. Same fresh/stale logic as the triangle. The fresh circle
 * gets the inverted halo + ink outline; the stale circle is the smallest element in the set (~14px),
 * so the thin neutral-grey hollow ring is the legibility case the spike screenshots answered.
 */
function circleSVG(size: number, fresh: boolean, hue: string): string {
  const r = size / 2 - 2
  const c = size / 2
  if (fresh) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${HALO_LIGHT}" stroke-width="3.5"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="${hue}" stroke="${INK}" stroke-width="2"
        style="filter:drop-shadow(0 1px 2.5px rgba(0,53,116,0.35))"/>
    </svg>`
  }
  // Hollow: a single thin neutral-grey ring, no fill (AQI hue drained), no halo.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${hue}" stroke-width="1.75"/>
  </svg>`
}

/**
 * Build the detached marker element for one station on the active parameter. The caller attaches it
 * to a mapboxgl.Marker; this function never inserts into the DOM.
 *
 * Guards:
 *   - A station may lack the requested parameter reading (defensive): render a tiny neutral dot,
 *     never throw.
 *   - The hollow (stale) path uses the neutral dark-grey (staleStroke / Option A) for the outline;
 *     the fresh path uses the AQI tier hue. Stale markers therefore never carry an AQI hue (it is
 *     "drained"), matching the locked treatment.
 *
 * Side effects: creates a detached DOM element and sets a hover `title`. No DOM insertion here.
 */
export function createStationMarkerElement(
  station: Station,
  parameter: ParameterKey,
): HTMLElement {
  const el = document.createElement('div')
  el.style.cursor = 'pointer'

  const reading = station.parameters[parameter]
  // Defensive: a station without the active parameter reading gets a tiny neutral dot, never throws.
  if (reading === undefined) {
    el.style.width = '10px'
    el.style.height = '10px'
    el.style.borderRadius = '50%'
    el.style.background = NEUTRAL_FALLBACK
    return el
  }

  const fresh = !reading.isStale
  // Fresh markers carry the AQI hue; stale markers drain it to the neutral grey (Option A, design-owned).
  const hue = fresh ? freshHueFor(reading.value, parameter) : staleStroke()
  const isTriangle = station.quality === 'high'
  const size = isTriangle ? (fresh ? 24 : 22) : fresh ? 16 : 14
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  // Hover title — concise reading at the parameter's display precision; underlying data stays raw.
  el.setAttribute(
    'title',
    `${station.name} — ${formatReading(reading.value, parameter)} ${reading.unit} · ${station.quality} · ${fresh ? 'live' : 'stale'}`,
  )
  el.innerHTML = isTriangle ? triangleSVG(size, fresh, hue) : circleSVG(size, fresh, hue)
  return el
}
