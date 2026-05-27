/**
 * AchievementTimeline.tsx — the NARRATIVE SPINE of the AQ Network profile.
 *
 * Purpose
 *   Renders a city's journey as a single vertical spine: the achievement cards (oldest → newest)
 *   leading into ONE terminal 2030-GOAL node that all the cards point toward. This is where the
 *   concept's framing rules are enforced VISUALLY:
 *     - City is the hero, BC is the credit. The card headline (city-as-actor, authored in the
 *       data) is the dominant element; BC appears ONLY as a small "Supported by BC · [pillar]"
 *       tag. The component never renders "BC did X".
 *     - Claim support, never outcomes. These cards are support ACTIVITIES; there is no
 *       outcome/metric slot, so a card can't present a pollution-reduction OUTCOME as an
 *       achievement. The goal node is a shared DESTINATION, not a claimed result.
 *     - The sequence is the point, the dates are approximate. Each card shows its (estimated)
 *       year; a one-line note states the dates are approximate and the value is the order —
 *       "what did the city do first" as a shared-learning signal.
 *
 * Rendering approach
 *   A connected vertical timeline (one rule, a node per card) that runs achievement cards →
 *   a distinct brand-filled 2030-GOAL node → a final HEALTH-PAYOFF node, all on the SAME spine —
 *   so the whole section reads as one trajectory: what the city did → the shared destination →
 *   the prize for reaching it. Each pillar has a BC-token colour for its node + tag, matching
 *   PillarRadar so timeline and radar read as one system. Colours are BC tokens only (no
 *   hardcoded hex).
 *
 * Key exports: AchievementTimeline (named)
 * External dependencies: react (types), lucide-react (Flag, HeartPulse), ../_data/types
 *   (AchievementCard, PILLAR_BY_ID, PillarId), ./DataSource (payoff-node attribution).
 */

import type { ReactElement } from 'react'
import { Flag, HeartPulse } from 'lucide-react'
import {
  PILLAR_BY_ID,
  type AchievementCard,
  type PillarId,
} from '../_data/types'
import { DataSource } from './DataSource'

/**
 * BC token colour per pillar — MUST match PillarRadar's mapping so the timeline node/tag
 * colour and the radar dot colour are the same hue for a given pillar.
 */
const PILLAR_COLOR_VAR: Readonly<Record<PillarId, string>> = {
  1: 'var(--bc-color-blue)',
  2: 'var(--bc-color-teal)',
  3: 'var(--bc-color-tangerine)',
  4: 'var(--bc-color-green)',
}

/** Props for AchievementTimeline. */
type AchievementTimelineProps = {
  /** The city's achievement cards, authored oldest→newest (the spine of the profile). */
  achievements: AchievementCard[]
  /** City display name — used in the goal node's framing line. */
  cityName: string
  /** The shared 2030 goal headline (trajectory.goalLabel, e.g. "30% cleaner air by 2030"). */
  goalLabel: string
  /** The city's honest stage label (trajectory.stageLabel, e.g. "Early on the journey"). */
  stageLabel: string
  /**
   * The POSITIVE health payoff — estimated months of life the average resident GAINS if the
   * city hits the 30%-by-2030 goal. Computed in the [city] page (AQLI relationship × baseline)
   * and passed in so this component owns presentation only, not the health maths.
   */
  monthsGained: number
  /** Estimated annual-mean PM2.5 baseline (µg/m³) the payoff is computed from — shown as ~N. */
  baselinePm25: number
  /** How many times the WHO PM2.5 guideline the city's air is — the "why it matters now" anchor. */
  whoMultiple: number
  /** Major pollution sources (label + approximate %), shown in the "why it matters now" context. */
  sources: { label: string; sharePct: number }[]
  /** The non-judgemental "starting point, not a pass/fail mark" note (trajectory.stageNote). */
  stageNote: string
}

/**
 * One achievement card on the spine. A small muted YEAR sits above the city-as-actor headline
 * (the hero); the BC credit is a small pillar-coloured "Supported by BC · [pillar]" tag. The
 * pillar colour ties the node, the tag, and the radar together.
 */
