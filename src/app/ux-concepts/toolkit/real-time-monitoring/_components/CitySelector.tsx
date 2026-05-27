/**
 * CitySelector.tsx — Segmented city control for the real-time monitoring map.
 *
 * Purpose:
 *   Top-centre segmented control listing the cities served by the data-core registry. Exactly one
 *   city is active. Component copy of direction-2-live-data/CitySelector.tsx, changed only in
 *   positioning: `position: absolute` anchored to the map region (not `fixed` to the viewport), so
 *   it sits correctly below the concept chrome (BcHeader/PrototypeHeader) rather than under it.
 *
 * Key exports: CitySelector
 * External dependencies: react, ../../../../lib/openaq/cities (CITIES — read-only registry)
 *
 * No design decisions here: the segmented-control chrome mirrors the prototype's pill affordances
 * (white/blur panel, BC brand blue for the active segment). Colours are prototype chrome literals,
 * not AQI semantics.
 */

'use client'

import React from 'react'
import { CITIES, type City } from '@/lib/openaq/cities'

/** BC brand blue — active-segment fill. Matches the prototype's existing control chrome. */
const BRAND = '#0071c7'
/** Primary text colour on light chrome (prototype convention). */
const TEXT = '#0f1117'

type Props = {
  /** Currently active city slug. */
  activeSlug: string
  /** Called with the chosen slug when a segment is selected. */
  onSelect: (slug: string) => void
  /**
   * Optional ordered list of city slugs to show as example cities. Defaults to the full registry.
   * The component renders these in order; unknown slugs are skipped (defensive). This keeps the
   * control to a curated, single-row set of good-coverage demo cities rather than all 14 registry
   * cities (which would wrap and collide with the selectors stacked below it).
   */
  slugs?: readonly string[]
}

/**
 * Renders one segment per requested city (from `slugs`, defaulting to the full registry). The active
 * segment is filled with the brand colour; inactive segments are transparent over the shared panel.
 * The whole control is a single pill so the segments read as one switch.
 */
export function CitySelector({ activeSlug, onSelect, slugs }: Props): React.ReactElement {
  // Resolve the requested slugs to registry cities in order; skip any unknown slug defensively.
  // With no `slugs` prop, fall back to the full registry (preserves the data-driven default).
  const cities: City[] =
    slugs === undefined
      ? [...CITIES]
      : slugs
          .map((slug) => CITIES.find((c) => c.slug === slug))
          .filter((c): c is City => c !== undefined)
  return (
    <div
      data-slot="city-selector"
      role="group"
      aria-label="Select city"
      style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        maxWidth: 'calc(100% - 2rem)',
        borderRadius: '9999px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {cities.map((city) => {
        const isActive = city.slug === activeSlug
        return (
          <button
            key={city.slug}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(city.slug)}
            style={{
              border: 'none',
              cursor: 'pointer',
              minHeight: 38,
              padding: '8px 18px',
              borderRadius: '9999px',
              background: isActive ? BRAND : 'transparent',
              color: isActive ? '#ffffff' : TEXT,
              fontSize: '0.82rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
          >
            {city.name}
          </button>
        )
      })}
    </div>
  )
}
