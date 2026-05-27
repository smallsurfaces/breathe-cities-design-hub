/**
 * Legend.tsx — Parameter-aware AQI legend for the real-time monitoring map (light basemap).
 *
 * Purpose:
 *   The map legend. Title, bands, ranges, and units ALL switch with the active parameter — there is
 *   no fixed PM2.5 table. Component copy of direction-2-live-data/Legend.tsx with two changes:
 *     1. positioning is `position: absolute` anchored to the map region (not `fixed`), and
 *     2. the freshness "Live" swatch border is dark-blue ink (#003574) to match the LIGHT marker
 *        treatment (the dark route used a white border, which vanishes on the light basemap).
 *   It reads ranges + swatch colours from the single AQI source (aqiParameters.ts). The legend
 *   still renders the parameter's bands even when zero stations report it.
 *
 * Key exports: Legend
 * External dependencies: react, ../../../direction-2-live-data/aqiParameters (bands + tokens +
 *   meta, read-only), ./MapComponent (MapMode)
 *
 * Token discipline: swatch colours are resolved from --bc-semantic-aqi-*-indicator at runtime via
 *   resolveTierColor (no inlined AQI hex). The ink "Live" border is structural chrome (not AQI).
 */

'use client'

import React, { useEffect, useState } from 'react'
import {
  getAqiBands,
  PARAMETER_META,
  resolveMutedColor,
  resolveTierColor,
  type AqiLegendBand,
  type ParameterKey,
} from '@/lib/openaq/aqiParameters'
import type { MapMode } from './MapComponent'

/** Muted label colour (prototype chrome). */
const MUTED = '#6b7280'
/** Primary text colour (prototype chrome). */
const TEXT = '#0f1117'
/** BC brand blue for the reference-grade (triangle) key swatch. */
const BRAND = '#0071c7'
/** Steel-ish for the low-cost-sensor (circle) key swatch (matches the muted sensor role). */
const LOW_QUALITY = '#9c27b0'
/** Dark-blue ink (#003574 = --bc-color-dark-blue) — the fresh-marker edge on the light basemap. */
const INK = '#003574'

/** Per-mode hint text shown at the bottom of the legend (parameter-interpolated). */
function modeHint(mapMode: MapMode, paramLabel: string): string {
  switch (mapMode) {
    case 'default':
      return `Activate 'Check air quality' to probe ${paramLabel} at any location`
    case 'probe':
      return `Click anywhere on the map to triangulate ${paramLabel} from the nearest live sensors`
    case 'annotate':
      return 'Click to drop a comment pin'
  }
}

type Props = {
  /** Active parameter — drives the title, bands, ranges, and units. */
  parameter: ParameterKey
  /** Current interaction mode — drives the usage hint text. */
  mapMode: MapMode
}

export function Legend({ parameter, mapMode }: Props): React.ReactElement {
  const meta = PARAMETER_META[parameter]
  const bands: AqiLegendBand[] = getAqiBands(parameter)

  // Token-resolved colours are applied ONLY after mount (the server + first client render cannot
  // read the cascade), avoiding a hydration mismatch. resolveTierColor caches, so it is cheap.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  /** Tier indicator hue: resolved token after mount, neutral 'transparent' before (SSR-safe). */
  const swatchColor = (band: AqiLegendBand): string =>
    mounted ? resolveTierColor(band.tier, 'indicator') || 'transparent' : 'transparent'

  return (
    <div
      data-slot="legend"
      style={{
        position: 'absolute',
        bottom: '2rem',
        left: '1rem',
        width: '230px',
        maxWidth: 'calc(100% - 2rem)',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
        padding: '14px 16px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        zIndex: 10,
      }}
    >
      {/* Section header — parameter-aware title */}
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: MUTED,
          marginBottom: 8,
        }}
      >
        {meta.legendTitle}
      </div>

      {/* AQI colour bands — parameter-aware ranges + units, swatch hue from tokens */}
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {bands.map((band) => (
          <li key={band.tier.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Colour swatch — tier indicator token, applied after mount (SSR-safe, see swatchColor) */}
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: swatchColor(band),
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT, lineHeight: 1.2 }}>
                {band.tier.label}
              </div>
              <div style={{ fontSize: '0.62rem', color: MUTED }}>
                {band.range}
                {meta.unit !== null ? ` ${meta.unit}` : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)', margin: '10px 0 8px' }} />

      {/* Sensor type key */}
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: MUTED,
          marginBottom: 6,
        }}
      >
        Sensor Type
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <polygon points="7,1 13,13 1,13" fill={BRAND} />
          </svg>
          <span style={{ fontSize: '0.72rem', color: TEXT }}>Reference grade</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" fill={LOW_QUALITY} />
          </svg>
          <span style={{ fontSize: '0.72rem', color: TEXT }}>Low-cost sensor</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)', margin: '10px 0 8px' }} />

      {/* Freshness key — fresh (solid) vs stale (hollow), matching the LIGHT marker treatment */}
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: MUTED,
          marginBottom: 6,
        }}
      >
        Freshness
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Solid swatch = live — ink border (matches the light fresh-marker edge, not white) */}
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" fill={BRAND} stroke={INK} strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: '0.72rem', color: TEXT }}>Live (recent)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hollow swatch = stale (steel from the muted token, applied after mount; SSR-safe
              fallback to the steel literal so server + first client render match) */}
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <circle
              cx="7"
              cy="7"
              r="5"
              fill="none"
              stroke={mounted ? resolveMutedColor() || '#b2c2d5' : '#b2c2d5'}
              strokeWidth="2"
            />
          </svg>
          <span style={{ fontSize: '0.72rem', color: TEXT }}>Stale (last known)</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)', margin: '10px 0 8px' }} />

      {/* Usage hint — text changes per interaction mode + parameter */}
      <div style={{ fontSize: '0.68rem', color: MUTED, lineHeight: 1.4 }}>
        {modeHint(mapMode, meta.label)}
      </div>
    </div>
  )
}
