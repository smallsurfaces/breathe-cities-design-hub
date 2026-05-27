/**
 * page.tsx — AQ Network v2 member profile, dynamic route /ux-concepts/aq-network-v2/[city].
 *
 * Purpose
 *   The single page that renders ANY city's AQ Network profile ("an AQ LinkedIn CV for a
 *   BC member city"). It reads one CityProfile from the registry and composes the profile
 *   sections from it — so adding the next city (London) is a data-only add (one data file +
 *   one registry line), with NO change to this file or its components.
 *
 *   This is the ORCHESTRATOR. The one piece of real logic it owns is the concept's central
 *   rule: the support radar is DERIVED from the timeline, not authored. pillarCounts() below
 *   counts the achievement cards per RADAR pillar and feeds those counts to PillarRadar. There
 *   is no "radar score" anywhere in the data — a light pillar simply means fewer support cards
 *   under that pillar, which is the honest picture. The radar plots only the THREE city-level
 *   support pillars; lesson sharing (BC pillar 4) is relational and gets its own strand
 *   (section 3b), not a radar axis.
 *
 * Sections (in order):
 *   1. Identity header — name, region, "Breathe Cities member" badge, strapline.
 *   2. Sensors & coverage — the interactive SENSOR-GROWTH MAP (the concept centrepiece), moved
 *      directly under the identity header: a light basemap with markers by sensor TYPE
 *      (reference vs low-cost, not air quality), a timeline scrubber + Play control driving
 *      sensor existence over time, and three scrubber-linked counters (sensors deployed ·
 *      districts covered · people within range — the last an estimate). Renders from a committed
 *      OpenAQ snapshot, never a per-load API call. Carries a DataSource (OpenAQ + raw-data redirect).
 *   3. Achievements — the NARRATIVE SPINE: the achievement timeline (oldest → newest) culminating
 *      in a terminal 2030-GOAL node and then a final HEALTH-PAYOFF node on the same spine (actions
 *      → shared destination → the prize for reaching it) + the "Latest from [city]" live-news strip
 *      (DataSource → Breathe Cities), alongside the DERIVED three-pillar radar ("How Breathe Cities
 *      supports [city]" — a programme scorecard, not a city grade, from the city-level support
 *      pillars only). Timeline + radar are one block. The payoff figures (months gained, baseline,
 *      ×WHO, sources, stage note) are computed/resolved here and passed into <AchievementTimeline>.
 *   4. Lessons learned — the city's peer-network participation strand (gave/received). NOT on
 *      the radar; an early-learner city renders an honest near-empty state.
 *   (The health payoff is NO LONGER a standalone section. It is the POSITIVE, LOCALISED prize of
 *    reaching the 2030 goal — the life-expectancy a resident GAINS, in months, under the AQLI
 *    relationship applied to a 30% PM2.5 reduction — and now renders as the FINAL node on the
 *    achievement spine in section 3, immediately after the 2030 goal node, with the light
 *    "why it matters now" grounding (×WHO + top sources + stage note) attached within that node.
 *    Every figure is labelled an estimate with its method + source. This subsumes the former
 *    standalone "The 2030 journey" / "The payoff for [city]" sections.)
 *   (The former standalone "Population within sensor range" section was folded into the Sensors
 *    & coverage counters — population belongs under Sensors & coverage.)
 *
 * Chrome: provided by aq-network/layout.tsx — the PrototypeHeader (back-to-hub + comments +
 *   "Updated" stamp) AND the BcHeader/BcFooter site nav. This page no longer renders its own
 *   PrototypeHeader (it would duplicate the layout's). Theme: light (the repo default; Jack's
 *   standing preference). No emoji anywhere.
 *
 * Key exports: default page component, generateStaticParams, generateMetadata.
 * External dependencies: next (notFound, Metadata), lucide-react (icons), the registry +
 *   types in ../_data, the sensor-snapshot loader in ../_data/sensor-snapshots, and the
 *   section components in ../_components. SensorGrowthMap is a client component (it owns a
 *   Mapbox map); everything else here is server-rendered. Chrome is owned by
 *   aq-network/layout.tsx.
 *
 * Route: /ux-concepts/aq-network-v2/[city]
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BadgeCheck, MapPin } from 'lucide-react'
import {
  getCityProfile,
  CITY_PROFILE_SLUGS,
} from '../_data/cities'
import {
  RADAR_PILLARS,
  type CityProfile,
  type RadarPillarId,
} from '../_data/types'
import { PillarRadar } from '../_components/PillarRadar'
import { AchievementTimeline } from '../_components/AchievementTimeline'
import { LessonSharing } from '../_components/LessonSharing'
import { SensorGrowthMap } from '../_components/SensorGrowthMap'
import { DataSource } from '../_components/DataSource'
import { InfoTooltip } from '@/components/concept'
import { getSensorSnapshot } from '../_data/sensor-snapshots'

/**
 * AQLI life-expectancy relationship: each 1 µg/m³ of long-term PM2.5 costs roughly 0.098 years
 * of life expectancy (~1 year per 10 µg/m³). This is the Air Quality Life Index relationship
 * (Ebenstein et al.; aqli.epic.uchicago.edu), used here to turn a city's PM2.5 baseline into the
 * POSITIVE payoff of the 2030 goal: the life a resident GAINS if the city cuts PM2.5 by 30%.
 * It is an ESTIMATE — a population-average relationship applied to a target reduction, not a
 * measured outcome. The UI labels the result an estimate and shows the method.
 */
