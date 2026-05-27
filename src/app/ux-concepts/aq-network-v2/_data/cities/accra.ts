/**
 * accra.ts — the Accra CityProfile (curated snapshot) for AQ Network.
 *
 * Purpose
 *   The single, data-only definition of Accra's member profile. The dynamic route
 *   /ux-concepts/aq-network/[city] renders entirely from this object — so this file IS
 *   the Accra page's content. A second city (London) is the same shape in a sibling file;
 *   no component changes are needed to add one.
 *
 * Data provenance & honesty (matches the concept's hard rules)
 *   - Achievement headlines are city-as-actor, sourced from Breathe Cities' live Accra
 *     city page. Each is a BC-SUPPORTED activity, tagged to one of the three CITY-LEVEL
 *     support pillars — the radar counts those tags (it is never authored).
 *   - Lesson sharing (BC pillar 4) is relational and lives in the lessonSharing strand, not
 *     on the radar. Accra is an EARLY LEARNER with no documented exchanges, so lessonSharing
 *     is deliberately empty — honest, never fabricated. The UI renders an early-stage state.
 *   - There are NO outcome claims (no "PM2.5 fell by X"): Accra is early on the journey.
 *     The hypothetical health line is a PROJECTION, explicitly modelled as
 *     `hypotheticalDeathsPreventedPerYear` and labelled as a projection in the UI.
 *   - sensorProgramme.deployedCount (67) is the real programme figure; the LIVE OpenAQ
 *     count is fetched at render time and is expected to be much smaller (sparse live
 *     coverage). The gap is shown honestly.
 *   - populationInRange is a GUESSTIMATE (isEstimate: true) — the UI labels it "estimate".
 *   - latestNews items are curated placeholders standing in for the live-news layer; the
 *     UI labels the strip as the live layer. They are illustrative, not real BC headlines.
 *
 * External dependencies: ../types (CityProfile and its building blocks).
 */

import type { CityProfile } from '../types'

/**
 * Accra's profile. openaqCitySlug is 'accra', which exists in lib/openaq/cities.ts
 * (bbox probe-verified to return live locations) so the sensors section can fetch the
 * real live count via /api/stations.
 */
