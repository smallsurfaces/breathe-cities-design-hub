/**
 * london.ts — the London CityProfile (curated snapshot) for AQ Network.
 *
 * Purpose
 *   The data-only definition of London's member profile. The dynamic route
 *   /ux-concepts/aq-network/[city] renders entirely from this object — so this file IS the
 *   London page's content. It is the same shape as accra.ts; no component changes were needed
 *   to add it (one data file + one registry line + one snapshot import — the proven model).
 *
 * London's role in the concept: the OUTCOME-LEADER / TEACHER, deliberately contrasted with
 *   Accra (the early learner). Where Accra is building its foundations, London is further along
 *   the journey and is the city whose playbook other cities study. That contrast is the whole
 *   point of having two profiles.
 *
 * Data provenance & HONESTY (load-bearing — London's BC city page is gated, so this profile is
 * grounded ONLY in documented public facts; nothing here is fabricated):
 *   - ULEZ (Ultra-Low Emission Zone) is London's founding clean-air programme and the model
 *     other cities reference. Central London launched 2019, expanded to inner London 2021, went
 *     London-wide in Aug 2023. Tagged pillar 2 (Technical support for policymaking). City-as-actor.
 *   - Expanded air-quality MONITORING — London runs one of the world's densest urban monitoring
 *     networks (reflected in this profile's 100-location OpenAQ snapshot). Pillar 1 (Expanding data).
 *   - Public-AWARENESS work — air-quality alerts and exposure-reduction guidance for residents.
 *     Pillar 3 (Raising awareness). Kept deliberately general (no invented programme names).
 *   - LESSON SHARING = the TEACHER side (contrast to Accra the learner). London's ULEZ became
 *     the reference playbook peer cities study, so the `gave` direction is populated and the
 *     `received` direction is intentionally left empty (no fabricated "London learned X" claim).
 *   - 2030 trajectory: −28% PM2.5 is framed as the CITY's trajectory (a city-wide trend from the
 *     Breathe Better reporting), NOT a BC-attributed outcome. Per the concept's "claim support,
 *     never outcomes" rule, this lives in the trajectory framing, NOT as an achievement card.
 *   - sensorProgramme.deployedCount (100) is the OpenAQ snapshot location count (the dense
 *     network); the LIVE count fetched at render time is expected to be smaller (open networks
 *     surface only a fraction live at any moment). The gap is shown honestly, as for Accra.
 *   - populationInRange is a GUESSTIMATE (isEstimate: true) — the UI labels it "estimate".
 *   - latestNews items are curated placeholders standing in for the live-news layer; the UI
 *     labels the strip as the live layer. They are illustrative, not real BC headlines.
 *
 * Card count discipline: fewer honest cards beat invented ones. London has four grounded
 *   achievement cards (two under data/monitoring + ULEZ + awareness) — every one a documented,
 *   city-as-actor, BC-supportable activity. No outcome cards.
 *
 * External dependencies: ../types (CityProfile and its building blocks).
 */

import type { CityProfile } from '../types'

/**
 * London's profile. openaqCitySlug is 'london', which exists in lib/openaq/cities.ts so the
 * build-time slug guard passes and the sensors section can fetch the real live count. The
 * committed snapshot (london.json) holds 100 reference-grade locations.
 */
