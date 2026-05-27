/**
 * types.ts — the CityProfile data model for the AQ Network concept.
 *
 * Purpose
 *   AQ Network gives each Breathe Cities member city a city-authored profile (think
 *   "an AQ LinkedIn CV for a BC member city"). This file is the single shared shape
 *   every city profile conforms to. The dynamic route /ux-concepts/aq-network/[city]
 *   renders ONLY from a CityProfile, so adding the next city (e.g. London) is a
 *   data-only add — one new data file + one registry line — with NO new components.
 *
 *   The whole concept rests on a few hard framing rules, and the TYPES encode them so
 *   the data can't drift from the concept:
 *     - City is the hero, BC is the credit. An achievement is the CITY acting, with BC
 *       support as an attribution tag — never "BC did X for Accra". Hence
 *       AchievementCard.headline is written city-as-actor and the BC link is carried
 *       separately as a `pillar` tag + the literal "Supported by BC" label rendered by
 *       the UI (see AchievementCard).
 *     - Claim support, never outcomes. BC-support ACTIVITIES are attributable to the
 *       programme; pollution-reduction OUTCOMES (if any) are the city's, city-wide, and
 *       are NOT modelled as BC achievements. Early-journey cities (Accra) simply have no
 *       outcome claims — that is honest, not a gap to fill.
 *     - The radar is DERIVED from the timeline, never authored. There is deliberately no
 *       "radar score" field on CityProfile: pillar strength is COUNTED from the cards at
 *       render time (see pillarCounts in the route). A light pillar means "less BC support
 *       focus here", never "the city is bad".
 *
 * Key exports:
 *   - PillarId, PILLARS, PILLAR_BY_ID — BC's official four-pillar system (exact labels)
 *   - RadarPillarId, RADAR_PILLAR_IDS, RADAR_PILLARS — the THREE city-level support pillars
 *     the radar plots/derives (lesson sharing is deliberately excluded — see note below)
 *   - LessonSharingEntry — one row in the peer-network participation strand
 *   - AchievementCard, NewsItem, SensorProgramme, HealthContext, PopulationEstimate,
 *     TrajectoryContext, CityProfile
 *
 * External dependencies: none (pure type + small const module).
 */

// ----------------------------------------------------------------------------
// BC's four pillars — the official system. Use these EXACT four, in this order.
// ----------------------------------------------------------------------------

/**
 * Stable identifier for one of BC's four support pillars.
 *
 * NOTE on pillar 4 (Lesson sharing): all four pillars remain valid as card tags — a card
 * can still be tagged pillar 4. But pillar 4 is NOT a radar axis. Lesson sharing is
 * relational (city-to-city) rather than a city-level support intensity, so it is surfaced
 * as its own participation strand (see LessonSharingEntry / CityProfile.lessonSharing) and
 * the radar plots only the three CITY-LEVEL support pillars (see RadarPillarId below).
 */
export type PillarId = 1 | 2 | 3 | 4

/** One BC support pillar: its id, full label, and a short label for tight UI (tags/axes). */
export type Pillar = {
  id: PillarId
  /** The full, official pillar label — rendered verbatim (never paraphrased). */
  label: string
  /** A compact label for radar axes and dense tags where the full label won't fit. */
  shortLabel: string
}

/**
 * BC's official four pillars, in canonical order. This is the ONLY place the pillar
 * labels are defined; every tag, axis, and legend reads from here so wording can never
 * drift between the cards and the radar.
 */
export const PILLARS: readonly Pillar[] = [
  { id: 1, label: 'Expanding data', shortLabel: 'Data' },
  { id: 2, label: 'Technical support for policymaking', shortLabel: 'Policy' },
  { id: 3, label: 'Raising awareness', shortLabel: 'Awareness' },
  { id: 4, label: 'Lesson sharing', shortLabel: 'Lessons' },
] as const

/** Look up a pillar by id. Index-safe: PILLARS is ordered 1..4 so id-1 is the row. */
export const PILLAR_BY_ID: Readonly<Record<PillarId, Pillar>> = {
  1: PILLARS[0],
  2: PILLARS[1],
  3: PILLARS[2],
  4: PILLARS[3],
}

// ----------------------------------------------------------------------------
// The radar's pillars — the THREE city-level support pillars only.
// ----------------------------------------------------------------------------

/**
 * The subset of pillars the radar plots and derives counts for: the three CITY-LEVEL
 * support pillars (1 Expanding data, 2 Technical support for policymaking, 3 Raising
 * awareness). Pillar 4 (Lesson sharing) is intentionally absent — it is relational
 * (city-to-city) and is shown as its own participation strand, not a radar axis. Cards may
 * still be tagged pillar 4; it is simply not an axis.
 */
