/**
 * Concern page — /ux-concepts/cities/[concern]
 *
 * ONE resident concern, framed as a shared challenge across Breathe Cities and answered by the
 * cities that have a documented response. This is the heart of the concern-centric restructure
 * (2026-05-25): it REPLACES the retired per-city `[slug]` page. Where the old page was "one city,
 * all five concerns", this is "one concern, the cities that answered it".
 *
 * Server component. The answer grid uses the reused EntryCard (a client Dialog) → ConcernCardView
 * popup, which carries the §4 content order and the §7 infographic.
 *
 * Declutter pass (2026-05-25): the "A challenge cities share" badge and the per-concern "Fanned
 * by …" axis descriptor line are removed, and the inferred-voice honesty note is moved out of
 * inline body copy behind an "i" InfoTooltip (with a minimal visible "inferred" cue) — the
 * evidence-discipline text is preserved, not deleted. (The hero was already eyebrow-less.)
 *
 * Structure (top to bottom, per the build brief):
 *   1. THE SHARED CHALLENGE — the resident question in the resident's voice (labelled INFERRED via
 *      the "i" tooltip), plus one line on why it is universal across cities. Uses the shared
 *      ConceptHero with no eyebrow prop.
 *   2. HOW SOME BC CITIES ANSWERED IT — the concern's cards, grouped BY CITY (only cities with a
 *      real card appear — "some cities, not all"). Each card is one city's answer: tap → popup.
 *   3. CONTRIBUTION TO 2030 — the concern's `contribution` line (from the data): how these answers
 *      ladder to BC's collective 30%-by-2030 goal.
 *
 * Chrome: rendered PER-PAGE (the shared BcHeader/BcFooter from @/components/concept, driven by the
 * co-located CITIES_CHROME config) — NOT in the layout, matching the Cities concept's structural
 * pattern. The PrototypeHeader tooling bar (with the sole back-to-hub) is added above by the cities
 * layout, and is the page's back-nav. (The redundant top-of-page "Resident Concerns / …"
 * breadcrumb was removed in the declutter close-out.)
 *
 * EVIDENCE DISCIPLINE: cities and cards come straight from concerns-data — only cities with a real
 * answer are shown, gaps are never padded, and each card preserves concern→answer-fit, the [TK]
 * honesty chips (incl. the "worst part" structure-shown / readings-[TK] caveat), and provenance.
 * Inferred-voice labelling is explicit. No BC photography, no fabricated figures.
 *
 * Key exports: default page component, generateStaticParams, generateMetadata
 * External dependencies: next/navigation, @/components/concept (BcHeader, BcFooter, ConceptHero,
 *   ConceptSectionHeader, ConceptCard, InfoTooltip — the "i" affordance holding the
 *   inferred-voice note), the co-located CITIES_CHROME config + EntryCard, concerns-data (CONCERNS,
 *   concernByKey, citiesWithAnswersFor).
 *
 * Route: /ux-concepts/cities/[concern]
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BcHeader,
  BcFooter,
  ConceptHero,
  ConceptSectionHeader,
  ConceptCard,
  InfoTooltip,
} from "@/components/concept";
import { CITIES_CHROME } from "../_components/bc-chrome.config";
import { EntryCard } from "../_components/EntryCard";
import {
  CONCERNS,
  concernByKey,
  citiesWithAnswersFor,
} from "../_data/concerns-data";

interface ConcernPageProps {
  params: Promise<{ concern: string }>;
}

/**
 * One line per concern on why the worry is universal across cities — the "shared challenge"
 * framing, paired with the resident voice in the hero. Kept here (page chrome copy) rather than in
 * the data layer. Authored, not a figure. Mirrors the landing's UNIVERSALITY map.
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

/** Pre-generate one page per concern in the deck. */
export function generateStaticParams() {
  return CONCERNS.map((c) => ({ concern: c.key }));
}

export async function generateMetadata({
  params,
}: ConcernPageProps): Promise<Metadata> {
  const { concern: key } = await params;
  const concern = concernByKey(key);
  return {
    title: concern
      ? `${concern.voice} — Resident Concerns (Breathe Cities concept mock)`
      : "Concern — Resident Concerns (Breathe Cities concept mock)",
  };
}

export default async function ConcernPage({ params }: ConcernPageProps) {
  const { concern: key } = await params;
  const concern = concernByKey(key);
  if (!concern) notFound();

  // Only the cities that actually have a documented answer for this concern — "some cities, not
  // all". Each city's cards are rendered together under its name.
  const answeredCities = citiesWithAnswersFor(concern);

  return (
    // Chrome is rendered per-page (the Cities concept's structural pattern). The PrototypeHeader
    // tooling bar (sole back-to-hub) sits above, added by cities/layout.tsx.
    <main className="min-h-screen bg-background">
      <BcHeader config={CITIES_CHROME} />

      {/* ── (1) The shared challenge ─────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-20">
          {/* Eyebrow-less hero (shared ConceptHero, no `eyebrow` prop): the resident question +
              why it's universal. */}
          <ConceptHero
            headline={`“${concern.voice}”`}
            body={UNIVERSALITY[concern.key]}
          >
            {/* Inferred-voice honesty — kept (evidence discipline) but tucked behind an "i"
                tooltip, with a minimal visible "inferred" cue so the honesty signal isn't lost.
                The "A challenge cities share" badge and the "Fanned by …" axis descriptor were
                removed in the declutter pass. */}
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold">inferred</span>
              <InfoTooltip label="What “inferred” means here">
                This concern is inferred — a worry commonly raised by communities, voiced in
                residents&rsquo; words. It is a framing device, not a survey of any one city.
              </InfoTooltip>
            </p>
          </ConceptHero>
        </div>
      </section>

      {/* ── (2) How some BC cities answered it ───────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <ConceptSectionHeader
            heading="How some Breathe Cities answered it"
            body="Only cities with a documented, sourced answer appear here — some cities, not all. Tap any card for the full story: what the city did, the outcome, and the source."
          />

          {answeredCities.map((city) => {
            const cityCards = concern.cards.filter(
              (card) => card.city === city.key,
            );
            return (
              <div key={city.key} className="space-y-4">
                {/* City sub-heading — the answers below are this city's. */}
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {city.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {city.country} · {city.populationLabel} people
                  </span>
                </div>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {city.mix}
                </p>
                {/* This city's answer cards — reused EntryCard, tap → popup (§4 + §7). */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cityCards.map((card) => (
                    <EntryCard key={card.id} card={card} city={city} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Defensive honest empty state — should not occur (a concern with zero answers would
              not be linked), but never render an empty section silently. */}
          {answeredCities.length === 0 && (
            <ConceptCard>
              <p className="text-sm text-muted-foreground">
                No city in this prototype has a documented answer for this concern yet. Peer-city
                answers will be added under the same evidence discipline.
              </p>
            </ConceptCard>
          )}
        </div>
      </section>

      {/* ── (3) Contribution to 2030 ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <ConceptCard className="max-w-3xl">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--bc-color-blue)" }}
            >
              Contribution to 2030
            </p>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              {concern.contribution}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Contribution framing only — no single action above moves the whole ambient number.
              These answers ladder toward Breathe Cities&rsquo; collective goal of 30% cleaner air
              by 2030.
            </p>
          </ConceptCard>
        </div>
      </section>

      <BcFooter />
    </main>
  );
}
