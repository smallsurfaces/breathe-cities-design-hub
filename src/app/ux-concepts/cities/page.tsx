/**
 * Resident Concerns — concern landing (/ux-concepts/cities)
 *
 * The CANONICAL Resident Concerns concept landing, after the concern-centric restructure
 * (2026-05-25). The concept used to be city-centric (a city index → per-city pages with a city
 * switcher). It is now CONCERN-centric: this landing frames the FIVE resident concerns as a common
 * collective challenge shared across Breathe Cities, and each one links to its own concern page.
 *
 * Server component. The v1/v2 split is collapsed — this single build at /ux-concepts/cities is the
 * one canonical cities concept, carrying the on-standard concept composition layer
 * (ConceptHero / ConceptSectionHeader / ConceptCard from @/components/concept).
 *
 * Declutter pass (2026-05-25): the "RESIDENT CONCERNS" hero eyebrow is dropped (the hero uses the
 * shared ConceptHero with no eyebrow prop, matching the other concepts), and the inferred-voice
 * honesty note is moved out of inline body copy behind an "i" InfoTooltip (with a minimal visible
 * "inferred" cue) — the evidence-discipline text is preserved, not deleted.
 *
 * Page structure (top to bottom):
 *   - Chrome (BcHeader, per-page) — the in-context BC-site recreation.
 *   - Hero: the collective challenge framing — five questions every city's residents ask, and the
 *     30%-by-2030 mission. (No banner image placeholder — §5: the layout reads cleanly without
 *     images; the retired Cities banner placeholder is gone.)
 *   - The five CONCERN cards: each names the resident question (inferred voice), a one-line "why
 *     it's universal", how many BC cities have a documented answer, and a link to its concern page.
 *   - Footer (BcFooter, per-page).
 *
 * Chrome: rendered PER-PAGE (the shared BcHeader/BcFooter from @/components/concept, driven by the
 * co-located CITIES_CHROME config) — NOT in the layout. This is the Cities concept's deliberate
 * structural pattern: the in-context BC-site recreation IS the build, so the pages own the chrome.
 * The PrototypeHeader tooling bar (with the sole back-to-hub) is added above by cities/layout.tsx.
 *
 * EVIDENCE DISCIPLINE: the per-concern "cities answered" count is derived from the data
 * (citiesWithAnswersFor) — only cities with a real card are counted ("some cities, not all").
 * Inferred-voice labelling is explicit. No fabricated figures, no BC photography.
 *
 * Key exports: default page component, metadata
 * External dependencies: next/link, lucide-react, @/components/concept (BcHeader, BcFooter,
 *   ConceptHero, ConceptSectionHeader, ConceptCard, InfoTooltip — the "i" affordance holding the
 *   inferred-voice note), the co-located CITIES_CHROME config, concerns-data (CONCERNS,
 *   citiesWithAnswersFor).
 *
 * Route: /ux-concepts/cities
 */

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import {
  BcHeader,
  BcFooter,
  ConceptHero,
  ConceptSectionHeader,
  ConceptCard,
  InfoTooltip,
} from "@/components/concept";
import { CITIES_CHROME } from "./_components/bc-chrome.config";
import { CONCERNS, citiesWithAnswersFor } from "./_data/concerns-data";

export const metadata: Metadata = {
  title: "Resident Concerns — Breathe Cities (concept mock)",
};

/**
 * One line per concern on why the worry is universal across cities — the "shared challenge"
 * framing for the landing. Kept here (page chrome copy) rather than in the data layer, which holds
 * the resident voice, the axis, and the contribution line. Authored, not a figure.
 */
const UNIVERSALITY: Record<string, string> = {
  "who-polluting":
    "Every city's residents want to know what is actually fouling their own street — and no city cuts pollution before it names the source.",
  "safe-for-kids":
    "Parents everywhere ask the same thing about the air their children breathe at school, on the way there, and at home.",
  "what-can-i-do":
    "The gap between knowing the air is bad and feeling able to do anything about it is common to every city.",
  "worst-part":
    "A city average hides the truth residents live with: the air where I am is not the air across town.",
  "make-them-stop":
    "In every city, residents ask why the burden falls on them rather than on the biggest polluters.",
};

export default function ResidentConcernsLanding() {
  return (
    // Chrome is rendered per-page (the Cities concept's structural pattern): the shared
    // BcHeader/BcFooter, driven by the co-located CITIES_CHROME config. The PrototypeHeader
    // tooling bar sits above, added by cities/layout.tsx.
    <main className="min-h-screen bg-background">
      <BcHeader config={CITIES_CHROME} />

      {/* ── Hero: the collective challenge framing + the 30%-by-2030 mission ─── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <ConceptHero
            headline="A challenge every city's residents share — and how some Breathe Cities answered it."
            body="Across the Breathe Cities family, residents keep asking the same five questions about the air they breathe. They are a common challenge, not a local one. For each, here is how some cities in the network have already answered — working toward 30% cleaner air by 2030 (against a 2019 baseline), with modelled projections of ~55,000 premature deaths prevented and ~$147B in avoided health costs."
          />
          {/* Inferred-voice honesty — kept (evidence discipline) but tucked behind an "i"
              tooltip, with a minimal visible "inferred" cue so the honesty signal isn't lost. */}
          <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold">inferred</span>
            <InfoTooltip label="What “inferred” means here">
              These five concerns are inferred — worries commonly raised by communities, voiced in
              residents&rsquo; words. They are a framing device, not a survey.
            </InfoTooltip>
          </p>
        </div>
      </section>

      {/* ── The five concern cards ───────────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <ConceptSectionHeader
            heading="The five concerns"
            body="Each is a question residents ask across the network. Open one to see how some Breathe Cities answered it, the outcomes, and how those answers ladder toward the 2030 goal."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {CONCERNS.map((concern, idx) => {
              const answeredCities = citiesWithAnswersFor(concern);
              const cityList = answeredCities.map((c) => c.name).join(", ");
              return (
                <Link
                  key={concern.key}
                  href={`/ux-concepts/cities/${concern.key}`}
                  // Hover uses the shadcn-bridged `primary` token (globals.css maps
                  // --primary → --bc-semantic-brand = brand blue), so the hover is brand blue
                  // via a bridged semantic — keeping this a server component.
                  className="group flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-sm transition-colors hover:border-primary"
                >
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{
                      color:
                        "color-mix(in srgb, var(--bc-color-blue) 70%, transparent)",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {/* The resident question — the door into the concern. */}
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    &ldquo;{concern.voice}&rdquo;
                  </h3>
                  {/* Why it's universal across cities. */}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {UNIVERSALITY[concern.key]}
                  </p>
                  {/* How many BC cities have a documented answer — "some cities, not all". */}
                  <p className="mt-4 text-xs text-muted-foreground">
                    Answered so far by{" "}
                    <span className="font-semibold text-foreground">
                      {answeredCities.length}{" "}
                      {answeredCities.length === 1 ? "city" : "cities"}
                    </span>{" "}
                    in the network ({cityList}).
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    See how cities answered
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Only cities with a documented, sourced answer appear under a concern — gaps are not
            padded with fabricated examples. This prototype draws on three Breathe Cities (London,
            Warsaw, Bangkok); more can be added per concern under the same evidence discipline.
          </p>
        </div>
      </section>

      <BcFooter />
    </main>
  );
}
