/**
 * CollectiveGoalImpact.tsx — the AQ Network homepage's "Collective goal & impact" section body.
 *
 * Purpose
 *   Two stacked cards that carry the network's SHARED story now that the per-city journey spine
 *   has been removed (the "members are the achievement" idea is carried by the Member cities grid):
 *     1. The shared 2030 GOAL — a brand-gradient card ("30% cleaner air by 2030").
 *     2. The collective HEALTH IMPACT — a brand-tinted card with Breathe Cities' three published
 *        per-decade figures (childhood-asthma cases, economic savings, premature deaths avoided),
 *        attributed via DataSource and labelled a projection.
 *
 *   These are the SAME two cards that previously lived as the GoalNode / PayoffNode on the old
 *   NetworkTimeline spine — lifted verbatim in styling (the dark-blue goal gradient and the
 *   brand-tinted impact card both read right), minus the spine wrappers (no <li>, no vertical
 *   rule, no circular node-markers — with no city nodes to connect, those would dangle).
 *
 * Honesty contract
 *   The collective figures are Breathe Cities' PUBLISHED estimates — a projection of the prize for
 *   the whole network hitting the 2030 goal, not a measured result. Attributed via DataSource and
 *   explicitly labelled an estimate/projection.
 *
 * Key exports: CollectiveGoalImpact (named), CollectiveImpactFigures (named type)
 * External dependencies: react (types), ./DataSource (collective-impact attribution).
 *   BC semantic tokens only — no hardcoded hex.
 */

import type { ReactElement } from 'react'
import { ConceptStat } from '@/components/concept'
import { DataSource } from './DataSource'

/**
 * The three collective health-impact figures — Breathe Cities' published per-decade estimates for
 * the whole network hitting the 2030 goal. Passed in as display strings so this component owns
 * presentation only.
 */
export type CollectiveImpactFigures = {
  /** Childhood-asthma cases avoided per decade (display string, e.g. "~79,000"). */
  asthmaCases: string
  /** Economic savings (display string, e.g. "~$107 billion"). */
  economicSavings: string
  /** Premature deaths avoided per decade (display string, e.g. "~39,000"). */
  deathsAvoided: string
}

/** Props for CollectiveGoalImpact. */
type CollectiveGoalImpactProps = {
  /** The shared network 2030 goal headline (e.g. "30% cleaner air by 2030"). */
  goalLabel: string
  /** The collective health-impact figures (see CollectiveImpactFigures). */
  impact: CollectiveImpactFigures
}

/**
 * The shared 2030-goal card — a FLAT brand-filled card naming the single destination every member
 * city is working toward. Brand-filled (solid dark-blue) so the goal reads as the brand-owned
 * destination; v2 drops v1's diagonal gradient for a flat brand fill while keeping the card's
 * prominence. This stays a LOCAL pattern (a brand-tinted payoff/destination card), not a
 * ConceptCard variant — the shared ConceptCard is the white outlined surface only. The white text
 * is applied via inline `style` var(--bc-color-white) (no `text-bc-*` utility classes).
 */
function GoalCard({ goalLabel }: { goalLabel: string }): ReactElement {
  return (
    <div
      className="rounded-2xl p-6 shadow-sm"
      style={{ backgroundColor: 'var(--bc-color-dark-blue)' }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'color-mix(in srgb, var(--bc-color-white) 80%, transparent)' }}
      >
        The shared 2030 goal
      </p>
      <p
        className="mt-1 text-2xl font-bold leading-tight sm:text-3xl"
        style={{ color: 'var(--bc-color-white)' }}
      >
        {goalLabel}
      </p>
      <p
        className="mt-2 text-sm"
        style={{ color: 'color-mix(in srgb, var(--bc-color-white) 90%, transparent)' }}
      >
        One goal, shared across the whole Breathe Cities network — every member city working
        toward the same destination.
      </p>
    </div>
  )
}

/**
 * The collective health-impact card — brand-TINTED (wash + border tint) so it reads as the upside
 * rather than a second brand-filled destination. Carries Breathe Cities' three published per-decade
 * figures, attributed via DataSource and explicitly labelled a projection. This is the former spine
 * PayoffNode's card body, minus the <li>/marker/spine wrappers.
 */
function ImpactCard({
  impact,
}: {
  impact: CollectiveImpactFigures
}): ReactElement {
  return (
    <div
      className="rounded-2xl border p-6 shadow-sm"
      style={{
        borderColor:
          'color-mix(in srgb, var(--bc-semantic-brand) 25%, var(--bc-color-white))',
        backgroundColor:
          'color-mix(in srgb, var(--bc-semantic-brand) 6%, var(--bc-color-white))',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        The collective prize
      </p>

      {/* HERO: the collective payoff if the whole network hits the 2030 goal. */}
      <p className="mt-2 text-lg font-semibold leading-snug text-foreground sm:text-xl">
        If the whole network reaches the 2030 goal, the shared prize across all member cities is
        substantial.
      </p>

      {/* The three published figures — childhood asthma + dollars saved leading, deaths present.
          Rendered via the shared ConceptStat (inner content only; the tinted ImpactCard surface
          here is the card). The figures' top row is empty (no icon, no estimate pill) so they
          read as plain figures inside this card, matching v1. */}
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <ConceptStat
          value={impact.asthmaCases}
          label="new childhood-asthma cases avoided per decade"
        />
        <ConceptStat value={impact.economicSavings} label="in economic savings" />
        <ConceptStat
          value={impact.deathsAvoided}
          label="premature deaths avoided per decade"
        />
      </div>

      {/* Honesty: Breathe Cities' published projection, not a measured result — attributed. */}
      <div
        className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-4"
        style={{
          borderColor:
            'color-mix(in srgb, var(--bc-semantic-brand) 18%, var(--bc-color-white))',
        }}
      >
        <span className="text-xs text-muted-foreground">
          Breathe Cities&rsquo; published estimates for the collective 30%-by-2030 goal — a
          projection of the prize, not a measured result.
        </span>
        <DataSource
          variant="attribution"
          name="Breathe Cities"
          href="https://breathecities.org"
        />
      </div>
    </div>
  )
}

/**
 * The "Collective goal & impact" section body — the shared 2030 goal card stacked above the
 * collective health-impact card. No spine, no vertical rule, no node markers (those belonged to the
 * removed per-city journey timeline). The two cards keep their own established styling so the
 * section reads as goal → its collective prize.
 */
export function CollectiveGoalImpact({
  goalLabel,
  impact,
}: CollectiveGoalImpactProps): ReactElement {
  return (
    <div className="space-y-4">
      <GoalCard goalLabel={goalLabel} />
      <ImpactCard impact={impact} />
    </div>
  )
}