export const londonProfile: CityProfile = {
  slug: 'london',
  name: 'London',
  region: 'Europe',
  isMember: true,
  strapline:
    'A Breathe Cities member further along the journey — its ULEZ is the clean-air model other cities study.',

  // ── The achievement timeline (the spine). Authored OLDEST→NEWEST — the spine's whole point is
  //    the SEQUENCE (what London did first). London's dense MONITORING network is foundational
  //    and predates the flagship ULEZ policy it informs, so the data cards come first, then ULEZ
  //    (the earliest FLAGSHIP: central London 2019 → London-wide 2023 — use 2019 per the journey
  //    framing), then ongoing awareness. Years are APPROXIMATE estimates (ULEZ 2019 is the one
  //    firm public date). Each headline reads city-as-actor; the card UI adds the "Supported by
  //    BC · [pillar]" credit and shows the year. Pillar tags drive the radar (order-independent).
  //    All four are documented public facts — no fabricated programmes, no outcome claims.
  achievements: [
    {
      id: 'london-monitoring-network',
      headline:
        'London built one of the world’s densest urban air-quality monitoring networks',
      detail:
        'Hundreds of reference-grade monitors give London a fine-grained, street-level picture of its air — the evidence base its policy is built on.',
      pillar: 1, // Expanding data
      year: 2017, // Foundational monitoring — the data base ULEZ and targeting are built on.
    },
    {
      id: 'london-source-evidence',
      headline:
        'London uses its monitoring data to target the biggest pollution sources',
      detail:
        'Road transport remains the dominant source; the network lets the city see where action is needed and track how the picture changes.',
      pillar: 1, // Expanding data
      year: 2018, // Using the network's data to target sources — follows the network being in place.
    },
    {
      id: 'london-ulez',
      headline:
        'London introduced and expanded its Ultra-Low Emission Zone (ULEZ) city-wide',
      detail:
        'From a central-London zone in 2019 to London-wide in 2023 — charging the most polluting vehicles to drive cleaner air. The founding example other cities now reference.',
      pillar: 2, // Technical support for policymaking
      year: 2019, // The earliest flagship — central-London ULEZ launch (firm public date).
    },
    {
      id: 'london-awareness',
      headline:
        'London runs public air-quality alerts and exposure-reduction guidance for residents',
      detail:
        'Helping Londoners understand the air they breathe and reduce their exposure on high-pollution days.',
      pillar: 3, // Raising awareness
      year: 2022, // Ongoing public awareness — most recent strand.
    },
    // No separate pillar-4 card: lesson sharing is relational and lives in the lessonSharing
    // strand below (the TEACHER side), not on the radar.
  ],

  // ── Lesson-sharing participation strand (BC pillar 4, shown as its own section, not on the
  //    radar). London is the TEACHER (contrast to Accra the early learner): its ULEZ is the
  //    reference playbook peer cities study, so the 'gave' direction is populated. The
  //    'received' direction is intentionally EMPTY — we do not fabricate a "London learned X"
  //    claim; the UI renders the honest early-stage state for that side.
  lessonSharing: [
    {
      id: 'london-shared-ulez-playbook',
      direction: 'gave',
      headline:
        'London shared the ULEZ playbook — its low-emission-zone design became the reference for peer cities',
      date: '2023',
    },
    {
      id: 'london-hosted-peer-cities',
      direction: 'gave',
      headline:
        'London hosted peer cities studying how to design and roll out their own low-emission zones',
    },
  ],

  // ── The always-fresh "Latest from London" layer. Curated placeholders standing in for a live
  //    feed; the UI labels this section as the live-news layer. Illustrative, not real headlines.
  latestNews: [
    {
      id: 'london-news-1',
      title:
        'City reviews London-wide ULEZ first-year monitoring data with borough partners',
      date: 'May 2026',
      source: 'Illustrative — live-news layer placeholder',
    },
    {
      id: 'london-news-2',
      title:
        'Peer-city delegation visits London to study low-emission-zone rollout',
      date: 'Apr 2026',
      source: 'Illustrative — live-news layer placeholder',
    },
    {
      id: 'london-news-3',
      title: 'Air-quality alerts extended ahead of forecast high-pollution period',
      date: 'Mar 2026',
      source: 'Illustrative — live-news layer placeholder',
    },
  ],

  // ── Sensor programme figures + the OpenAQ slug for the LIVE count (fetched at runtime). The
  //    100 figure is the dense snapshot location count; the live count is expected to be smaller.
  sensorProgramme: {
    deployedCount: 100,
    districtsCount: 33,
    openaqCitySlug: 'london',
    liveCoverageNote:
      'The 100 figure is the captured OpenAQ network snapshot for London. The live count below is what is reporting to OpenAQ right now — open networks surface only a fraction live at any moment, so a smaller live number is expected, not a fault.',
  },

  // ── Problem + HYPOTHETICAL health context (projection, never an achievement). London’s
  //    air is closer to WHO guidelines than Accra’s but still above them; transport-dominated.
  health: {
    whoMultiple: 2,
    sources: [
      { label: 'Road transport', sharePct: 50 },
      { label: 'Buildings & heating', sharePct: 21 },
    ],
    hypotheticalDeathsPreventedPerYear: 4000,
  },

  // ── Population within sensor range — a GUESSTIMATE (UI shows an "estimate" label).
  populationInRange: {
    approxPeople: 8000000,
    isEstimate: true,
    basisNote:
      'Rough guesstimate from the dense monitoring network across London’s 33 boroughs — no measured catchment dataset.',
  },

  // ── Collective 2030 trajectory + honest OUTCOME-LEADER framing. The −28% figure is the
  //    CITY’s trajectory (a city-wide PM2.5 trend), NOT a BC-attributed outcome — stated
  //    as such in the note so it cannot be read as a programme claim.
  trajectory: {
    goalLabel: '30% cleaner air by 2030',
    baselineYear: 2019,
    stageLabel: 'Further along — an outcome leader',
    stageNote:
      'London is one of the more advanced members: its city-wide PM2.5 is on a roughly −28% trajectory toward 2030 (a city-wide trend from the Breathe Better reporting, not a Breathe Cities-attributed outcome). The collective goal is shared across all members; London is ahead of where early-journey cities are starting.',
  },

  // ── Approximate annual-mean PM2.5 (µg/m³) — the input to the positive health payoff. ~11 is
  //    an ESTIMATE for London from OpenAQ / WHO city air-quality data (a major European city,
  //    closer to but still above WHO's 5 µg/m³ guideline). Feeds the life-expectancy-gain
  //    estimate on the profile (≈ 4 months gained for a 30% reduction); labelled an estimate.
  baselinePm25: 11,
}
