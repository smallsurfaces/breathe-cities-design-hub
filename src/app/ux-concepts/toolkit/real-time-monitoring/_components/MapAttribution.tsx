/**
 * MapAttribution.tsx — Persistent map-level data credit for the real-time monitoring map.
 *
 * Purpose:
 *   The always-visible "Air quality data from OpenAQ" credit. It must persist across every network
 *   state — loading, ready, empty, empty-stale, and error — so it is rendered by the page
 *   unconditionally. Component copy of direction-2-live-data/MapAttribution.tsx, changed only in
 *   positioning: `position: absolute` anchored to the map region (not `fixed`). Distinct from
 *   Mapbox's own basemap attribution; this credit is specifically for the air-quality data source.
 *
 * Key exports: MapAttribution
 * External dependencies: react
 *
 * No design decisions: small bottom-right pill, low-emphasis chrome, sits above the Mapbox control.
 */

'use client'

import React from 'react'

export function MapAttribution(): React.ReactElement {
  return (
    <div
      data-slot="map-attribution"
      style={{
        position: 'absolute',
        bottom: '0.6rem',
        right: '0.6rem',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: 9999,
        padding: '4px 10px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '0.62rem',
        fontWeight: 500,
        color: '#6b7280',
        boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
        pointerEvents: 'none',
      }}
    >
      Air quality data from OpenAQ
    </div>
  )
}
