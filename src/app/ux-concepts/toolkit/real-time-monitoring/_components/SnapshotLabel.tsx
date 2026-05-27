/**
 * SnapshotLabel.tsx — honest data-source label for the map demo (top-right overlay).
 *
 * Purpose:
 *   Surfaces WHICH data the map is showing so frozen snapshot timestamps never masquerade as
 *   live-fresh. When the route served the committed snapshot, this reads "Snapshot · data as of
 *   <date>"; when it served live OpenAQ, it reads "Live data". The date comes from the snapshot's
 *   capture instant (the `x-snapshot-captured-at` header surfaced by useStations), formatted as a
 *   calendar date. Until the first fetch settles (servedSource null) nothing is shown.
 *
 *   This is a deliberately quiet, factual chip — not a control. The user-facing go-live TOGGLE is
 *   out of scope for this increment; this label only reports the source the page chose (snapshot by
 *   default).
 *
 * Key exports: SnapshotLabel
 * External dependencies: react, ../../../direction-2-live-data/useStations (DataSource type)
 *
 * No design decisions: chrome mirrors the other map overlays (white/blur pill, muted text). Colours
 * are prototype chrome literals — no AQI/functional colour here (the label is neutral metadata).
 */

'use client'

import React from 'react'
import type { DataSource } from '@/lib/openaq/useStations'

/** Muted text on light chrome (prototype convention). */
const MUTED = '#445063'

type Props = {
  /** Which source the route actually served (null until the first fetch settles). */
  servedSource: DataSource | null
  /** Snapshot capture instant (ISO) when the served data is a snapshot; null for live. */
  capturedAt: string | null
}

/**
 * Format the capture instant as a stable calendar date ("24 May 2026"). Returns null when the value
 * is missing or unparseable so the caller can omit the date gracefully (never a fabricated date).
 */
function formatCapturedDate(capturedAt: string | null): string | null {
  if (capturedAt === null) {
    return null
  }
  const ms = new Date(capturedAt).getTime()
  if (!Number.isFinite(ms)) {
    return null
  }
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function SnapshotLabel({ servedSource, capturedAt }: Props): React.ReactElement | null {
  // Nothing to report until the first fetch settles.
  if (servedSource === null) {
    return null
  }

  const date = formatCapturedDate(capturedAt)
  const text =
    servedSource === 'snapshot'
      ? date !== null
        ? `Snapshot · data as of ${date}`
        : 'Snapshot data'
      : 'Live data'

  return (
    <div
      data-slot="snapshot-label"
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 20,
        maxWidth: 'calc(100% - 2rem)',
        padding: '6px 12px',
        borderRadius: '9999px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.16)',
        color: MUTED,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={text}
    >
      {text}
    </div>
  )
}
