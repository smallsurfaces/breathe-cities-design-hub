/**
 * concerns-data.ts — Resident Concerns prototype content model
 *
 * Purpose: static, authored content for the "Resident Concerns" global-site UX
 * concept. A deck of cards organised by resident/community concern, presented to
 * city officials as: "These are the concerns of your residents — and here's what
 * peer cities have done about each."
 *
 * Five concerns (locked set, Jack 2026-05-23), each with its OWN fan-out axis:
 *   - "Who's polluting my neighbourhood?"        fans by SOURCE  (coal, traffic, cooking…)
 *   - "Is the air safe for my kids?"             fans by SETTING / LEVER (school air, commute, home…)
 *   - "I know it's bad — what can I do?"         fans by ACTION  (protect yourself / change the system)
 *   - "Which part of my city has the worst air?" fans by PLACE   (neighbourhood / sub-city)
 *   - "Why won't anyone make the polluters stop?" fans by ACTOR  (city gov / regulator / national gov)
 *
 * Concern→answer-fit rule (critical): each card's evidence MUST answer the question
 * its concern actually asks. Under "safe for my kids" we use school-zone air /
 * children's-exposure / asthma evidence — NEVER a generic city-wide PM2.5 drop.
 * The same rule binds the three new axes:
 *   - ACTION cards are PROVEN RESPONSES — a real lever a peer city PROVIDED that a
 *     resident can take up (protect-yourself), or a real civic action that worked
 *     and that residents can push for (change-the-system). Not generic progress.
 *   - PLACE cards demonstrate the NEIGHBOURHOOD-COMPARISON structure. The global
 *     site is mostly city-average; real per-neighbourhood numbers are thin, so each
 *     card carries the REAL sub-city sensing INFRASTRUCTURE a city has (what makes
 *     the comparison possible) and renders every actual neighbourhood reading as a
 *     [TK] — we never fabricate a neighbourhood figure. (Caveat: Jack 2026-05-23.)
 *   - ACTOR cards answer "who must act" with a real peer city that held a polluter
 *     accountable or enacted ENFORCEMENT — a ban, a charge, a binding programme.
 *     Accountability framing, never individual behaviour.
 *
 * Cross-cutting answer-style steer (from research, Oni Theme 4): frame "is it safe?"
 * answers as graduated / situational ("given your situation, here's what to do"),
 * NOT binary safe/unsafe. Honoured by construction across the deck — ACTION is
 * inherently situational, PLACE answers "where you are" not a verdict, ACTOR reframes
 * to accountability.
 *
 * EVIDENCE DISCIPLINE — read before editing:
 *   - BC family cities ONLY (here: Warsaw, London, Bangkok).
 *   - NEVER fabricate a figure. Every numeric/policy claim traces to a research file
 *     (see `source` on each card). Where the evidence has a genuine gap, the field is
 *     a Placeholder (`{ tk: "..." }`) rendered as a visible [figure TK] chip — never
 *     an invented number.
 *   - No per-intervention health attribution. City-wide −% trend figures (e.g. Warsaw
 *     −46% PM2.5) are city TRAJECTORY context only, never presented as a card's outcome.
 *     This mirrors BC's own published methodology (the Breathe Better report explicitly
 *     declines single-intervention attribution).
 *
 * ENTRY-CARD STAT DISCIPLINE — the data-viz layer (added 2026-05-23):
 *   Each card carries a compact `stat` for the scannable entry-card grid. The stat is
 *   the card's single most representative REAL number, lifted from its own detail below.
 *   It obeys the SAME no-fabrication rule as `outcome`:
 *     - kind "progression"  → before → after, BOTH values real (e.g. London NO2 −21%).
 *       Only used where the evidence actually contains a before→after movement.
 *     - kind "figure"       → one real achieved figure / share (e.g. "3,500+ schools",
 *       "~65% of winter PM10"). Used where the evidence has a real number but NOT a
 *       published before→after pair — we do NOT invent a target year or "→ X%" to
 *       manufacture a progression that isn't in the evidence.
 *     - kind "tk"           → a styled [TK] placeholder where there is no real headline
 *       number yet. Same visible-gap honesty as the outcome placeholders.
 *   Cautionary tale honoured: Warsaw coal ~65% is a real SHARE, not a "65% → 25% by
 *   2030" target — no such coal target exists in the evidence, so we render the share
 *   as a `figure`, never a fabricated progression.
 *
 * Sources (files under design/globalsite/concepts/best-practice-roadmap/):
 *   [R1] city-initiatives-research.md          (London)
 *   [R2] city-initiatives-research-2.md         (Warsaw, Bangkok)
 *   [R3] breathe-better-report-domain-mapping.md
 *   [R4] city-sensor-ownership.md
 *   [R5] brief.md (BC published anchors: 30%-by-2030; 55K deaths / $147B; 10,000+ children asthma)
 *
 * Key exports: CONCERNS, CITIES, concernByKey, citiesWithAnswersFor,
 *   type Concern, type ConcernCard, type CityKey, type City
 *
 * Concern-centric note (restructure 2026-05-25): the concept is now organised by
 * CONCERN, not by city. The per-city localisation map (CITY_LEAD_FACET) and the
 * city switcher it drove have been retired — the concern is the organising unit,
 * so the deck no longer reorders per active city. The cards remain tagged by city
 * (`card.city`); concern pages group them with `citiesWithAnswersFor`.
 */

