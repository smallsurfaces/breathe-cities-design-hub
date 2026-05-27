/**
 * ProbeToggle.tsx — Centre-top "Check air quality" probe toggle with a 0-fresh disabled state.
 *
 * Purpose:
 *   The control that turns on the triangulation probe — surfaced, clearly labelled, as
 *   "Check air quality". Component copy of direction-2-live-data/ProbeToggle.tsx, changed only in
 *   positioning: `position: absolute` anchored to the map region (not `fixed`). The probe estimates
 *   the active parameter at a clicked point by triangulating nearby LIVE sensors. Three states:
 *     - default  (>=1 fresh) : "Check air quality" — clickable, activates probe mode
 *     - active   (probe on)  : "Probe active — click map" — pulsing ring
 *     - disabled (0 fresh)   : "No live sensors to probe here yet" — NOT clickable; the reason is
 *                              visible BEFORE any click (label + title + aria)
 *
 * Key exports: ProbeToggle
 * External dependencies: react
 *
 * No design decisions: chrome mirrors the prototype toggle; disabled styling uses reduced opacity +
 * muted text + not-allowed cursor. Colours are prototype chrome literals.
 */

'use client'

import React from 'react'

/** BC brand blue — active fill + pulse ring (prototype chrome). */
const BRAND = '#0071c7'
/** Primary text on light chrome. */
const TEXT = '#0f1117'
/** Muted text for the disabled state. */
const MUTED = '#9aa6b2'

type Props = {
  /** Whether probe mode is currently active. */
  isActive: boolean
  /** Whether the probe is available — false when 0 fresh sensors (disabled/explained state). */
  isAvailable: boolean
  /** Called when the (enabled) button is clicked. Never fires when disabled. */
  onToggle: () => void
}

/** Crosshair glyph reinforcing "check a location". Inline so there is no icon-library dependency. */
function CrosshairIcon({ color }: { color: string }): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.5" fill={color} />
      <line x1="8" y1="1" x2="8" y2="4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="11.5" x2="8" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="8" x2="4.5" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ProbeToggle({ isActive, isAvailable, onToggle }: Props): React.ReactElement {
  const disabled = !isAvailable

  // Label per state. Disabled communicates the reason BEFORE a click.
  const label = disabled
    ? 'No live sensors to probe here yet'
    : isActive
      ? 'Probe active — click map'
      : 'Check air quality'

  const iconColor = disabled ? MUTED : isActive ? '#ffffff' : TEXT
  const textColor = disabled ? MUTED : isActive ? '#ffffff' : TEXT

  return (
    <>
      {/* Probe-pulse keyframes (only meaningful when active). Co-located with the component. */}
      <style>{`
        @keyframes probe-pulse-rt {
          0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
          70%  { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          // Sits below the two stacked selectors (city ~1rem, parameter ~4.5rem) so it does not
          // overlap them. Absolute within the map region (the chrome sits above the region).
          position: 'absolute',
          top: '7.4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pulsing rings — only when active (and therefore never when disabled). */}
        {isActive && !disabled && (
          <>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '100%',
                borderRadius: '9999px',
                border: `2px solid ${BRAND}`,
                animation: 'probe-pulse-rt 2.5s ease-out infinite',
                animationDelay: '0s',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '100%',
                borderRadius: '9999px',
                border: `2px solid ${BRAND}`,
                animation: 'probe-pulse-rt 2.5s ease-out infinite',
                animationDelay: '1.25s',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        <button
          type="button"
          onClick={() => {
            // Guard: a disabled toggle must never activate probe mode, even if a click leaks through.
            if (disabled) {
              return
            }
            onToggle()
          }}
          disabled={disabled}
          aria-pressed={isActive}
          // Reason surfaced before click for the disabled state.
          title={disabled ? 'No live sensors to probe here yet' : undefined}
          aria-label={
            disabled
              ? 'Probe unavailable — no live sensors to probe here yet'
              : isActive
                ? 'Probe mode active — click to deactivate'
                : 'Activate probe mode to check air quality'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            minHeight: 44,
            borderRadius: '9999px',
            border: isActive && !disabled ? `2px solid ${BRAND}` : '2px solid transparent',
            background: disabled
              ? 'rgba(255, 255, 255, 0.78)'
              : isActive
                ? BRAND
                : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: textColor,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.85 : 1,
            boxShadow:
              isActive && !disabled
                ? '0 4px 20px rgba(0, 113, 199, 0.40)'
                : '0 2px 10px rgba(0,0,0,0.18)',
            transition:
              'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <CrosshairIcon color={iconColor} />
          {label}
        </button>
      </div>
    </>
  )
}
