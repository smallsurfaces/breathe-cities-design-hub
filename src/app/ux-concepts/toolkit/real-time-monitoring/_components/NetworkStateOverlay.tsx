/**
 * NetworkStateOverlay.tsx — Calm inline state notes for empty / empty-but-stale / error.
 *
 * Purpose:
 *   Renders the non-marker feedback for three of the four network states. Component copy of
 *   direction-2-live-data/NetworkStateOverlay.tsx, changed only in positioning: `position: absolute`
 *   anchored to the map region (not `fixed`). The hard line the brief draws — "loaded, found
 *   nothing" and "failed to load" must NEVER look the same:
 *     - empty (found nothing)     -> calm neutral note, NO retry
 *     - empty-stale (London case) -> calm explanatory note ("showing last-known…"), NO retry, NOT
 *                                    an error; markers still render their stale treatment
 *     - error (fetch failed)      -> visually distinct error affordance (error accent) WITH Retry
 *   Loading and ready render nothing here.
 *
 * Key exports: NetworkStateOverlay
 * External dependencies: react, ../../../direction-2-live-data/aqiParameters (PARAMETER_META,
 *   ParameterKey, read-only), ../../../direction-2-live-data/useStations (NetworkStatus, read-only)
 *
 * Token note: the error accent uses the BC error/destructive role colour (--bc-semantic-error),
 *   read at runtime; the empty/stale notes use neutral prototype chrome (deliberately calm) so they
 *   cannot be mistaken for an error.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { PARAMETER_META, type ParameterKey } from '@/lib/openaq/aqiParameters'
import type { NetworkStatus } from '@/lib/openaq/useStations'

/** Neutral text/border for calm (non-error) notes — deliberately NOT the error colour. */
const CALM_TEXT = '#0f1117'
const CALM_MUTED = '#6b7280'
/** Fallback for the BC error colour if the token cannot be resolved at runtime. */
const ERROR_FALLBACK = '#e8590c'

/**
 * Resolve the BC error/destructive token (--bc-semantic-error) at runtime, with a fallback.
 * Used only for the error state's accent so the error reads as clearly different from the calm
 * empty/stale notes.
 */
function useErrorColor(): string {
  const [color, setColor] = useState<string>(ERROR_FALLBACK)
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue('--bc-semantic-error')
      .trim()
    if (resolved.length > 0) {
      setColor(resolved)
    }
  }, [])
  return color
}

type Props = {
  /** Current network status — only empty / empty-stale / error render anything. */
  status: NetworkStatus
  /** Active city display name (for empty copy). */
  cityName: string
  /** Active parameter (its label appears in empty copy). */
  parameter: ParameterKey
  /** Re-issue the current fetch — wired to the error state's Retry button. */
  onRetry: () => void
}

/** Shared bottom-centre container styling for all three notes. */
function containerStyle(): React.CSSProperties {
  return {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 15,
    maxWidth: 'min(420px, calc(100% - 2rem))',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  }
}

export function NetworkStateOverlay({
  status,
  cityName,
  parameter,
  onRetry,
}: Props): React.ReactElement | null {
  const errorColor = useErrorColor()
  const paramLabel = PARAMETER_META[parameter].label

  // empty: calm neutral note, no retry. "Loaded, found nothing" — never an error.
  if (status === 'empty') {
    return (
      <div data-slot="network-empty" style={containerStyle()} role="status">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.16)',
            padding: '12px 18px',
            fontSize: '0.82rem',
            color: CALM_TEXT,
            textAlign: 'center',
          }}
        >
          {`No ${paramLabel} sensors found for ${cityName}.`}
        </div>
      </div>
    )
  }

  // empty-stale: calm explanatory note. Markers still render (stale treatment) on the map; this
  // only explains the situation. NOT an error — no error colour, no retry.
  if (status === 'empty-stale') {
    return (
      <div data-slot="network-empty-stale" style={containerStyle()} role="status">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.16)',
            padding: '12px 18px',
            fontSize: '0.82rem',
            color: CALM_TEXT,
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          <span style={{ fontWeight: 600 }}>Sensors here haven&rsquo;t reported recently.</span>{' '}
          <span style={{ color: CALM_MUTED }}>
            Showing last-known locations; nothing live to probe right now.
          </span>
        </div>
      </div>
    )
  }

  // error: visually distinct affordance (error accent + icon) WITH Retry. Must not look like empty.
  if (status === 'error') {
    return (
      <div data-slot="network-error" style={containerStyle()} role="alert">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 16,
            // Distinct from the calm notes: a clear error-coloured border.
            border: `1px solid ${errorColor}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {/* Error glyph — visually marks this as a failure, not an empty result */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              aria-hidden="true"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="10" cy="10" r="9" fill="none" stroke={errorColor} strokeWidth="2" />
              <line x1="10" y1="5.5" x2="10" y2="11" stroke={errorColor} strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="14" r="1.1" fill={errorColor} />
            </svg>
            <div style={{ fontSize: '0.84rem', color: CALM_TEXT, lineHeight: 1.45 }}>
              Couldn&rsquo;t load air quality data. Check your connection and try again.
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            style={{
              alignSelf: 'flex-start',
              border: 'none',
              cursor: 'pointer',
              background: errorColor,
              color: '#ffffff',
              borderRadius: 9999,
              padding: '8px 18px',
              minHeight: 36,
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // idle / loading / ready: nothing to render here.
  return null
}