/** The three BC-family cities this prototype covers. */
export type CityKey = "warsaw" | "london" | "bangkok";

export interface City {
  key: CityKey;
  name: string;
  country: string;
  populationLabel: string;
  /** One-line characterisation of the city's dominant source/lever mix. */
  mix: string;
  /**
   * City-wide trajectory context — used ONLY as a "where the city is heading"
   * caption, never as a per-card outcome. `null` where no published city-wide
   * BC figure exists for this city (Bangkok), to avoid implying one.
   */
  trajectory: string | null;
  trajectorySource: string | null;
}

export const CITIES: City[] = [
  {
    key: "warsaw",
    name: "Warsaw",
    country: "Poland",
    populationLabel: "1.8M",
    mix: "Coal & solid-fuel home heating leads the winter pollution mix.",
    // [R3] Breathe Better report city-wide trend, 2010→2024, population-weighted.
    trajectory: "−46% PM2.5 city-wide (2010–2024) — the largest cut of any Breathe City.",
    trajectorySource: "[R3] breathe-better-report-domain-mapping.md",
  },
  {
    key: "london",
    name: "London",
    country: "United Kingdom",
    populationLabel: "9.0M",
    mix: "Road transport dominates — roughly half of the city's NOx.",
    // [R3] city-wide trend.
    trajectory: "−28% PM2.5 city-wide (2010–2024) on the path to 30% by 2030.",
    trajectorySource: "[R3] breathe-better-report-domain-mapping.md",
  },
  {
    key: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    populationLabel: "10.5M",
    mix: "Traffic, industrial combustion and seasonal burning drive the mix.",
    // No published city-wide BC trend figure for Bangkok — kept null deliberately.
    // (Programme is mostly recent pilots; no city-scale before→after trend in evidence.)
    trajectory: null,
    trajectorySource: null,
  },
];

/** A placeholder for a field where the evidence genuinely has a gap. */
export interface Placeholder {
  tk: string;
}

export function isPlaceholder(v: unknown): v is Placeholder {
  return typeof v === "object" && v !== null && "tk" in v;
}

/**
 * Semantic icon key for an entry card. Maps to a lucide-react icon in the
 * EntryCard component (kept out of the data layer so the data stays
 * presentation-agnostic). One key per source/setting facet.
 */
export type IconKey =
  // "who's polluting" — sources
  | "coal"
  | "factory"
  | "car"
  | "cooking"
  | "dust"
  // "safe for my kids" — settings
  | "school"
  | "commute"
  | "home"
  | "data"
  // "what can I do?" — ACTION (protect yourself / change the system)
  | "route" // a clean-air route / protective tool
  | "grants" // a subsidy/grant a resident can take up
  | "campaign" // a civic campaign residents drove
  // "which part of my city?" — PLACE (neighbourhood / sub-city)
  | "place" // neighbourhood-level comparison
  // "make the polluters stop?" — ACTOR (who must act)
  | "cityGov" // city government acted (enforcement)
  | "regulator" // a regulator / law banned or charged the polluter
  | "national"; // national government forcing function

/**
 * The compact headline stat shown on an entry card. Three honest shapes:
 *   - progression: before → after, BOTH real (only where the evidence has a movement)
 *   - figure:      one real achieved figure / share (no fabricated target)
 *   - tk:          a styled [TK] placeholder where no real headline number exists yet
 * See ENTRY-CARD STAT DISCIPLINE in the file header.
 */
export type EntryStat =
  | {
      kind: "progression";
      /** The starting value, e.g. "50% of NOx" or "Coal-led". */
      from: string;
      /** The achieved/target value, e.g. "−21%". Real, never invented. */
      to: string;
      /** Tiny caption under the viz, e.g. "roadside NO₂". */
      metric: string;
    }
  | {
      kind: "figure";
      /** A single real figure or share, e.g. "3,500+" or "~65%". */
      value: string;
      /** Tiny caption, e.g. "schools enrolled" or "of winter PM10". */
      metric: string;
    }
  | {
      kind: "tk";
      /** Tiny caption naming what the figure WOULD be, e.g. "per-source split". */
      metric: string;
    };

export interface ConcernCard {
  /** Stable id, unique within a concern. */
  id: string;
  /** Which city's response this card describes. */
  city: CityKey;
  /**
   * The facet this card sits under, on the concern's axis.
   * For "who's-polluting" this is a SOURCE; for "safe-for-kids" a SETTING/LEVER.
   */
  facet: string;
  /** Short label for the facet chip (e.g. "Coal heating", "Air outside schools"). */
  facetLabel: string;
  /** Icon shown on the compact entry card — semantic source/setting key. */
  iconKey: IconKey;
  /**
   * The compact headline stat for the entry-card grid. The card's single most
   * representative REAL number, lifted from the detail below. Obeys the
   * no-fabrication rule (see ENTRY-CARD STAT DISCIPLINE).
   */
  stat: EntryStat;
  /** The peer-city response, in plain language: what the city did. */
  did: string;
  /** How they did it — the mechanism. */
  how: string;
  /**
   * The outcome that answers THIS concern. A string for a real figure, or a
   * Placeholder for a genuine gap. Must answer the concern, not generic progress.
   */
  outcome: string | Placeholder;
  /** The "why not you?" peer-learning nudge. */
  whyNotYou: string;
  /** Provenance — which research file each claim traces to. Always present. */
  source: string;
}