export type RadarPillarId = 1 | 2 | 3

/** The three radar pillar ids, in axis order (pillar 1 at top, then clockwise). */
export const RADAR_PILLAR_IDS: readonly RadarPillarId[] = [1, 2, 3] as const

/**
 * The three radar pillars (full Pillar objects), in axis order. Derived from PILLARS so the
 * labels can never drift from the canonical list. The radar legend and axes read from here.
 */
export const RADAR_PILLARS: readonly Pillar[] = RADAR_PILLAR_IDS.map(
  (id) => PILLAR_BY_ID[id],
)

// ----------------------------------------------------------------------------
// Profile building blocks
// ----------------------------------------------------------------------------

/**
 * One achievement on the city's timeline — the core unit of the profile.
 *
 * Framing contract (enforced by how this is rendered, see AchievementCard):
 *   - `headline` is the CITY as actor ("Accra deployed 67 sensors…"). It must read as
 *     the city doing the thing; BC is credited only via the `pillar` tag + the
 *     "Supported by BC" label the card adds. Never write "BC did X" in a headline.
 *   - `pillar` is which BC pillar this support sits under — this is also the single
 *     source the radar counts. Exactly one pillar per card (a card represents one
 *     support activity).
 *   - `detail` is optional supporting context (still city-as-actor, still support not
 *     outcome).
 */
export type AchievementCard = {
  /** Stable key for React lists and for any future deep-link to a single achievement. */
  id: string
  /** City-as-actor headline. e.g. "Accra deployed 67 air-quality sensors across 13 districts". */
  headline: string
  /** Optional supporting line — still support-framed, still city-as-actor. */
  detail?: string
  /** The single BC pillar this support activity sits under. The radar counts these. */
  pillar: PillarId
  /**
   * APPROXIMATE year this action began — the journey-spine ordering key. The point of the
   * spine is the SEQUENCE ("what did the city do first") as a shared-learning signal, not a
   * precise dated record: these years are estimates inferred from each card's content, and
   * the UI says so. Cards are authored oldest→newest; the timeline displays the year (small,
   * muted) and renders a one-line "dates are approximate" note. Ordering is purely a display
   * concern — it does NOT affect the radar, which counts pillars order-independently.
   */
  year: number
}

/**
 * One entry in the lesson-sharing participation strand — the city's role in the BC peer
 * network. Lesson sharing (BC pillar 4) is relational: cities teach and learn from each
 * other. Rather than collapse that into a radar axis, the strand captures it directly as a
 * two-direction list.
 *
 * Framing contract (city-as-actor, same as achievements):
 *   - `direction: 'gave'` = the city was the TEACHER (shared a playbook, mentored/hosted a
 *     peer, presented at a forum). `direction: 'received'` = the city was the LEARNER
 *     (adopted a peer's approach, joined an exchange).
 *   - `headline` reads as the city doing the thing ("Accra adopted …", "London shared …").
 *   - `peerCity` is the OTHER city in the exchange when there is a specific one (optional —
 *     some entries, e.g. presenting at a forum, have no single peer).
 *   - HONESTY: never fabricate a peer claim. An early-learner city with no documented
 *     exchanges simply has an empty list; the UI renders an honest early-stage state.
 */
export type LessonSharingEntry = {
  /** Stable key for React lists. */
  id: string
  /** 'gave' = city as teacher/sharer; 'received' = city as learner/adopter. */
  direction: 'gave' | 'received'
  /** City-as-actor headline for this exchange. */
  headline: string
  /** The other city in the exchange, when there is a specific one. Optional. */
  peerCity?: string
  /** Short date/period label (e.g. "Mar 2026"). Optional — some entries are undated. */
  date?: string
}

/**
 * One item in the "Latest from Accra" live-news strip — the always-fresh layer concept.
 * In this slice these are curated snapshot placeholders, clearly labelled as the
 * live-news layer in the UI. A later slice can swap the source for a real feed without
 * changing the type.
 */
export type NewsItem = {
  id: string
  /** Headline of the news item (city-centric). */
  title: string
  /** Short ISO-ish date or period label shown beside the item (e.g. "May 2026"). */
  date: string
  /** Where it came from — shown as light attribution. */
  source: string
}

/**
 * The sensor PROGRAMME figures (curated snapshot) vs what is LIVE on OpenAQ right now.
 * The honesty of this section is the whole point: the programme number (e.g. 67 deployed)
 * is a real BC-supported deployment figure; the live number is fetched at render time and
 * is expected to be much smaller (live Accra coverage on OpenAQ is sparse). Showing the
 * gap is correct — never a bug.
 */