const LIFE_YEARS_LOST_PER_UGM3 = 0.098

/** The shared collective goal: a 30% PM2.5 reduction by 2030 (the fraction the payoff applies). */
const GOAL_PM25_REDUCTION = 0.3

/**
 * Estimate the life-expectancy a resident GAINS, in MONTHS, if the city hits the 30%-by-2030
 * goal. gain(years) = baselinePm25 × 30% reduction × AQLI years-lost-per-µg/m³; ×12 for months,
 * rounded to a whole month. Pure function of the (estimated) baseline — see the constants above
 * for the relationship and its provenance. Returns an integer count of months.
 */
function lifeMonthsGained(baselinePm25: number): number {
  const gainYears = baselinePm25 * GOAL_PM25_REDUCTION * LIFE_YEARS_LOST_PER_UGM3
  return Math.round(gainYears * 12)
}

/**
 * DERIVE the per-pillar counts from the achievement timeline — the concept's central rule.
 * Counts cards under each of the THREE radar pillars only (1 Expanding data, 2 Technical
 * support, 3 Raising awareness). Cards tagged pillar 4 (Lesson sharing) are intentionally
 * NOT counted here — lesson sharing is shown as its own participation strand, not a radar
 * axis. A radar pillar with no cards comes back 0 (a light axis). This is the ONLY source the
 * radar uses; nothing in the data authors a score.
 */
function pillarCounts(
  profile: CityProfile,
): Readonly<Record<RadarPillarId, number>> {
  const counts: Record<RadarPillarId, number> = { 1: 0, 2: 0, 3: 0 }
  for (const card of profile.achievements) {
    // Only the three radar pillars contribute to the radar. Pillar 4 (lesson sharing) is
    // a valid card tag but is surfaced in the LessonSharing strand, never on the radar.
    if (card.pillar === 1 || card.pillar === 2 || card.pillar === 3) {
      counts[card.pillar] += 1
    }
  }
  return counts
}

/**
 * Pre-render the known city routes at build time. Reads the registry so a newly-registered
 * city is statically generated automatically — no edit here when adding a city.
 */
export function generateStaticParams(): { city: string }[] {
  return CITY_PROFILE_SLUGS.map((slug) => ({ city: slug }))
}