export interface Concern {
  key: string;
  /** The resident worry, in the resident's voice. */
  voice: string;
  /** The axis label shown to officials (SOURCE vs SETTING/LEVER). */
  axisLabel: string;
  /** One-line framing of how this concern fans out. */
  axisDescription: string;
  /**
   * How the responses to this concern ladder toward BC's collective 2030 goal.
   * Contribution framing — never implies one action moves the whole number.
   */
  contribution: string;
  cards: ConcernCard[];
}

/* ------------------------------------------------------------------ *
 * CONCERN 1 — "Who's polluting my neighbourhood?"  → fans by SOURCE
 * The source breakdown IS the answer to this concern.
 * ------------------------------------------------------------------ */

const WHO_POLLUTING: Concern = {
  key: "who-polluting",
  voice: "Who's polluting my neighbourhood?",
  axisLabel: "By source",
  axisDescription:
    "Each card names a pollution source and a peer city that identified it and cut it. The source breakdown is the answer.",
  contribution:
    "Naming the dominant source is the turn from Seeing to Acting — every city that has apportioned its emissions and cut the biggest source is contributing to the collective 30%-cleaner-air-by-2030 goal. [R5]",
  cards: [
    // WARSAW — coal/solid-fuel heating leads.
    {
      id: "who-warsaw-coal",
      city: "warsaw",
      facet: "Coal & solid-fuel home heating",
      facetLabel: "Coal heating",
      iconKey: "coal",
      // REAL share (~65% of winter PM10). NOT a "65% → 25%" target — no coal target
      // figure exists in the evidence, so this is a `figure`, never a progression.
      stat: { kind: "figure", value: "~65%", metric: "of winter PM10 — now banned" },
      did: "Banned coal and solid-fuel combustion across the city, and pays households to switch their boilers.",
      how: "A Mazovia regional anti-smog resolution banned coal/solid-fuel heating in Warsaw from 1 Sept 2023; the national Clean Air Programme provides subsidy and soft loans for boiler replacement and thermal renovation.",
      outcome:
        "Residential solid-fuel heating was identified as ~65% of Warsaw's winter PM10 — the single largest source, now being phased out.",
      whyNotYou:
        "If home heating is your winter peak, a fuel ban paired with switch-grants targets the source residents smell first.",
      source: "[R2] city-initiatives-research-2.md (anti-smog resolution; Clean Air Programme)",
    },
    {
      id: "who-warsaw-traffic",
      city: "warsaw",
      facet: "Road traffic",
      facetLabel: "Traffic",
      iconKey: "car",
      // REAL forecast figure from the LEZ phasing (NO2 −11% in-zone). No real baseline
      // NUMBER in the evidence to anchor a from→to pair, so rendered as a single
      // `figure`, not a fabricated progression. (Honesty: don't dress one number as two.)
      stat: { kind: "figure", value: "−11%", metric: "forecast in-zone NO₂ (LEZ)" },
      did: "Opened a central Low Emission Zone restricting the oldest, dirtiest vehicles.",
      how: "A 37 km² LEZ (Śródmieście + adjacent) launched July 2024; Phase 1 bans older diesel and petrol vehicles, tightening through 2032.",
      outcome:
        "Forecast NO2 −11% and PM −20% in the zone by the early 2030s as the phasing tightens.",
      whyNotYou:
        "A zone that tightens on a published schedule lets a city act on traffic before fleet turnover would deliver it on its own.",
      source: "[R2] city-initiatives-research-2.md (Warsaw LEZ, July 2024)",
    },
    // LONDON — road transport leads.
    {
      id: "who-london-traffic",
      city: "london",
      facet: "Road transport",
      facetLabel: "Traffic",
      iconKey: "car",
      // REAL achieved figure: ~50% of NOx was road transport (LAEI) → 21% roadside
      // NO2 reduction after ULEZ. A genuine before→after movement in the evidence.
      stat: {
        kind: "progression",
        from: "~50% of NOx",
        to: "−21%",
        metric: "roadside NO₂ after ULEZ",
      },
      did: "Apportioned its emissions, found traffic was the dominant source, then charged the dirtiest vehicles to enter.",
      how: "The London Atmospheric Emissions Inventory (LAEI) attributed ~50% of NOx to road transport; that evidence shaped the Ultra Low Emission Zone (ULEZ), expanded city-wide in 2023.",
      outcome:
        "21% reduction in roadside NO2, with ~46,000 fewer polluting vehicles driving in the zone each day.",
      whyNotYou:
        "Apportion first, then act: London targeted the source the inventory proved was biggest, not the one that was loudest.",
      source: "[R1] city-initiatives-research.md (LAEI; ULEZ)",
    },
    // BANGKOK — a multi-sector emissions inventory named the sources and cut one.
    {
      id: "who-bangkok-inventory",
      city: "bangkok",
      facet: "Industrial furnaces & boilers",
      facetLabel: "Industry & furnaces",
      iconKey: "factory",
      // REAL achieved figure: industrial furnaces/boilers PM2.5 −19% per the 2024
      // inventory. A single achieved cut, not a published before→after pair → `figure`.
      stat: { kind: "figure", value: "−19%", metric: "PM2.5 from industrial furnaces" },
      did: "Built a multi-sector emissions inventory that named its sources — then cut the one it could move first.",
      how: "Bangkok's 2024 Air Pollution Emissions Inventory apportioned PM2.5 across sectors for the city and surrounding provinces, underpinning a vulnerability-mapping tool across 50 districts.",
      outcome:
        "PM2.5 from industrial furnaces and boilers fell 19% as the inventory turned a named source into targeted action.",
      whyNotYou:
        "Apportion first, then act: a sector inventory tells a city which source to aim at before it spends on the wrong one.",
      source: "[R2] city-initiatives-research-2.md (2024 Air Pollution Emissions Inventory)",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * CONCERN 2 — "Is the air safe for my kids?"  → fans by SETTING / LEVER
 * Every card answers the kids/safety question (school air, the commute,
 * the home) — NOT a generic city-wide PM2.5 drop.
 * ------------------------------------------------------------------ */

const SAFE_FOR_KIDS: Concern = {
  key: "safe-for-kids",
  voice: "Is the air safe for my kids?",
  axisLabel: "By setting",
  axisDescription:
    "Each card answers for a place a child spends time — outside school, on the commute, at home. No generic city-wide progress here.",
  contribution:
    "Across the Breathe Cities, the collective programme reports over 10,000 children already prevented from developing asthma in two years — the kids-safety dividend of these settings-level actions adding up. [R5]",
  cards: [
    // LONDON — strongest kids-specific evidence (schools + commute).
    {
      id: "kids-london-school",
      city: "london",
      facet: "Air outside schools",
      facetLabel: "School air",
      iconKey: "school",
      // REAL count (3,500+ schools enrolled). A reach figure, not a %-progression —
      // rendered as `figure`, not a fabricated before→after.
      stat: { kind: "figure", value: "3,500+", metric: "schools on daily AQ alerts" },
      did: "Enrolled thousands of schools in daily air-quality alerts with action advice for children.",
      how: "The School Air Quality Alerts (Breathe Clean) programme sends schools daily AQ forecasts plus advice — moving play indoors, changing routes — on high-pollution days.",
      outcome:
        "3,500+ schools enrolled in daily AQ forecasts and action advice for pupils.",
      whyNotYou:
        "Schools are a precise, trusted channel to protect children on the exact days the air is worst.",
      source: "[R1] city-initiatives-research.md (School AQ Alerts / Breathe Clean)",
    },
    {
      id: "kids-london-commute",
      city: "london",
      facet: "The walk / cycle to school",
      facetLabel: "The commute",
      iconKey: "commute",
      // Genuine gap: no published exposure-reduction % for the route tool. TK.
      stat: { kind: "tk", metric: "exposure cut vs main-road route" },
      did: "Published lower-pollution walking and cycling routes so families can avoid the dirtiest streets.",
      how: "The Clean Air Route Finder maps walking/cycling routes optimised for lower exposure — a back-street route can cut a child's dose versus the main-road route.",
      // Genuine gap: no published exposure-reduction % for the route tool.
      outcome: {
        tk: "Exposure reduction on a clean-air route vs the main-road route — not published in the evidence.",
      },
      whyNotYou:
        "The same journey, a quieter street: a low-cost lever that puts the choice in parents' hands every morning.",
      source: "[R1] city-initiatives-research.md (Clean Air Route Finder)",
    },
    // WARSAW — kids via Streets for Kids + the home (coal ban protects indoor air).
    {
      id: "kids-warsaw-streets",
      city: "warsaw",
      facet: "Streets around schools",
      facetLabel: "School streets",
      iconKey: "school",
      // Genuine gap: no measured school-zone AQ outcome published for Warsaw. TK.
      stat: { kind: "tk", metric: "measured school-gate AQ change" },
      did: "Ran 'Streets for Kids' — reclaiming the streets outside schools for children and clean-air campaigning.",
      how: "Streets for Kids and LEZ-linked community campaigns (cited in BC's awareness pillar) mobilise parents and schools around the air children breathe near the school gate.",
      // Genuine gap: no measured school-zone AQ outcome published for Warsaw.
      outcome: {
        tk: "Measured school-gate air-quality change for Warsaw — not quantified in the evidence.",
      },
      whyNotYou:
        "Parent-led school-street action builds the political will that makes the harder source policies stick.",
      source: "[R3] breathe-better-report-domain-mapping.md (Warsaw 'Streets for Kids')",
    },
    {
      id: "kids-warsaw-home",
      city: "warsaw",
      facet: "Air at home",
      facetLabel: "The home",
      iconKey: "home",
      // REAL share (~65% of winter PM10 — same coal source as who-warsaw-coal).
      // A share, not a target: `figure`, never an invented progression.
      stat: { kind: "figure", value: "~65%", metric: "of winter PM10, at the source" },
      did: "Removed coal heating from homes — cutting the smoke children breathe indoors and on their own street.",
      how: "The coal/solid-fuel ban plus Clean Air Programme boiler-replacement grants take the dirtiest combustion out of residential neighbourhoods where children live and play.",
      outcome:
        "Targets the source identified as ~65% of winter PM10 — the smoke closest to where children sleep.",
      whyNotYou:
        "Cleaning home heating protects the youngest where they spend the most hours: indoors, at home.",
      source: "[R2] city-initiatives-research-2.md (anti-smog resolution; Clean Air Programme)",
    },
    // BANGKOK — honest 'seeing' framing: a public real-time dashboard families act on.
    // The dashboard is REAL; no Bangkok kids-specific exposure figure exists in the
    // evidence, so the headline stat stays an honest TK rather than a fabricated number.
    {
      id: "kids-bangkok-dashboard",
      city: "bangkok",
      facet: "Checking before the school run",
      facetLabel: "Getting data",
      iconKey: "data",
      // Genuine gap: no kids-specific exposure figure for Bangkok. The tool families
      // use is real, but the children's-exposure number isn't published → TK.
      stat: { kind: "tk", metric: "children's-exposure baseline" },
      did: "Put real-time air-quality data where families can see it — and decide before the children go out.",
      how: "The BMA airbkk dashboard publishes live station data and AQI city-wide, and feeds PM2.5 onto smart traffic signs — so a parent can check the air on a bad-air morning and choose whether to keep play indoors.",
      // Genuine gap: no kids-specific exposure figure for Bangkok in the evidence.
      outcome: {
        tk: "A Bangkok children's-exposure figure — the public dashboard makes the air visible, but no kids-specific number is published in this evidence set.",
      },
      whyNotYou:
        "Seeing comes first: a public real-time feed turns 'is it safe today?' into a decision a parent can actually make.",
      source: "[R2] city-initiatives-research-2.md (BMA airbkk real-time dashboard)",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * CONCERN 3 — "I know it's bad — what can I actually do?"  → fans by ACTION
 * The fatalism / agency gate. Cards ARE proven responses: a real lever a peer
 * city PROVIDED that a resident can take up (protect yourself), or a real civic
 * action that worked and that residents can push for (change the system).
 * Answer-fit: every card must be a thing a resident can DO or push for — never
 * generic city progress.
 * ------------------------------------------------------------------ */

const WHAT_CAN_I_DO: Concern = {
  key: "what-can-i-do",
  voice: "I know it's bad — what can I actually do?",
  axisLabel: "By action",
  axisDescription:
    "Each card is a proven response a resident can take up or push for — split into protecting yourself today and changing the system. Knowledge with a pathway to act, not helplessness.",
  contribution:
    "The turn from informed-but-helpless to acting is where a resident becomes part of the 30%-by-2030 story — protective levers cut today's exposure, and civic action is what made the hardest source policies happen in the first place. [R5]",
  cards: [
    // LONDON — protect-yourself: the clean-air route tool (a daily resident lever).
    {
      id: "do-london-route",
      city: "london",
      facet: "Protect yourself · cleaner routes",
      facetLabel: "Cleaner routes",
      iconKey: "route",
      // Genuine gap: no published exposure-reduction % for the route tool. TK.
      stat: { kind: "tk", metric: "exposure cut vs main-road route" },
      did: "Gave residents a tool to choose lower-pollution walking and cycling routes.",
      how: "The Clean Air Route Finder maps walking/cycling routes optimised for lower exposure — a quieter back-street route every morning, the choice in the resident's hands.",
      // Genuine gap: no published exposure-reduction % for the route tool.
      outcome: {
        tk: "Exposure reduction on a clean-air route vs the main-road route — not published in the evidence.",
      },
      whyNotYou:
        "A free, low-cost lever a resident can act on today — no policy, no waiting, the same journey on a cleaner street.",
      source: "[R1] city-initiatives-research.md (Clean Air Route Finder)",
    },
    // LONDON — protect-yourself via a trusted channel: school AQ alerts (action advice).
    {
      id: "do-london-alerts",
      city: "london",
      facet: "Protect yourself · daily alerts",
      facetLabel: "Daily alerts",
      iconKey: "school",
      // REAL count (3,500+ schools) — the reach of a tool residents/families act on.
      stat: { kind: "figure", value: "3,500+", metric: "schools acting on daily alerts" },
      did: "Put daily air-quality alerts and action advice in residents' and schools' hands.",
      how: "School AQ Alerts (Breathe Clean) send daily forecasts plus what-to-do advice — move play indoors, change the route — so families can act on the exact bad-air days.",
      outcome:
        "3,500+ schools enrolled in daily AQ forecasts and action advice — a precise, trusted channel families act through.",
      whyNotYou:
        "Telling people what to do on the worst days, through a channel they already trust, turns a number into an action.",
      source: "[R1] city-initiatives-research.md (School AQ Alerts / Breathe Clean)",
    },
    // WARSAW — change-the-system: Polish Smog Alert (residents drove the policy).
    {
      id: "do-warsaw-campaign",
      city: "warsaw",
      facet: "Change the system · citizen campaign",
      facetLabel: "Citizen campaign",
      iconKey: "campaign",
      // REAL outcome: PSA credited with securing the coal ban + 14/16 regional
      // resolutions. A campaign OUTCOME, framed collectively — not a per-intervention
      // health claim. The "10,000 fewer deaths/yr" is national + attributed to the
      // combined policy outcomes, so it sits in `outcome` prose, not as the headline stat.
      stat: { kind: "figure", value: "14 / 16", metric: "regional anti-smog laws won" },
      did: "Residents organised — and forced the bans they couldn't make alone.",
      how: "The Polish Smog Alert, a grassroots citizen campaign, is credited with securing the national coal ban, the boiler-subsidy programme, and anti-smog resolutions in 14 of Poland's 16 regions.",
      outcome:
        "A citizen campaign credited with winning the coal ban and boiler programme; combined Polish smog-reduction policy is nationally attributed with ~10,000 fewer premature deaths a year.",
      whyNotYou:
        "The single clearest proof that residents pushing together is what made the hardest source policies actually happen.",
      source: "[R2] city-initiatives-research-2.md (Polish Smog Alert successes)",
    },
    // WARSAW — protect-yourself: take up the boiler-replacement grant.
    {
      id: "do-warsaw-grants",
      city: "warsaw",
      facet: "Protect yourself · switch your boiler",
      facetLabel: "Switch grants",
      iconKey: "grants",
      // REAL figures: national programme scale (~1M applications). A take-up figure.
      stat: { kind: "figure", value: "~1M", metric: "household grant applications" },
      did: "Paid residents to swap the coal boiler heating their own home.",
      how: "The national Clean Air Programme offers subsidies and soft loans for boiler replacement and thermal renovation — a grant a household applies for directly.",
      outcome:
        "~1 million household applications nationwide to a €25bn subsidy and soft-loan programme for cleaner home heating.",
      whyNotYou:
        "Where the smoke is your own boiler, a grant a resident can apply for puts the fix within reach of the household.",
      source: "[R2] city-initiatives-research-2.md (Clean Air Programme, national)",
    },
    // BANGKOK — protect-yourself: ride the clean fleet, and check the air first.
    {
      id: "do-bangkok-ebus",
      city: "bangkok",
      facet: "Protect yourself · ride the clean fleet",
      facetLabel: "Clean transit",
      iconKey: "route",
      // REAL achieved figures: 2,350+ electric buses across 124 routes. A take-up /
      // reach figure residents can act on, not a fabricated before→after → `figure`.
      stat: { kind: "figure", value: "2,350+", metric: "electric buses · 124 routes" },
      did: "Gave residents a clean way to move — an electric bus network they can choose today, plus a live feed to check the air first.",
      how: "Bangkok's E-Bus Programme runs 2,350+ electric buses across 124 routes; paired with the airbkk dashboard, a resident can swap a polluting trip for a clean one and time it around the worst air.",
      outcome:
        "2,350+ electric buses across 124 routes — a zero-tailpipe option a resident can take instead of adding to the traffic.",
      whyNotYou:
        "A clean fleet a resident can ride today is agency, not waiting: every swapped trip is one less tailpipe on the street.",
      source: "[R2] city-initiatives-research-2.md (Bangkok E-Bus Programme; airbkk dashboard)",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * CONCERN 4 — "Which part of my city has the worst air — is it where I live?"
 *   → fans by PLACE (neighbourhood / sub-city)
 *
 * GRANULARITY CAVEAT (Jack 2026-05-23): the global site is mostly city-average;
 * real per-neighbourhood numbers are thin. So each card demonstrates the
 * neighbourhood-COMPARISON structure by carrying the REAL sub-city sensing
 * infrastructure the city has (what makes "which part?" answerable), and renders
 * every actual neighbourhood reading as a [TK]. We never fabricate a neighbourhood
 * figure — the structure shows the concept; the numbers stay honest.
 * ------------------------------------------------------------------ */

const WORST_PART: Concern = {
  key: "worst-part",
  voice: "Which part of my city has the worst air — is it where I live?",
  axisLabel: "By place",
  axisDescription:
    "Each card shows the sub-city sensing a city has built to answer 'which part?' — the structure for comparing neighbourhoods. The global site is mostly city-average, so the actual per-neighbourhood readings are shown honestly as [TK], never invented.",
  contribution:
    "Moving from a city average to 'where I live' is what makes air pollution personal — and the dense neighbourhood networks that answer it are the same Seeing-stage infrastructure every city's 2030 progress is measured on. [R5]",
  cards: [
    // LONDON — the strongest real sub-city sensing infrastructure in the BC family.
    {
      id: "place-london-network",
      city: "london",
      facet: "Neighbourhood sensor network",
      facetLabel: "Hyperlocal network",
      iconKey: "place",
      // The INFRASTRUCTURE figure is real (~290 nodes, validated, open data). The
      // actual per-neighbourhood comparison values are NOT in the evidence → the
      // detail outcome is a TK. Structure real, neighbourhood numbers honest.
      stat: { kind: "figure", value: "~290", metric: "neighbourhood sensor nodes" },
      did: "Built a validated, city-scale low-cost sensor network down to neighbourhood level — with the data open to all.",
      how: "Breathe London adds ~290 low-cost nodes (incl. at schools and hospitals) on top of the statutory LAQN — the first validated city-scale network, publishing open data street by street.",
      // Genuine gap: the evidence gives the network's existence, not a published
      // worst-neighbourhood ranking. TK, never a fabricated neighbourhood number.
      outcome: {
        tk: "Which specific London neighbourhoods rank worst — the network can show it, but no neighbourhood ranking is in this evidence set. [structure shown; readings TK]",
      },
      whyNotYou:
        "A dense, open network is how a city turns 'is the city polluted?' into the engaging question: 'is it bad where I live?'",
      source: "[R1] city-initiatives-research.md + [R4] city-sensor-ownership.md (Breathe London ~290 nodes; LAQN)",
    },
    // WARSAW — real dense sub-city network (Airly), in the resident app.
    {
      id: "place-warsaw-airly",
      city: "warsaw",
      facet: "City-wide sensor grid",
      facetLabel: "Sensor grid",
      iconKey: "place",
      // Real infrastructure figure (164 sensors across city + 17 municipalities).
      // Per-neighbourhood values not published → outcome TK.
      stat: { kind: "figure", value: "164", metric: "sensors across the city" },
      did: "Commissioned one of Europe's largest urban sensor grids and put it in a free resident app.",
      how: "164 Airly sensors span Warsaw and 17 neighbouring municipalities, surfacing PM and NO2 in the Warsaw 19115 app — residents can read their own district, not just the city figure.",
      // Genuine gap: no published per-neighbourhood ranking in the evidence.
      outcome: {
        tk: "Warsaw's worst-affected districts ranked — the 164-sensor grid can resolve it, but no neighbourhood ranking is in this evidence set. [structure shown; readings TK]",
      },
      whyNotYou:
        "Put the grid in an app residents already use and 'which part of my city?' becomes a question they can answer themselves.",
      source: "[R2] city-initiatives-research-2.md + [R4] city-sensor-ownership.md (Airly 164; Warsaw 19115)",
    },
    // BANGKOK — a real reference-grade network feeding a public city-wide dashboard.
    // The INFRASTRUCTURE figure is real (~68 reference stations). Per-neighbourhood
    // ranking values are NOT in the evidence → the detail outcome stays a TK. This is
    // the C1 hero pick on the cities index, so its `stat` is real (no [TK] in any hero).
    {
      id: "place-bangkok-network",
      city: "bangkok",
      facet: "Reference-grade station network",
      facetLabel: "Station network",
      iconKey: "place",
      // Real infrastructure figure: ~68 PCD/BMA reference-grade stations across the
      // city. Per-neighbourhood readings not published → outcome TK, never invented.
      stat: { kind: "figure", value: "~68", metric: "reference-grade stations" },
      did: "Built a city-wide reference-grade station network and put its readings on a public dashboard — and on the street.",
      how: "PCD and BMA run ~68 reference-grade stations measuring PM2.5, PM10, NO2, O3 and CO; the airbkk dashboard surfaces them in real time and feeds PM2.5 onto smart traffic signs city-wide — so a resident can read their own area, not just the city figure.",
      // Genuine gap: the evidence gives the network's scale, not a published
      // worst-neighbourhood ranking. TK, never a fabricated neighbourhood number.
      outcome: {
        tk: "Which specific Bangkok areas rank worst — the ~68-station network can resolve it, but no neighbourhood ranking is in this evidence set. [structure shown; readings TK]",
      },
      whyNotYou:
        "A dense reference network on a public dashboard is how a city turns 'is the city polluted?' into 'is it bad where I live?'",
      source: "[R2] city-initiatives-research-2.md (PCD/BMA monitoring network; airbkk dashboard)",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * CONCERN 5 — "Why won't anyone make the polluters stop?"  → fans by ACTOR
 * Accountability framing — NOT individual behaviour. Each card is a real peer
 * city where an ACTOR (city government / regulator-law / national government)
 * held a polluter accountable or enacted ENFORCEMENT — a ban, a charge, a
 * binding programme — with the outcome. Answer-fit: who acted, and what it forced.
 * ------------------------------------------------------------------ */

const MAKE_THEM_STOP: Concern = {
  key: "make-them-stop",
  voice: "Why won't anyone make the polluters stop?",
  axisLabel: "By actor",
  axisDescription:
    "Each card names who acted — city government, a regulator, or national government — and the enforcement they used to make a polluter stop. Accountability and binding action, not asking residents to change.",
  contribution:
    "Holding the biggest polluters accountable is the enforcement edge of the 2030 goal — bans and charges that make the dirtiest sources stop are what turn a target into measured cleaner air. [R5]",
  cards: [
    // LONDON — CITY GOVERNMENT enforced: charged the dirtiest vehicles to enter.
    {
      id: "stop-london-city",
      city: "london",
      facet: "City government · charged the polluters",
      facetLabel: "City enforcement",
      iconKey: "cityGov",
      // REAL achieved enforcement outcome: −21% roadside NO2, 46k fewer vehicles/day.
      stat: {
        kind: "progression",
        from: "46k fewer",
        to: "−21%",
        metric: "dirty vehicles/day → roadside NO₂",
      },
      did: "The city made the dirtiest vehicles pay to enter — and enforced it city-wide.",
      how: "Transport for London's Ultra Low Emission Zone charges non-compliant vehicles daily, enforced by camera across all of Greater London since 2023. The city acted on the polluter, not the resident.",
      outcome:
        "21% reduction in roadside NO2 and ~46,000 fewer polluting vehicles in the zone each day — enforcement, measured.",
      whyNotYou:
        "A city can make polluters pay on a schedule it controls, instead of waiting for the fleet to clean itself up.",
      source: "[R1] city-initiatives-research.md (ULEZ; LAEI)",
    },
    // WARSAW — REGULATOR / LAW enforced: a binding ban on the dirtiest fuel.
    {
      id: "stop-warsaw-regulator",
      city: "warsaw",
      facet: "Regulator · banned the dirtiest fuel",
      facetLabel: "Regulatory ban",
      iconKey: "regulator",
      // REAL: a binding regional ban, in force from 1 Sept 2023, on the ~65% source.
      stat: { kind: "figure", value: "~65%", metric: "of winter PM10 — banned by law" },
      did: "A regulator made the biggest single source illegal.",
      how: "The Mazovia regional anti-smog resolution bans coal and solid-fuel combustion in Warsaw — a binding law in force from 1 September 2023, extending to the wider metro by 2028.",
      outcome:
        "Residential solid-fuel heating — identified as ~65% of Warsaw's winter PM10 — is now banned outright, not merely discouraged.",
      whyNotYou:
        "When a source is big enough, a binding ban with a date does what voluntary measures can't: it stops it.",
      source: "[R2] city-initiatives-research-2.md (Mazovia anti-smog resolution)",
    },
    // WARSAW — NATIONAL GOVERNMENT forcing function: state money behind the transition.
    {
      id: "stop-warsaw-national",
      city: "warsaw",
      facet: "National government · funded the switch",
      facetLabel: "National programme",
      iconKey: "national",
      // REAL: €25bn national programme — the state's forcing function backing the ban.
      stat: { kind: "figure", value: "€25bn", metric: "national clean-heating fund" },
      did: "National government put real money behind making the ban enforceable.",
      how: "The €25bn national Clean Air Programme funds boiler replacement and thermal renovation — so a regulator's ban isn't just a rule households can't afford to follow, but a transition the state pays to make happen.",
      outcome:
        "A €25bn subsidy-and-loan programme with ~1 million household applications — national backing that makes the ban stick.",
      whyNotYou:
        "Accountability needs a forcing function: pairing a ban with national money is how the polluting practice actually ends.",
      source: "[R2] city-initiatives-research-2.md (Clean Air Programme, national)",
    },
    // BANGKOK — CITY GOVERNMENT enforced: a truck low-emission zone with a measured cut.
    {
      id: "stop-bangkok-city",
      city: "bangkok",
      facet: "City government · restricted the dirtiest trucks",
      facetLabel: "City enforcement",
      iconKey: "cityGov",
      // REAL achieved enforcement outcome: PM2.5 −15.6% in-zone in the LEZ pilot.
      stat: { kind: "figure", value: "−15.6%", metric: "PM2.5 in the truck LEZ zone" },
      did: "The city restricted the dirtiest trucks from a low-emission zone — and measured the result.",
      how: "Bangkok's Low Emission Zone pilot restricted access for 404 trucks/day; alongside Euro 5 vehicle/fuel standards (2024) and a PM2.5 Control Zone declaration (2025) that hands authorities tighter enforcement powers.",
      outcome:
        "PM2.5 fell 15.6% inside the pilot zone versus surrounding areas — enforcement on the polluter, measured, with expansion to 50 districts planned.",
      whyNotYou:
        "A city can restrict the dirtiest vehicles in a zone it controls and measure the cut, instead of waiting for the fleet to clean itself up.",
      source: "[R2] city-initiatives-research-2.md (LEZ pilot; Euro 5 standards; PM2.5 Control Zone)",
    },
  ],
};

export const CONCERNS: Concern[] = [
  WHO_POLLUTING,
  SAFE_FOR_KIDS,
  WHAT_CAN_I_DO,
  WORST_PART,
  MAKE_THEM_STOP,
];

/**
 * Look up a single concern by its key. Used by the concern page
 * (/ux-concepts/cities/[concern]) to resolve the route param to its content.
 * Returns undefined for an unknown key so the page can 404 honestly.
 */
export function concernByKey(key: string): Concern | undefined {
  return CONCERNS.find((c) => c.key === key);
}

/**
 * The cities that actually have a documented answer for a concern, in CITIES
 * order. This is the concern-centric "some cities, not all" rule made concrete:
 * a concern page shows only the cities whose evidence holds a card for it, so
 * gaps never read as holes. Cities with no card for the concern are absent.
 */
export function citiesWithAnswersFor(concern: Concern): City[] {
  const answered = new Set(concern.cards.map((card) => card.city));
  return CITIES.filter((city) => answered.has(city.key));
}