function AchievementRow({ card }: { card: AchievementCard }): ReactElement {
  const pillar = PILLAR_BY_ID[card.pillar]
  const color = PILLAR_COLOR_VAR[card.pillar]

  return (
    <li className="relative pl-10">
      {/* Timeline node — sits on the vertical rule, coloured by pillar. */}
      <span
        aria-hidden="true"
        className="absolute left-[11px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background"
        style={{ backgroundColor: color }}
      />

      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        {/* Approximate year — small, muted, above the headline (the spine's ordering signal). */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {card.year}
        </p>

        {/* HERO: the city as actor. */}
        <h3 className="mt-0.5 text-base font-semibold leading-snug text-foreground sm:text-lg">
          {card.headline}
        </h3>

        {card.detail !== undefined && (
          <p className="mt-1.5 text-sm text-muted-foreground">{card.detail}</p>
        )}

        {/* CREDIT: BC support as a small attribution tag — never the hero. The "Supported by
            BC" prefix is literal so the card can never read as "BC did X for the city". */}
        <div className="mt-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              // Tag uses a tint of the pillar colour via color-mix so it stays on-brand and
              // legible in light mode without introducing a hardcoded hex.
              backgroundColor: `color-mix(in srgb, ${color} 14%, var(--bc-color-white))`,
              color: 'var(--bc-semantic-text)',
            }}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            Supported by BC · {pillar.label}
          </span>
        </div>
      </div>
    </li>
  )
}

/**
 * The TERMINAL goal node — the destination the whole spine leads into. Visually distinct from the
 * achievement cards: a brand-filled node + brand-gradient card carrying the shared 2030 goal and
 * the city's honest stage label. It sits on the SAME vertical rule (same pl-10 + node position) so
 * it reads as the end of one trajectory, not a separate section. It is a shared DESTINATION, never
 * a claimed outcome (no metric here — just the goal and where the city is on the way to it).
 */
function GoalNode({
  cityName,
  goalLabel,
  stageLabel,
}: {
  cityName: string
  goalLabel: string
  stageLabel: string
}): ReactElement {
  return (
    <li className="relative pl-10">
      {/* Goal node marker — brand-filled, larger than a card node, with a flag glyph so it reads
          as the destination. Sits on the same rule as the card nodes. */}
      <span
        aria-hidden="true"
        className="absolute left-[6px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background"
        style={{ backgroundColor: 'var(--bc-semantic-brand)' }}
      >
        <Flag
          className="h-3 w-3"
          aria-hidden="true"
          style={{ color: 'var(--bc-color-white)' }}
        />
      </span>

      {/* Goal card — FLAT brand fill (v2 drops v1's diagonal gradient for a solid dark-blue) so
          the destination is unmistakably the brand-owned shared goal, distinct from the white
          achievement cards, while keeping its prominence. White text via inline style var(--bc-*). */}
      <div
        className="rounded-2xl p-6 shadow-sm"
        style={{ backgroundColor: 'var(--bc-color-dark-blue)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'color-mix(in srgb, var(--bc-color-white) 80%, transparent)' }}
        >
          The 2030 goal
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
          The destination every milestone above is building toward — a goal shared across all
          Breathe Cities members.
        </p>
        <p
          className="mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bc-color-white) 20%, transparent)',
            color: 'var(--bc-color-white)',
          }}
        >
          {cityName}: {stageLabel}
        </p>
      </div>
    </li>
  )
}

/**
 * The FINAL node — the health payoff, the prize for reaching the 2030 goal. Sits on the SAME
 * vertical rule immediately AFTER the GoalNode, so the spine reads: actions → shared goal →
 * the prize. Visually it is the POSITIVE counterpart to the goal node: a brand-TINTED (not
 * brand-filled) card so it reads as the upside, not a second destination. It carries:
 *   - the headline payoff (the months of life a resident gains) + the AQLI method line,
 *   - an ESTIMATE pill + the "validate with BC's health team" honesty note + the AQLI·WHO source,
 *   - and, attached WITHIN the node (not a detached section), the light "why it matters now"
 *     current-state grounding: ×WHO multiple, top pollution sources, and the non-judgemental
 *     stage note. The payoff LEADS; the grounding is secondary, inside the same node.
 * Every figure is labelled an estimate — claim the support, never the outcome.
 */