/** Per-city <title>. Resolves the profile so an unknown slug still gets a sensible title. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const profile = getCityProfile(city)
  return {
    title:
      profile !== undefined
        ? `${profile.name} — AQ Network v2 (concept)`
        : 'AQ Network v2 (concept)',
  }
}

/**
 * The member profile page. Resolves the [city] slug to a CityProfile (404 if unknown), derives
 * the radar counts and the health-payoff estimate, and renders the profile sections from the
 * data, in order: identity → sensors & coverage → achievements spine (+ goal node + payoff node
 * + radar) → lessons learned. The positive 2030 health payoff is the final node on the spine,
 * not a separate section.
 */
export default async function AqNetworkCityProfile({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const profile = getCityProfile(city)

  // Unknown slug → 404. The registry is the single source of which cities exist.
  if (profile === undefined) {
    notFound()
  }

  const counts = pillarCounts(profile)

  // The committed OpenAQ sensor snapshot for this city (positions + type + per-year growth +
  // map framing). Keyed by the same openaqCitySlug the profile uses. May be undefined for a
  // city whose snapshot hasn't been captured yet — the section renders a graceful fallback.
  const sensorSnapshot = getSensorSnapshot(profile.sensorProgramme.openaqCitySlug)

  // The POSITIVE health payoff: estimated months of life a resident gains if the city hits the
  // 30%-by-2030 goal, via the AQLI relationship applied to the city's (estimated) PM2.5 baseline.
  // An estimate, labelled as such in the UI. (Accra ≈ 10 months, London ≈ 4 months.)
  const monthsGained = lifeMonthsGained(profile.baselinePm25)

  return (
    // Chrome (PrototypeHeader + BcHeader/BcFooter) is rendered by aq-network/layout.tsx.
    <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          {/* ── 1. Identity header ─────────────────────────────────────────── */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {profile.name}
              </h1>
              {profile.isMember && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--bc-semantic-brand) 14%, var(--bc-color-white))',
                    color: 'var(--bc-semantic-brand)',
                  }}
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Breathe Cities member
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {profile.region}
            </div>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {profile.strapline}
            </p>
          </header>

          {/* ── 2. Sensors & coverage — the interactive sensor-growth map (the concept's
                  centrepiece), moved up to sit directly under the identity header. Scrub the
                  timeline (or hit Play) to watch the network grow; markers are styled by sensor
                  TYPE (reference vs low-cost), not air quality. The three counters (sensors /
                  districts / people in range) move with the scrubber — the population-in-range
                  figure (an estimate) lives here now. Renders from a one-time OpenAQ snapshot,
                  never a per-load API call. */}
          <section className="mt-14">
            {/* Heading + an "i" info affordance. The descriptive sub-line ("How [city]'s sensor
                network was built — scrub the timeline… Markers show each sensor by type…") was
                HIDDEN this pass (purely descriptive). The OpenAQ provenance/attribution is KEPT
                but moved behind the "i" tooltip (load-bearing for data-attribution-traceability). */}
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Sensors &amp; coverage
              </h2>
              <InfoTooltip label="Sensor data source">
                <span className="flex flex-col gap-1">
                  <span>Source: OpenAQ.</span>
                  <span>For raw sensor data, see OpenAQ (openaq.org).</span>
                </span>
              </InfoTooltip>
            </div>
            <div className="mt-6">
              {sensorSnapshot !== undefined ? (
                <SensorGrowthMap snapshot={sensorSnapshot} />
              ) : (
                // Graceful fallback: a city profile may exist before its snapshot is captured.
                <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                  Sensor-growth map for {profile.name} is not available yet.
                </div>
              )}
            </div>
          </section>

          {/* ── 3. Achievements — the timeline (spine) alongside the derived radar. Kept
                  together as one block per the brief. ─────────────────────────────── */}
          <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Timeline + news strip */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Achievements
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                What {profile.name} is doing to clean its air — each milestone is the
                city acting, with Breathe Cities support credited as a tag.
              </p>

              {/* The narrative spine: oldest action → … → the 2030 goal node → the health-payoff
                  node (the prize for reaching the goal). All rendered on one spine by the timeline
                  component; the payoff figures are computed here and passed in. */}
              <div className="mt-6">
                <AchievementTimeline
                  achievements={profile.achievements}
                  cityName={profile.name}
                  goalLabel={profile.trajectory.goalLabel}
                  stageLabel={profile.trajectory.stageLabel}
                  monthsGained={monthsGained}
                  baselinePm25={profile.baselinePm25}
                  whoMultiple={profile.health.whoMultiple}
                  sources={profile.health.sources}
                  stageNote={profile.trajectory.stageNote}
                />
              </div>

              {/* "Latest from [city]" — the always-fresh live-news layer (snapshot here). */}
              <div className="mt-8">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Latest from {profile.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Live-news layer (snapshot in this prototype)
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {profile.latestNews.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.date} · {item.source}
                      </p>
                    </li>
                  ))}
                </ul>
                {/* Attribution for the news layer — the live feed is sourced from Breathe Cities. */}
                <DataSource
                  variant="attribution"
                  name="Breathe Cities"
                  href="https://breathecities.org"
                  className="mt-3"
                />
              </div>
            </div>

            {/* The derived three-pillar radar (programme scorecard, not a city grade). Plots
                the three city-level support pillars; lesson sharing has its own strand below. */}
            <aside className="lg:pt-1">
              <div className="rounded-2xl border border-border bg-background p-5 lg:sticky lg:top-20">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  How Breathe Cities supports {profile.name}
                </h2>
                {/* Descriptive scorecard explainer ("A programme scorecard across BC's three
                    pillars… A lighter pillar means less support focus there — not a judgement of
                    the city.") was HIDDEN this pass — purely descriptive, not load-bearing. */}

                <div className="mt-4 flex justify-center">
                  <PillarRadar counts={counts} />
                </div>

                {/* Pillar legend — the THREE radar pillars only (lesson sharing is shown as
                    its own strand below, not on this scorecard). Full labels + derived count
                    tie the radar to the cards. */}
                <ul className="mt-4 space-y-1.5">
                  {RADAR_PILLARS.map((pillar) => {
                    const id = pillar.id as RadarPillarId
                    return (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: {
                                1: 'var(--bc-color-blue)',
                                2: 'var(--bc-color-teal)',
                                3: 'var(--bc-color-tangerine)',
                              }[id],
                            }}
                          />
                          {pillar.label}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {counts[id]}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </aside>
          </section>

          {/* ── 4. Lessons learned — peer-network participation strand (NOT on the radar).
                  Lesson sharing is BC pillar 4 but relational, so it gets its own section
                  rather than a radar axis. Two directions: shared with / learned from peers.
                  (Heading reads "Lessons learned"; the gave/received content is unchanged.) */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Lessons learned
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              How {profile.name} takes part in the Breathe Cities peer network — the lessons
              it shares with other cities and the approaches it learns from them. This is
              network participation, not a score.
            </p>
            <div className="mt-6">
              <LessonSharing
                cityName={profile.name}
                entries={profile.lessonSharing}
              />
            </div>
          </section>

          {/* The health payoff is no longer a standalone section here. It now renders as the
              FINAL node on the achievement spine (section 3), immediately after the 2030 goal
              node — see <AchievementTimeline>, which receives monthsGained + the baseline/WHO/
              sources/stageNote it needs as props. The "why it matters now" grounding is attached
              within that payoff node, not as a detached full-width section. The compute logic
              (lifeMonthsGained, AQLI constant) still lives in this orchestrator. */}

          {/* The former standalone "People within sensor range" section was removed: the
              population-in-range figure now lives inside the Sensors & coverage map as one of
              the three scrubber-linked counters (per the brief — it belongs under Sensors &
              coverage). profile.populationInRange still feeds the snapshot's present-day
              calibration; it is no longer rendered as its own section. */}
        </div>
      </main>
  )
}
