/**
 * ProbeResultPopup.tsx — Nearest-live-sensors probe result (sensor LIST, no averaged value).
 *
 * Purpose:
 *   The popup shown after a "Check air quality" probe click resolves. This is the honesty rework of
 *   the increment-1 popup: it NO LONGER computes or shows a single averaged number. Triangulating a
 *   handful of sparse, heterogeneous sensors into one headline value over-claimed precision the data
 *   does not support. Instead this popup shows the LIST of the nearest live sensors backing the
 *   probe — each with its name, reading + unit, an AQI colour swatch, and its distance from the
 *   clicked point. The COLLECTIVE colour of the listed sensors is the inference the viewer reads;
 *   there is no fabricated aggregate.
 *
 *   What changed vs increment 1:
 *     - REMOVED: the big averaged value, the single AQI tier header derived from that average, and
 *       the "Simple average of N nearest live sensors" footnote + its math.
 *     - KEPT: the nearest-live-sensors list (now the whole result), each sensor's own AQI colour,
 *       the per-sensor reading, and the quality glyph (triangle = reference, circle = low-cost).
 *     - ADDED: a per-sensor distance from the clicked point (Haversine, computed locally from
 *       result.clickedPoint → sensor.coordinates — the shared triangulation module is read-only and
 *       does not expose per-sensor distances, so the distance is derived here for display only).
 *
 *   The probe pin + dash-lines to the referenced sensors are unchanged (owned by MapComponent).
 *   Vocabulary: "live sensors" everywhere, matching the header readout's "live" language.
 *
 *   Degradation: with only 1–2 live sensors nearby the popup says so plainly ("limited coverage
 *   here") — an honesty note, NOT an averaged number. The 0-fresh case is never shown (the probe
 *   returns null upstream + the toggle is disabled); a guard renders the honest no-result message.
 *
 * Key exports: ProbeResultPopup
 * External dependencies: react, ../../../direction-1-mapbox-v2/triangulation (TriangulationResult
 *   type, READ-ONLY), ../../../direction-2-live-data/aqiParameters (classify + tokens, READ-ONLY)
 *
 * Token discipline: each sensor's swatch colour resolves from the parameter's AQI tier tokens at
 *   runtime; no inlined AQI hex. Chrome (white panel, greys) uses prototype literals.
 */

'use client'

import React from 'react'
import type { TriangulationResult } from '@/lib/openaq/triangulation'
import {
  classifyAqi,
  formatReading,
  PARAMETER_META,
  resolveTierColor,
  type ParameterKey,
} from '@/lib/openaq/aqiParameters'

/** Primary text colour (prototype chrome). */
const TEXT = '#0f1117'
/** Muted text (prototype chrome). */
const MUTED = '#6b7280'

type Props = {
  /** Triangulation result (fresh-only — built from the excludeStale sensor set). Its nearestSensors
   *  list is what this popup renders; its averagePM25 is intentionally NOT used. */
  result: TriangulationResult
  /** Active parameter — selects the AQI tier colours + the reading unit. */
  parameter: ParameterKey
  /** Total fresh-sensor count for the active city+parameter — drives the honest coverage note. */
  freshCount: number
  /** Close the popup. */
  onClose: () => void
}

/** Pluralise "sensor" against a count, so all probe copy agrees. */
function sensorWord(count: number): string {
  return count === 1 ? 'sensor' : 'sensors'
}

/**
 * Haversine great-circle distance between two [lng, lat] points, in kilometres. Derived here for
 * DISPLAY only (the shared triangulation module is read-only and exposes sensors in distance order
 * but not the distances themselves). Same formula the triangulation uses internally, so the order
 * shown always matches the order triangulate() returned.
 */
function haversineKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Format a distance in km for display: metres under 1 km ("420 m"), one decimal up to 10 km
 * ("3.4 km"), whole km above ("12 km"). Keeps the per-sensor distance readable at city scale.
 */
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`
  }
  return `${Math.round(km)} km`
}

export function ProbeResultPopup({
  result,
  parameter,
  freshCount,
  onClose,
}: Props): React.ReactElement {
  const meta = PARAMETER_META[parameter]

  // 0-fresh guard: this popup should never be opened with no fresh sensors. If it somehow is,
  // render the honest no-result message rather than a fabricated result.
  if (freshCount === 0 || result.nearestSensors.length === 0) {
    return (
      <div style={panelStyle()}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT }}>
            No live sensors to probe here
          </div>
        </div>
      </div>
    )
  }

  const contributing = result.nearestSensors.length
  // Honesty note: with only 1–2 live sensors nearby, say coverage is limited. NOT an average.
  const limited = freshCount < 3

  return (
    <div style={panelStyle()}>
      {/* Header — frames the result as a LIST of live sensors, not a single value. */}
      <div style={{ padding: '13px 16px 10px', position: 'relative', borderBottom: '1px solid rgba(0,0,0,0.10)' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close result"
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: MUTED,
            opacity: 0.8,
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: '2px 4px',
          }}
        >
          ×
        </button>

        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, paddingRight: 18 }}>
          Nearest live {meta.label} {sensorWord(contributing)}
        </div>
        <div style={{ fontSize: '0.7rem', color: MUTED, marginTop: 3, lineHeight: 1.35 }}>
          The colour of these sensors is the local reading — no single value is averaged across them.
        </div>
      </div>

      {/* Sensor list — name, AQI swatch, reading + unit, distance from the click. The swatch colours
          ARE the inference; there is deliberately no aggregate number anywhere in this popup. */}
      <div style={{ padding: '10px 16px 12px' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, margin: 0, padding: 0 }}>
          {result.nearestSensors.map((sensor) => {
            const sensorTier = classifyAqi(sensor.pm25, parameter)
            const sensorColor = resolveTierColor(sensorTier, 'indicator') || MUTED
            const distanceKm = haversineKm(result.clickedPoint, sensor.coordinates)
            return (
              <li
                key={sensor.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.8rem',
                }}
              >
                {/* Left: AQI colour swatch + quality glyph + name + distance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {/* Swatch — the sensor's own AQI colour (functional). */}
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: sensorColor,
                    }}
                  />
                  {/* Quality glyph: triangle = reference-grade, circle = low-cost (mirrors markers). */}
                  {sensor.quality === 'high' ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }} aria-hidden="true">
                      <polygon points="5,1 9,9 1,9" fill={sensorColor} />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }} aria-hidden="true">
                      <circle cx="5" cy="5" r="4" fill={sensorColor} />
                    </svg>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: TEXT,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sensor.name}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: MUTED }}>
                      {formatDistance(distanceKm)} away
                    </div>
                  </div>
                </div>

                {/* Right: this sensor's reading + unit, coloured by its own AQI tier. */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: sensorColor, fontSize: '0.95rem' }}>
                    {formatReading(sensor.pm25, parameter)}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: MUTED, marginLeft: 3 }}>{meta.unit}</span>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Honesty note — limited coverage when few live sensors nearby. Not an averaged number. */}
        <div
          style={{
            marginTop: 11,
            fontSize: '0.66rem',
            color: MUTED,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            paddingTop: 8,
            lineHeight: 1.4,
          }}
        >
          {limited
            ? `Only ${freshCount} live ${sensorWord(freshCount)} nearby — limited coverage here.`
            : `Showing the ${contributing} nearest live ${sensorWord(contributing)} to this point.`}
        </div>
      </div>
    </div>
  )
}

/** Shared panel chrome. */
function panelStyle(): React.CSSProperties {
  return {
    background: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.22)',
    overflow: 'hidden',
    width: 268,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    pointerEvents: 'auto',
  }
}