function PayoffNode({
  cityName,
  monthsGained,
  baselinePm25,
  whoMultiple,
  sources,
  stageNote,
}: {
  cityName: string
  monthsGained: number
  baselinePm25: number
  whoMultiple: number
  sources: { label: string; sharePct: number }[]
  stageNote: string
}): ReactElement {
  return (
    <li className="relative pl-10">
      {/* Payoff node marker — brand-tinted ring with a heart-pulse glyph so it reads as the
          human upside of the goal. Same rule + same size as the goal node so the two terminal
          nodes are a matched pair (destination → prize). */}
      <span
        aria-hidden="true"
        className="absolute left-[6px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background"
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bc-semantic-brand) 16%, var(--bc-color-white))',
          color: 'var(--bc-semantic-brand)',
        }}
      >
        <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
      </span>

      {/* Payoff card — brand-TINTED (a wash + border tint of the brand), so it reads as the
          prize rather than a second brand-filled destination. */}
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
          The 2030 prize
        </p>

        {/* HERO: the positive payoff — months of life gained at the 2030 goal. */}
        <p className="mt-2 text-lg font-semibold leading-snug text-foreground sm:text-xl">
          If {cityName} reaches the 2030 goal, the average resident gains about{' '}
          <span className="font-bold" style={{ color: 'var(--bc-semantic-brand)' }}>
            {monthsGained} months of life
          </span>
          .
        </p>

        <p className="mt-3 text-sm text-muted-foreground">
          Estimated via the AQLI life-expectancy relationship applied to a 30% PM2.5 reduction
          (from an estimated baseline of ~{baselinePm25} µg/m³).
        </p>

        {/* Honesty: explicitly an estimate, validation pending with BC's health team. */}
        <div className="mt-4 flex flex-col gap-2">
          <span
            className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--bc-color-yellow) 30%, var(--bc-color-white))',
              color: 'var(--bc-semantic-text)',
            }}
          >
            Estimate
          </span>
          <p className="text-xs text-muted-foreground">
            Prototype estimate — to be validated with BC&rsquo;s health team.
          </p>
          <DataSource
            variant="attribution"
            name="AQLI · WHO"
            href="https://aqli.epic.uchicago.edu"
          />
        </div>

        {/* WHY IT MATTERS NOW — the light current-state grounding, kept WITHIN the payoff node
            (a divided sub-block), not as a detached full-width section. Secondary to the payoff
            above: ×WHO multiple, top sources, and the non-judgemental stage note. */}
        <div
          className="mt-5 border-t pt-4"
          style={{
            borderColor:
              'color-mix(in srgb, var(--bc-semantic-brand) 18%, var(--bc-color-white))',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Why it matters now
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {cityName}&rsquo;s air is around{' '}
            <span className="font-semibold text-foreground">
              {whoMultiple}× the WHO guideline
            </span>
            . Major sources:
          </p>
          <ul className="mt-2 space-y-1">
            {sources.map((source) => (
              <li
                key={source.label}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-muted-foreground">{source.label}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  ~{source.sharePct}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{stageNote}</p>
        </div>
      </div>
    </li>
  )
}

/**
 * The narrative spine. Renders the vertical rule, one AchievementRow per card (in the data's
 * oldest→newest order), then the terminal GoalNode and the final PayoffNode on the same rule —
 * so the spine reads actions → shared 2030 goal → the prize for reaching it. A small "dates
 * approximate" note sits under the spine. Reordering cards changes only display order — the
 * radar (counted elsewhere) is order-independent.
 */
export function AchievementTimeline({
  achievements,
  cityName,
  goalLabel,
  stageLabel,
  monthsGained,
  baselinePm25,
  whoMultiple,
  sources,
  stageNote,
}: AchievementTimelineProps): ReactElement {
  return (
    <div>
      <ol className="relative space-y-4">
        {/* The vertical rule the nodes sit on. Spans from the first card node down THROUGH the
            goal node and INTO the final payoff node, so the cards flow into the destination and
            on into the prize — one continuous spine. */}
        <span
          aria-hidden="true"
          className="absolute left-[17px] top-2 bottom-6 w-px bg-border"
        />
        {achievements.map((card) => (
          <AchievementRow key={card.id} card={card} />
        ))}
        {/* The destination — same spine, distinct brand-filled node. */}
        <GoalNode
          cityName={cityName}
          goalLabel={goalLabel}
          stageLabel={stageLabel}
        />
        {/* The prize — final node on the same spine, immediately after the goal: the positive
            health payoff for reaching it, with the "why it matters now" grounding attached. */}
        <PayoffNode
          cityName={cityName}
          monthsGained={monthsGained}
          baselinePm25={baselinePm25}
          whoMultiple={whoMultiple}
          sources={sources}
          stageNote={stageNote}
        />
      </ol>

      {/* Honest note: the sequence is the signal, the dates are approximate. */}
      <p className="mt-3 pl-10 text-xs text-muted-foreground">
        Dates are approximate — the point is the sequence (what {cityName} did first), a
        shared-learning signal for other cities.
      </p>
    </div>
  )
}
