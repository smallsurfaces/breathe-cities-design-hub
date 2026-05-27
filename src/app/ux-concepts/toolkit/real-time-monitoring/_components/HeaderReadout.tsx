/**
 * HeaderReadout.tsx — "N of M sensors live" honesty readout for the real-time monitoring map.
 *
 * Purpose:
 *   The single honesty indicator at the top-left of the map. Reflects, for the active city +
 *   parameter, how much of the data is actually current. Component copy of
 *   direction-2-live-data/HeaderReadout.tsx, changed only in positioning: `position: absolute`
 *   anchored to the map region (not `fixed` to the viewport). The "0 of M" and "no sensors" forms
 *   are NORMAL readouts, visually identical to the populated form, never an error.
 *
 * Forms (microcopy):
 *   - loading      -> "Loading {City} {PARAM}…"
 *   - ready        -> "{City} · {N} of {M} sensors live"
 *   - empty-stale  -> "{City} · 0 of {M} sensors live"          (still normal — not an error)
 *   - empty        -> "{City} · no {PARAM} sensors"
 *   - error        -> nothing here (the error affordance owns its own copy + Retry)
 *
 * Key exports: HeaderReadout
 * External dependencies: react, ../../../direction-2-live-data/aqiParameters (PARAMETER_META,
 *   ParameterKey, read-only), ../../../direction-2-live-data/useStations (NetworkStatus, read-only)
 *
 * No design decisions: chrome matches the prototype's top-left header pill.
 */

'use client'

import React from 'react'
import { PARAMETER_META, type ParameterKey } from '@/lib/openaq/aqiParameters'
import type { NetworkStatus } from '@/lib/openaq/useStations'

/** BC brand blue — the small wordmark dot (prototype convention). */
const BRAND = '#0071c7'
/** Primary text colour on light chrome. */
const TEXT = '#0f1117'

type Props = {
  /** Display name of the active city (from the registry). */
  cityName: string
  /** Active parameter key — its label is shown in the readout copy. */
  parameter: ParameterKey
  /** Current network status, drives which textual form renders. */
  status: NetworkStatus
  /** Fresh (non-stale) station count for the active parameter — the "N". */
  freshCount: number
  /** Total stations returned for the active parameter — the "M". */
  totalCount: number
}

/**
 * Compose the readout text for the current status. Returns null for 'error' and 'idle' so the
 * pill renders nothing in those cases (error has its own affordance; idle is the pre-fetch flash).
 */
function readoutText(props: Props): string | null {
  const { cityName, parameter, status, freshCount, totalCount } = props
  const paramLabel = PARAMETER_META[parameter].label

  switch (status) {
    case 'loading':
      return `Loading ${cityName} ${paramLabel}…`
    case 'ready':
    case 'empty-stale':
      // "{City} · {N} of {M} sensors live" — empty-stale is just N=0, same shape (honest).
      return `${cityName} · ${freshCount} of ${totalCount} sensors live`
    case 'empty':
      return `${cityName} · no ${paramLabel} sensors`
    case 'error':
    case 'idle':
      return null
  }
}

/**
 * Top-left header pill. Renders the composed readout text, or nothing when there is no readout for
 * the current status (error / idle). Styling is identical regardless of N — "0 of M" must not look
 * like a problem.
 */
export function HeaderReadout(props: Props): React.ReactElement | null {
  const text = readoutText(props)
  if (text === null) {
    return null
  }

  return (
    <div
      data-slot="header-readout"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '9999px',
        padding: '8px 16px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: TEXT,
        boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 'calc(100% - 2rem)',
      }}
    >
      {/* Breathe Cities wordmark dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: BRAND,
          flexShrink: 0,
        }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </span>
    </div>
  )
}
