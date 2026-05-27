/**
 * PillarRadar.tsx — the three-pillar radar, DERIVED from the achievement timeline.
 *
 * Purpose
 *   Summarises how Breathe Cities supports a city across its three CITY-LEVEL support
 *   pillars (1 Expanding data, 2 Technical support for policymaking, 3 Raising awareness)
 *   as a single three-axis radar. The values are NOT authored — the page counts achievement
 *   cards per radar pillar and passes those counts in. This component only draws; it never
 *   decides a score.
 *
 *   Lesson sharing (BC pillar 4) is deliberately NOT a radar axis: it is relational
 *   (city-to-city) and is shown as its own participation strand elsewhere on the profile.
 *   The radar reads from RADAR_PILLARS (the three-pillar subset), so pillar 4 can never
 *   reappear here even though it remains a valid card tag.
 *
 *   Framing (load-bearing, shown in the UI by the page, not here): the radar is a
 *   PROGRAMME scorecard ("How Breathe Cities supports Accra"), never a city grade. A light
 *   axis means less BC support FOCUS on that pillar — never "the city is bad". A pillar with
 *   no cards (count 0) is honest and renders as a point at the centre on that axis.
 *
 * Rendering approach
 *   A small inline SVG (no chart library — keeps the prototype dependency-light). Three axes
 *   at 120° apart (pillar 1 at the top, then clockwise), value rings, a filled value polygon,
 *   and a label per axis. All geometry is derived from named constants below so the math is
 *   explicit and reviewable, never magic. Colours come from BC tokens only (no hardcoded hex).
 *
 * Key exports: PillarRadar (named)
 * External dependencies: react (types only), ../_data/types (RADAR_PILLARS, RADAR_PILLAR_IDS,
 *   RadarPillarId).
 */

import type { ReactElement } from 'react'
import {
  RADAR_PILLARS,
  RADAR_PILLAR_IDS,
  type RadarPillarId,
} from '../_data/types'

// ── Geometry constants — every coordinate below derives from these, so the layout is
//    explicit and tunable in one place (no magic numbers in the JSX). ─────────────────
/** SVG viewBox is SIZE x SIZE; the radar is centred in it. */
const SIZE = 260
/** Centre point (x and y are equal — square canvas). */
const CENTER = SIZE / 2
/** Radius of the outer ring (the maximum value). Leaves room for axis labels outside it. */
const MAX_RADIUS = 78
/** Number of concentric guide rings (also the max value an axis can represent). */
const RING_COUNT = 3
/** How far out (beyond MAX_RADIUS) the text label for each axis sits. */
const LABEL_OFFSET = 30
/** Angle (radians) of the first axis — straight up in SVG's y-down space. */
const FIRST_AXIS_ANGLE = -Math.PI / 2
/** Equal angular step between the three axes: a full turn split three ways (120°). */
const AXIS_STEP = (2 * Math.PI) / RADAR_PILLAR_IDS.length

/**
 * The three axis directions in radians, pillar 1 at the TOP and going clockwise at 120°:
 *   pillar 1 → up (−90°), pillar 2 → lower-right (30°), pillar 3 → lower-left (150°).
 * Derived from the radar-pillar order so adding/removing a radar pillar re-spaces the axes
 * automatically — no hand-tuned per-pillar angle to fall out of sync.
 */
const AXIS_ANGLE_BY_ID: Readonly<Record<RadarPillarId, number>> =
  RADAR_PILLAR_IDS.reduce(
    (acc, id, index) => {
      acc[id] = FIRST_AXIS_ANGLE + index * AXIS_STEP
      return acc
    },
    {} as Record<RadarPillarId, number>,
  )

/**
 * BC token colour per radar pillar (CSS custom properties — never hardcoded hex). Matches
 * the timeline's pillar colours (PillarRadar + AchievementTimeline read as one system).
 */
const PILLAR_COLOR_VAR: Readonly<Record<RadarPillarId, string>> = {
  1: 'var(--bc-color-blue)',
  2: 'var(--bc-color-teal)',
  3: 'var(--bc-color-tangerine)',
}