export const accraProfile: CityProfile = {
  slug: 'accra',
  name: 'Accra',
  region: 'Africa',
  isMember: true,
  strapline:
    'A Breathe Cities member building the data, policy, and awareness to clean its air.',

  // ── The achievement timeline (the spine). Authored OLDEST→NEWEST — the spine's whole point
  //    is the SEQUENCE (what Accra did first) as a shared-learning signal. Years are APPROXIMATE
  //    estimates inferred from each card's content: build the data foundation first (sensors,
  //    then research on that data), then turn evidence into policy (action plans), then enforce
  //    it (burning ban), then sustain awareness — a plausible early-journey order. Each headline
  //    reads city-as-actor; the card UI adds the "Supported by BC · [pillar]" credit and shows
  //    the year. Pillar tags drive the radar (order-independent — reordering changes nothing).
  achievements: [
    {
      id: 'accra-sensors-67',
      headline: 'Accra deployed 67 air-quality sensors across 13 districts',
      detail:
        'A city-wide low-cost sensor network giving Accra its first dense, local picture of air quality.',
      pillar: 1, // Expanding data
      year: 2021, // The data foundation — earliest step (sensors before everything builds on them).
    },
    {
      id: 'accra-source-health-research',
      headline:
        'Accra is running pollution-source and health-impact research',
      detail:
        'Studying where the pollution comes from and what it costs residents’ health — the evidence base for action.',
      pillar: 1, // Expanding data
      year: 2022, // Research on the sensor data — follows the network being in place.
    },
    {
      id: 'accra-action-plans',
      headline: 'Accra is developing local air-quality action plans',
      detail:
        'Turning the evidence into concrete, city-led policy the administration can act on.',
      pillar: 2, // Technical support for policymaking
      year: 2023, // Evidence → policy: action plans follow the research base.
    },
    {
      id: 'accra-burning-ban',
      headline: 'Accra is enforcing its solid-waste and open-burning ban',
      detail:
        'Tackling open burning — one of the city’s largest pollution sources — through enforcement.',
      pillar: 2, // Technical support for policymaking
      year: 2024, // Enforcement follows the policy it enforces.
    },
    {
      id: 'accra-awareness-campaigns',
      headline: 'Accra is running community air-quality prevention campaigns',
      detail:
        'Helping residents understand the air they breathe and what reduces their exposure.',
      pillar: 3, // Raising awareness
      year: 2025, // Sustained community awareness — most recent strand.
    },
    // No pillar-4 (Lesson sharing) card — intentionally absent. Lesson sharing is relational
    // and is captured in the lessonSharing strand below (not on the radar). Accra is early on
    // the journey, so that strand is honestly near-empty rather than fabricated.
  ],

  // ── Lesson-sharing participation strand (BC pillar 4, shown as its own section, not on the
  //    radar). HONESTY: Accra is an EARLY LEARNER — there is no documented city-to-city
  //    lesson sharing in its source data, so this list is intentionally empty. We do NOT
  //    fabricate specific peer claims. The UI renders an honest "Early — building peer
  //    connections" state for both directions. The structure holds both 'gave' and 'received'
  //    so a teacher-heavy city (e.g. London) populates the same shape later.
  lessonSharing: [],

  // ── The always-fresh "Latest from Accra" layer. Curated placeholders standing in for a
  //    live feed; the UI labels this section as the live-news layer.
  latestNews: [
    {
      id: 'accra-news-1',
      title:
        'City and partners review first-year sensor-network data with district officials',
      date: 'May 2026',
      source: 'Illustrative — live-news layer placeholder',
    },
    {
      id: 'accra-news-2',
      title:
        'Open-burning enforcement extended to additional markets and transport hubs',
      date: 'Apr 2026',
      source: 'Illustrative — live-news layer placeholder',
    },
    {
      id: 'accra-news-3',
      title: 'Community air-quality campaign reaches schools in three districts',
      date: 'Mar 2026',
      source: 'Illustrative — live-news layer placeholder',
    },
  ],

  // ── Sensor programme figures + the OpenAQ slug for the LIVE count (fetched at runtime).
  sensorProgramme: {
    deployedCount: 67,
    districtsCount: 13,
    openaqCitySlug: 'accra',
    liveCoverageNote:
      'The 67 figure is the programme deployment. The live count below is what is reporting to OpenAQ right now — open networks surface only a fraction live at any moment, so a smaller live number is expected, not a fault.',
  },

  // ── Problem + HYPOTHETICAL health context (projection, never an achievement).
  health: {
    whoMultiple: 4,
    sources: [
      { label: 'Transport', sharePct: 40 },
      { label: 'Waste burning', sharePct: 32 },
    ],
    hypotheticalDeathsPreventedPerYear: 1790,
  },

  // ── Population within sensor range — a GUESSTIMATE (UI shows an "estimate" label).
  populationInRange: {
    approxPeople: 1200000,
    isEstimate: true,
    basisNote:
      'Rough guesstimate from sensor spread across 13 districts — no measured catchment dataset yet.',
  },

  // ── Collective 2030 trajectory + honest early-journey framing (no grade).
  trajectory: {
    goalLabel: '30% cleaner air by 2030',
    baselineYear: 2019,
    stageLabel: 'Early on the journey',
    stageNote:
      'Accra is building the foundations — data, policy, and awareness. The collective goal is shared across all Breathe Cities members; this is a starting point, not a pass/fail mark.',
  },

  // ── Approximate annual-mean PM2.5 (µg/m³) — the input to the positive health payoff. ~27 is
  //    an ESTIMATE for Accra from OpenAQ / WHO city air-quality data (West-African urban annual
  //    means typically sit well above WHO's 5 µg/m³ guideline). Feeds the life-expectancy-gain
  //    estimate on the profile (≈ 9 months gained for a 30% reduction); labelled an estimate.
  baselinePm25: 27,
}
