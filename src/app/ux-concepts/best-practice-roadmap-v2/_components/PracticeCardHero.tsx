/**
 * PracticeCardHero.tsx — outcome-as-hero card variant for the roadmap overview grid.
 *
 * Purpose
 *   Sibling of PracticeCardTile. Where PracticeCardTile renders city + practice name as the
 *   dominant typography with the chart as supporting evidence, PracticeCardHero inverts the
 *   hierarchy: the outcome (a self-contained metric sentence like "-42% PM2.5 since 2018")
 *   becomes the visually dominant element, the city name sits as a prominent supporting line
 *   directly beneath it, and the practice description + population + introduced-year drop to
 *   quiet metadata at the foot of the card.
 *
 *   This component is consumed only on the v2 roadmap overview page (page.tsx). Detail pages
 *   continue to use PracticeCardTile so their behaviour is unchanged.
 *
 * Iteration 2 (2026-05-26) layout — see workflow log roadmap-v2-jack-fixes-2026-05-26.md.
 *   Two columns inside the card, both top-aligned:
 *     LEFT column (top-aligned)
 *       [Outcome hero            — 2.25rem bold, top of column]
 *       [City name               — 17px medium, dark-blue, prominent]
 *       [Practice description    — 13px quiet, sits beneath city as the supporting line]
 *       [Population · year       — 11px quiet metadata, pushed to bottom of column]
 *     RIGHT column (top-aligned)
 *       [Chart viz]
 *
 *   The previous full-width practice description row beneath the chart is gone — description
 *   now nests under the hero in the left column. This shortens the card and tightens the
 *   relationship between the outcome and the programme it names.
 *
 *   Heights: cards size to their own content; the parent grid uses items-start so cards in a
 *   row top-align rather than stretching. Left column uses flex-col with mt-auto on the
 *   metadata row so it pins to the bottom of the column when the card is taller than the
 *   left content (typically pushed by chart height).
 *
 * Hero composition (fix #4 — self-contained heroes)
 *   composeHero() takes the practice + example and returns a hero string that reads as a
 *   complete sentence on its own (subject + result). Strategy: borrow nouns from chartData
 *   labels/headlines/metrics and compose with the example.outcomeChange. Hand-tuned overrides
 *   per practice-id × city-slug where the data doesn't compose cleanly. No edits to
 *   roadmap-data.ts — composition lives here.
 *
 * Key exports: PracticeCardHero (named)
 * External dependencies: shadcn Card, @/data/roadmap-data lookup helpers, sibling
 *   PracticeCardView (re-uses ChartViz dispatcher via the shared module).
 */

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  type PracticeCard,
  type CityExample,
  getCityBySlug,
} from "@/data/roadmap-data";
import { ChartViz } from "./PracticeCardView";

/** Props for PracticeCardHero. Mirrors the subset of PracticeCardTile props this variant needs. */
interface PracticeCardHeroProps {
  /** The practice this card belongs to — used to render its name as the supporting line. */
  practice: PracticeCard;
  /** The single city example to showcase. */
  example: CityExample;
}

/**
 * composeHero — returns a self-contained hero string for the featured card.
 *
 * Strategy (in priority order):
 *   1. Hand-tuned override keyed by `practice.id` + `example.citySlug` for the 11 featured
 *      cards on the overview surface. Overrides exist for every FEATURED card mapping in
 *      page.tsx so heroes read as complete subject+result sentences.
 *   2. Fallback to `example.outcomeChange` (the original behaviour) for any unfeatured
 *      card-example pairs that happen to consume this component in future.
 *   3. Final fallback: empty string (caller branches on null/empty to render the
 *      practice-name-as-hero treatment).
 *
 * Overrides are intentionally inline (not in roadmap-data.ts) — the data file is shared with
 * other surfaces (city detail, domain detail, v1 overview) and we don't want overview-only
 * editorial choices to leak into those.
 */
function composeHero(practice: PracticeCard, example: CityExample): string | null {
  const key = `${practice.id}|${example.citySlug}`;
  const overrides: Record<string, string> = {
    // Seeing — Monitoring (London)
    "d1-sensor-deployment|london": "120 low-cost sensors citywide",
    // Seeing — Data & Tech (Bogota open data)
    "d12-open-data|bogota": "20 reference-grade stations citywide",
    // Understanding — Source Analysis (Accra)
    "d2-source-apportionment|accra": "Transport + cookstoves identified as source",
    // Understanding — Health Impact (Paris UFP study)
    "d3-health-risk-assessment|paris": "33% fewer respiratory admissions",
    // Acting — Policy Design (Brussels)
    "d4-policy-timeline|brussels": "-42% PM2.5 since 2018",
    // Acting — Transport / Vehicle Restriction (Mexico City)
    "d5-vehicle-restriction|mexico-city": "-20% daily vehicles",
    // Acting — Clean Fuels (Johannesburg)
    "d6-clean-fuels|johannesburg": "1.2M homes electrified",
    // Acting — Green Infrastructure (Milan ForestaMi)
    "d7-green-infrastructure|milan": "3 million trees planted",
    // Enabling — Awareness (Bangkok)
    "d8-awareness|bangkok": "45% of residents now AQ-aware",
    // Enabling — Governance (Warsaw)
    "d9-governance|warsaw": "3 governance level coverage in 5 years",
    // Enabling — Funding (Warsaw)
    "d10-funding|warsaw": "PLN 2.1B unlocked for transition",
  };
  if (overrides[key]) return overrides[key];

  // Fallback to example.outcomeChange for unmapped cards.
  if (example.outcomeChange && example.outcomeChange.trim().length > 0) {
    return example.outcomeChange;
  }
  return null;
}