/**
 * Convert a pillar's value (0..maxValue) on a given axis into an [x, y] SVG point.
 * value 0 sits at the centre; value === maxValue sits on the outer ring. Pure helper.
 */
function pointFor(
  pillarId: RadarPillarId,
  value: number,
  maxValue: number,
): [number, number] {
  // Guard a zero/!finite max so an all-empty radar collapses to the centre rather than NaN.
  const safeMax = maxValue > 0 ? maxValue : 1
  const ratio = value / safeMax
  const radius = ratio * MAX_RADIUS
  const angle = AXIS_ANGLE_BY_ID[pillarId]
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)]
}

/** Props for PillarRadar. */
type PillarRadarProps = {
  /**
   * Achievement count per radar pillar, DERIVED by the page from the timeline. Keyed by
   * RadarPillarId (the three city-level support pillars only). The component renders these
   * as-is and never recomputes them.
   */
  counts: Readonly<Record<RadarPillarId, number>>
}

/**
 * The three-pillar radar. Draws guide rings, three labelled axes, and the value polygon from
 * the supplied per-pillar counts. The maximum ring equals the largest count (min 1) so the
 * shape always fills the canvas sensibly regardless of absolute counts.
 */
export function PillarRadar({ counts }: PillarRadarProps): ReactElement {
  // The outer ring represents the highest pillar count (at least 1, to avoid divide-by-zero).
  const maxValue = Math.max(1, ...RADAR_PILLARS.map((p) => counts[p.id as RadarPillarId]))

  // Value polygon points, in radar-pillar order, as an SVG points string.
  const polygonPoints = RADAR_PILLARS.map((pillar) => {
    const id = pillar.id as RadarPillarId
    const [x, y] = pointFor(id, counts[id], maxValue)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Three-pillar support radar, derived from the achievement timeline"
      className="h-auto w-full max-w-[280px]"
    >
      {/* Concentric guide rings — purely visual scale reference. */}
      {Array.from({ length: RING_COUNT }, (_, i) => {
        const r = (MAX_RADIUS * (i + 1)) / RING_COUNT
        return (
          <circle
            key={`ring-${i}`}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="var(--bc-semantic-border)"
            strokeWidth={1}
          />
        )
      })}

      {/* Three axes from the centre to each outer point. */}
      {RADAR_PILLARS.map((pillar) => {
        const id = pillar.id as RadarPillarId
        const [x, y] = pointFor(id, maxValue, maxValue)
        return (
          <line
            key={`axis-${id}`}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--bc-semantic-border)"
            strokeWidth={1}
          />
        )
      })}

      {/* The value polygon — brand-tinted fill with a brand stroke. */}
      <polygon
        points={polygonPoints}
        fill="var(--bc-color-blue)"
        fillOpacity={0.18}
        stroke="var(--bc-semantic-brand)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* A dot at each pillar's value, in that pillar's colour (empty pillars sit at centre). */}
      {RADAR_PILLARS.map((pillar) => {
        const id = pillar.id as RadarPillarId
        const [x, y] = pointFor(id, counts[id], maxValue)
        return (
          <circle key={`dot-${id}`} cx={x} cy={y} r={4} fill={PILLAR_COLOR_VAR[id]} />
        )
      })}

      {/* Axis labels — short labels just outside the outer ring, anchored by horizontal side. */}
      {RADAR_PILLARS.map((pillar) => {
        const id = pillar.id as RadarPillarId
        const angle = AXIS_ANGLE_BY_ID[id]
        const r = MAX_RADIUS + LABEL_OFFSET
        const lx = CENTER + r * Math.cos(angle)
        const ly = CENTER + r * Math.sin(angle)
        // Anchor by which horizontal half the label sits in so it never overruns the canvas:
        // dead-centre (top axis) is centred, right half starts, left half ends.
        const cosA = Math.cos(angle)
        const anchor =
          Math.abs(cosA) < 0.01 ? 'middle' : cosA > 0 ? 'start' : 'end'
        return (
          <text
            key={`label-${id}`}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-foreground text-[10px] font-semibold"
          >
            {pillar.shortLabel}
          </text>
        )
      })}
    </svg>
  )
}
