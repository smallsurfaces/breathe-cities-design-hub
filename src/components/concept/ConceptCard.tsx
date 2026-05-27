/**
 * ConceptCard.tsx — the single outlined surface used across concept prototypes.
 *
 * Purpose
 *   The one canonical "card" surface for the concept composition layer: a rounded, subtly
 *   outlined white panel with a soft shadow and standard padding. Extracted verbatim from the
 *   surface the AQ Network concept already uses (the Counter card in
 *   aq-network/_components/SensorGrowthMap.tsx — `rounded-2xl border border-border bg-background
 *   p-5`), generalised so every concept wraps content in the SAME surface instead of re-declaring
 *   the class string. Layout-only: it sets the surface, never the inner content's colour or type.
 *
 *   `noPadding` drops the built-in padding for callers that need the surface to wrap a flush child
 *   (e.g. a map canvas or a full-bleed media block) and supply their own internal spacing.
 *
 * Styling
 *   shadcn semantic classes that are bridged onto BC tokens in globals.css (`border-border`,
 *   `bg-background`) — these resolve to BC values with no hardcoded hex. No `*-bc-*` utility
 *   classes; no inline colour needed here because the surface uses only bridged semantics.
 *
 * Key exports: ConceptCard (named)
 * External dependencies: react (ReactNode).
 */

import type { ReactNode } from 'react'

/** Props for ConceptCard. */
type ConceptCardProps = {
  /** The card's content. */
  children: ReactNode
  /** Extra classes appended after the base surface classes (layout/overrides only). */
  className?: string
  /** Drop the built-in p-5 padding (for flush children that own their spacing). */
  noPadding?: boolean
}

/**
 * The outlined card surface. Composes the canonical surface classes, appends the optional
 * className, and includes `p-5` unless `noPadding` is set. Renders only the surface + children.
 */
export function ConceptCard({
  children,
  className,
  noPadding,
}: ConceptCardProps) {
  const classes = [
    'rounded-2xl border border-border bg-background shadow-sm',
    noPadding ? '' : 'p-5',
    className ?? '',
  ]
    .filter((part) => part.length > 0)
    .join(' ')

  return <div className={classes}>{children}</div>
}