/**
 * isShortHero — whether the resolved hero string is "short enough" to display at full hero
 * scale (2.25rem) vs. needs to be stepped down to a medium scale because it's a sentence
 * rather than a tight number+noun. Heuristic: 28 chars or fewer = hero scale; longer =
 * stepped-down scale (still bold, but readable as a phrase).
 */
function isShortHero(outcome: string): boolean {
  return outcome.length <= 28;
}

/**
 * PracticeCardHero — outcome-first card layout for the roadmap overview grid.
 *
 * Layout (iteration 2):
 *   LEFT column (flex-col, top-aligned):
 *     Outcome hero → City name → Practice description → Population · year (mt-auto)
 *   RIGHT column (top-aligned):
 *     Chart viz
 *
 * When no clean composed hero exists, falls back to the practice-name-as-hero treatment
 * (intervention name promoted to large scale; chart still in right column).
 */
export function PracticeCardHero({ practice, example }: PracticeCardHeroProps) {
  const city = getCityBySlug(example.citySlug);
  if (!city) return null;

  const outcome = composeHero(practice, example);
  const shortHero = outcome !== null && isShortHero(outcome);

  /* Chart viz block — shared dispatcher from PracticeCardView. Kept in a tinted muted-bg panel
   * matching the existing PracticeCardTile chart treatment for visual continuity.
   * minHeight ensures the chart anchors the right column at a predictable size. */
  const chartBlock = example.chartData ? (
    <div
      className="rounded-lg bg-muted/30 p-3 flex items-center justify-center"
      style={{ minHeight: 160 }}
    >
      <div className="w-full">
        <ChartViz data={example.chartData} cityFlag={city.flag} />
      </div>
    </div>
  ) : null;

  /* Introduced-year string for the footer metadata row. Kept identical to PracticeCardTile's
   * treatment for content consistency. */
  const introducedStr =
    example.introducedYear === "ongoing"
      ? "ongoing"
      : `introduced ${example.introducedYear}`;

  /* Footer metadata block — population + year, quiet and small. City name is no longer in
   * the footer (promoted to its own prominent line beneath the hero — see fix #3). The
   * country code flag stays attached to the city name above. mt-auto pins this row to the
   * bottom of the left column so cards keep predictable vertical rhythm. */
  const footerMeta = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground pt-3 mt-auto">
      <span>{city.populationLabel}</span>
      <span aria-hidden="true">&middot;</span>
      <span>{introducedStr}</span>
    </div>
  );

  /* Branch 1 — composed hero exists: render outcome → city → description → metadata in the
   * left column, chart in the right. */
  if (outcome !== null) {
    return (
      <Card>
        <CardContent className="p-6">
          {/* Two-column flex. md:items-stretch keeps both columns the same height so the
              metadata mt-auto can pin the population/year row to the bottom of the left
              column at the level of the chart bottom. */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-5">
            {/* LEFT column — top-aligned content stack. flex-col with mt-auto on the
                metadata row produces: hero at top, metadata at bottom, city + description
                filling the middle. */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Outcome hero — visually dominant, top of the left column */}
              <div
                className="font-bold tracking-tight text-foreground leading-[1.05]"
                style={{
                  fontSize: shortHero ? "2.25rem" : "1.5rem",
                  lineHeight: shortHero ? 1.05 : 1.2,
                }}
              >
                {outcome}
              </div>
              {/* City name — prominent supporting line beneath the hero. ~17px medium,
                  dark-blue tinted via the BC token applied at the page level via foreground.
                  The country flag chip stays with the city name for region cue. */}
              <div
                className="mt-2 text-[17px] font-semibold tracking-tight"
                style={{ color: "var(--bc-color-dark-blue)" }}
              >
                <span className="text-[11px] font-medium mr-1.5 text-muted-foreground tracking-wider">
                  {city.flag}
                </span>
                {city.name}
              </div>
              {/* Practice description — quiet supporting line nested under the hero/city.
                  Reads as the programme name the outcome belongs to. */}
              <p className="mt-2 text-[13px] leading-snug text-foreground/70">
                {example.interventionName}
              </p>
              {footerMeta}
            </div>

            {/* RIGHT column — chart, top-aligned, fixed width on md+ */}
            {chartBlock && (
              <div className="md:w-[240px] flex-shrink-0 self-start">
                {chartBlock}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  /* Branch 2 — no-composed-hero fallback: promote the intervention name to hero scale.
   * Used by any cards that don't have a hand-tuned override and don't carry an outcomeChange
   * value (rare given the override coverage, but kept for safety). */
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-stretch gap-5">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {practice.name}
            </div>
            <div
              className="mt-2 font-bold tracking-tight text-foreground leading-snug"
              style={{ fontSize: "1.5rem" }}
            >
              {example.interventionName}
            </div>
            <div
              className="mt-2 text-[17px] font-semibold tracking-tight"
              style={{ color: "var(--bc-color-dark-blue)" }}
            >
              <span className="text-[11px] font-medium mr-1.5 text-muted-foreground tracking-wider">
                {city.flag}
              </span>
              {city.name}
            </div>
            {footerMeta}
          </div>
          {chartBlock && (
            <div className="md:w-[240px] flex-shrink-0 self-start">
              {chartBlock}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
