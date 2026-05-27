/**
 * ConceptStat.tsx — one statistic block (big number + label) for concept prototypes.
 *
 * Purpose
 *   The shared "stat" primitive: a large tabular figure with a muted label, an optional leading
 *   icon, and an optional "Estimate" pill. Extracted from the two near-identical figure blocks
 *   the AQ Network concept already uses — the Counter in SensorGrowthMap.tsx (icon + value +
 *   label + estimate pill) and the ImpactCard figures in CollectiveGoalImpact.tsx (value +
 *   label) — so every concept renders a stat the SAME way.
 *
 *   This renders INNER CONTENT ONLY (the icon/pill row, the value, the label). It does NOT draw a
 *   card surface — the caller wraps it in <ConceptCard> when a carded stat is wanted, exactly as
 *   the reference does (the Counter's outer card is the card; the figure is the inner content).
 *   That keeps the stat reusable both inside a card (the counters) and bare in a grid (the impact
 *   figures, which sit inside one shared card, not one card each).
 *
 * Caps & functional colour
 *   The value is capped at `text-3xl` (the reference's size) — never larger. The `estimate` pill
 *   is FUNCTIONAL (it flags a guesstimated figure) and is kept verbatim: a soft yellow wash via
 *   color-mix on the BC yellow token. No emoji.
 *
 * Styling
 *   Bridged shadcn semantics for text (`text-foreground`, `text-muted-foreground`); inline
 *   `style` with `var(--bc-*)` for the estimate pill's wash (a token that isn't a bridged
 *   utility). No `*-bc-*` utility classes; no hardcoded hex.
 *
 * Key exports: ConceptStat (named)
 * External dependencies: react (ReactNode).
 */

import type { ReactNode } from 'react'

/** Props for ConceptStat. */
type ConceptStatProps = {
  /** The figure to show (display string, e.g. "12" or "~$107 billion"). */
  value: string
  /** The muted caption beneath the value. */
  label: string
  /** When true, renders the functional yellow "Estimate" pill (flags a guesstimated figure). */
  estimate?: boolean
  /** Optional leading icon (rendered muted, aria-hidden) in the top row. */
  icon?: ReactNode
  /** Extra classes appended to the wrapper (layout/overrides only). */
  className?: string
}

/**
 * One stat block: an icon/estimate-pill row, the big tabular value (capped at text-3xl), and the
 * muted label. Inner content only — wrap in <ConceptCard> for a carded stat. The icon row renders
 * whenever an icon or the estimate pill is present, mirroring the reference Counter layout.
 */
export function ConceptStat({
  value,
  label,
  estimate,
  icon,
  className,
}: ConceptStatProps) {
  const showTopRow = icon !== undefined || estimate === true

  return (
    <div className={className}>
      {showTopRow && (
        <div className="flex items-center justify-between gap-2">
          {icon !== undefined ? (
            <span className="text-muted-foreground" aria-hidden="true">
              {icon}
            </span>
          ) : (
            // Keep the estimate pill right-aligned even with no icon present.
            <span aria-hidden="true" />
          )}
          {estimate === true && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--bc-color-yellow) 30%, var(--bc-color-white))',
                color: 'var(--bc-semantic-text)',
              }}
            >
              Estimate
            </span>
          )}
        </div>
      )}
      <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