export type SensorProgramme = {
  /** Programme deployment count — the real BC-supported figure (e.g. 67). */
  deployedCount: number
  /** Districts the programme spans (e.g. 13). */
  districtsCount: number
  /** The OpenAQ city-registry slug used to fetch the LIVE count (must exist in lib/openaq/cities). */
  openaqCitySlug: string
  /** One honest sentence the UI shows to frame the deployed-vs-live gap. */
  liveCoverageNote: string
}

/**
 * Problem + (hypothetical) health context for the city. The health line is explicitly a
 * PROJECTION ("could prevent ~N deaths/year if WHO guidelines were met"), never an
 * achievement — the type names it `hypotheticalDeathsPreventedPerYear` so it can't be
 * mistaken for a claimed outcome, and the UI labels it as a projection.
 */
export type HealthContext = {
  /** How many times the WHO PM2.5 guideline the city's air is (e.g. 4 for "~4x WHO"). */
  whoMultiple: number
  /** Major sources as label + approximate share (e.g. {label:'Transport', sharePct:40}). */
  sources: { label: string; sharePct: number }[]
  /**
   * HYPOTHETICAL annual deaths preventable IF the city met WHO guidelines. A projection
   * for context, not an outcome the city or BC has achieved. The UI must label it so.
   */
  hypotheticalDeathsPreventedPerYear: number
}

/**
 * Population estimated to live within range of the sensor network. This is a GUESSTIMATE
 * (no real dataset yet) — the type carries an explicit flag and the UI must render an
 * "estimate" label. We never present a guesstimate as a measured figure.
 */
export type PopulationEstimate = {
  /** The guesstimated number of people within sensor range. */
  approxPeople: number
  /** Always true in this slice — forces the UI to show the "estimate" label. */
  isEstimate: true
  /** One line explaining the basis of the guess, shown as fine print. */
  basisNote: string
}

/**
 * The collective 2030 trajectory context. Accra is framed as EARLY on the journey — not
 * pass/fail. There is no city "score" here; just the shared goal and an honest stage label.
 */
export type TrajectoryContext = {
  /** The shared BC goal headline (e.g. "30% cleaner air by 2030"). */
  goalLabel: string
  /** The baseline year the goal is measured against (e.g. 2019). */
  baselineYear: number
  /** Honest stage framing — e.g. "Early on the journey". NOT a grade. */
  stageLabel: string
  /** A sentence elaborating the stage framing (non-judgemental). */
  stageNote: string
}

/**
 * A complete city profile — everything the dynamic route needs to render one member's
 * AQ Network page. Adding a city = author one of these + register it. No component edits.
 */
export type CityProfile = {
  /** URL slug for the dynamic route (/ux-concepts/aq-network/[slug]). */
  slug: string
  /** Display name (e.g. "Accra"). */
  name: string
  /** Region label for the identity header (e.g. "Africa"). */
  region: string
  /**
   * Whether the city is a Breathe Cities member — drives the membership badge. Modelled
   * as a flag (not assumed) so a future non-member comparison page stays type-honest.
   */
  isMember: boolean
  /** One-line identity strapline shown under the name. */
  strapline: string
  /** The achievement timeline — the spine of the profile. Order = display order. */
  achievements: AchievementCard[]
  /**
   * The lesson-sharing participation strand — the city's role in the BC peer network
   * (BC pillar 4, surfaced here rather than on the radar). Two directions, gave/received.
   * May be empty for an early-learner city with no documented exchanges (Accra) — that is
   * honest, and the UI renders an early-stage state rather than fabricating peer claims.
   */
  lessonSharing: LessonSharingEntry[]
  /** The always-fresh "Latest from [city]" strip (curated snapshot in this slice). */
  latestNews: NewsItem[]
  /** Sensor programme figures + the OpenAQ slug for the live count. */
  sensorProgramme: SensorProgramme
  /** Problem + hypothetical health context. */
  health: HealthContext
  /** Guesstimated population within sensor range. */
  populationInRange: PopulationEstimate
  /** Collective 2030 trajectory + honest stage framing. */
  trajectory: TrajectoryContext
  /**
   * APPROXIMATE annual-mean PM2.5 in µg/m³ — the input to the positive health payoff on the
   * profile (the life-expectancy months a resident gains if the city hits the 30%-by-2030
   * goal). This is an ESTIMATE drawn from OpenAQ / WHO city air-quality data, not a measured
   * project figure; the UI labels the resulting number an estimate and shows the method. See
   * LIFE_YEARS_LOST_PER_UGM3 in the [city] page for the AQLI relationship applied to it.
   */
  baselinePm25: number
}
