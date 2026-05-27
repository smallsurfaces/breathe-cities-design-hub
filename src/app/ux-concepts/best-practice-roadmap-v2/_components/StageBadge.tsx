/**
 * StageBadge.tsx — v2 reskin of the roadmap stage badge.
 *
 * Purpose
 *   Renders a coloured badge for one of the four roadmap stages (Seeing, Understanding, Acting,
 *   Enabling). This v2 version overrides the visual presentation at the component layer: instead
 *   of reading STAGE_COLORS from roadmap-data.ts (which maps to Tailwind blue/amber/green/gray
 *   utility classes), it applies distinct --bc-* token tints inline so the stage colours use
 *   BC brand tokens rather than arbitrary Tailwind colours.
 *
 *   The shared data file (roadmap-data.ts) is NOT imported for colours here — only the Stage
 *   type is used. This keeps v2's presentation layer independent of the shared data's colour
 *   constants without touching any shared file.
 *
 * Stage hue → tint mapping (flagged for design-qa/Jack):
 *   Seeing        → --bc-color-blue       (cool blue — data collection, sensing)
 *   Understanding → --bc-color-teal       (teal — analysis, insight)
 *   Acting        → --bc-color-dark-blue  (deep navy — intervention, weight)
 *   Enabling      → --bc-color-steel      (steel grey — infrastructure, support)
 *
 * Styling: inline style with var(--bc-*) tokens — no *-bc-* utility classes, no hardcoded hex.
 *
 * Key exports: StageBadge (named)
 * External dependencies: react, @/data/roadmap-data (Stage type only)
 */

import type { Stage } from '@/data/roadmap-data'

/** Per-stage BC-token tint config — presentation-layer override, independent of STAGE_COLORS. */
const STAGE_BADGE_STYLE: Record<Stage, { bg: string; text: string }> = {
  Seeing: {
    bg: 'color-mix(in srgb, var(--bc-color-blue) 16%, var(--bc-color-white))',
    text: 'color-mix(in srgb, var(--bc-color-blue) 90%, var(--bc-color-dark-blue))',
  },
  Understanding: {
    bg: 'color-mix(in srgb, var(--bc-color-teal) 16%, var(--bc-color-white))',
    text: 'color-mix(in srgb, var(--bc-color-teal) 90%, var(--bc-color-dark-blue))',
  },
  Acting: {
    bg: 'color-mix(in srgb, var(--bc-color-dark-blue) 12%, var(--bc-color-white))',
    text: 'var(--bc-color-dark-blue)',
  },
  Enabling: {
    bg: 'color-mix(in srgb, var(--bc-color-steel) 16%, var(--bc-color-white))',
    text: 'color-mix(in srgb, var(--bc-color-steel) 90%, var(--bc-color-dark-blue))',
  },
}

interface StageBadgeProps {
  stage: Stage
}

/**
 * Renders a stage label as a BC-token-tinted pill. No shadcn Badge dependency — applies inline
 * style directly so the tints resolve to actual BC brand colours (not Tailwind arbitrary values).
 */
export function StageBadge({ stage }: StageBadgeProps) {
  const style = STAGE_BADGE_STYLE[stage]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {stage}
    </span>
  )
}
