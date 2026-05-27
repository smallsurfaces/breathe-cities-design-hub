/**
 * concern-visuals.tsx — the shared infographic primitives for the Resident Concerns deck.
 *
 * Purpose
 *   Holds the two pieces of the card's "infographic" — the category ICON map and the headline
 *   STAT renderer (StatViz) — in ONE module so BOTH the compact EntryCard (the grid face) AND the
 *   ConcernCardView (the detail popup) render them identically. Before the concern-centric
 *   restructure these lived inside EntryCard; the popup was text-only. §7 of the Resident Concerns
 *   queue requires the popup to carry the infographic too (the category icon + the visual stat),
 *   so they are extracted here and shared, which also avoids a circular import (EntryCard imports
 *   ConcernCardView for the dialog body; both now import these visuals instead of each other).
 *
 *   Icon size is caller-controlled (the `className` on <Icon>), so the grid card can show a large
 *   ~2x icon while the popup header shows a smaller inline one — same glyph, same meaning, sized
 *   for context.
 *
 * Tokens & honesty
 *   The [TK] evidence-gap chip uses the AQI-moderate (amber-family) token — the same honesty
 *   signal used across the concept family — never an invented number. Headline figures are capped
 *   at the shared text-3xl scale. Light mode, no emoji (icons are lucide glyphs).
 *
 * Key exports: ConcernIcon (named), StatViz (named)
 * External dependencies: lucide-react, concerns-data types
 */

import {
  Factory,
  Car,
  Flame,
  CookingPot,
  Wind,
  School,
  Footprints,
  Home,
  Radar,
  Route,
  HandCoins,
  Megaphone,
  MapPin,
  Landmark,
  Scale,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { type IconKey, type EntryStat } from "../_data/concerns-data";

/**
 * Icon-key → lucide icon. Lives in the presentation layer so the data stays
 * presentation-agnostic. "coal" uses Flame (lucide has no coal glyph); "dust"
 * uses Wind; "data" uses Radar (sensing). Kept simple and consistent.
 */
const ICONS: Record<IconKey, LucideIcon> = {
  coal: Flame,
  factory: Factory,
  car: Car,
  cooking: CookingPot,
  dust: Wind,
  school: School,
  commute: Footprints,
  home: Home,
  data: Radar,
  // ACTION (what can I do?) — protect yourself / change the system
  route: Route, // clean-air route / protective tool
  grants: HandCoins, // a grant a resident can take up
  campaign: Megaphone, // a civic campaign residents drove
  // PLACE (which part of my city?) — neighbourhood comparison
  place: MapPin,
  // ACTOR (make the polluters stop?) — who must act
  cityGov: Landmark, // city government acted
  regulator: Scale, // a regulator / law banned or charged the polluter
  national: ShieldCheck, // national government forcing function
};

/**
 * The category icon for a card, in a rounded muted tile. The tile and glyph sizes are
 * caller-controlled via `tileClassName` / `iconClassName` so the grid card (large) and the popup
 * header (smaller, inline) share the same glyph at context-appropriate sizes.
 */
export function ConcernIcon({
  iconKey,
  tileClassName,
  iconClassName,
}: {
  iconKey: IconKey;
  tileClassName: string;
  iconClassName: string;
}) {
  const Icon = ICONS[iconKey];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-muted text-foreground ${tileClassName}`}
    >
      <Icon aria-hidden="true" className={iconClassName} />
    </span>
  );
}

/**
 * Renders the headline stat for a card. Three honest shapes, mirroring the EntryStat union: a
 * before→after progression, a single real figure, or a styled [TK] placeholder consistent with the
 * detailed card's [figure TK] chip. Shared by the grid card and the popup so the visual stat reads
 * identically in both.
 */
export function StatViz({ stat }: { stat: EntryStat }) {
  if (stat.kind === "tk") {
    return (
      <div className="flex flex-col items-start gap-1">
        {/* Functional evidence-gap chip — AQI-moderate (amber-family) token, consistent
            across the concept. */}
        <span
          className="rounded px-1.5 py-0.5 font-mono text-xs font-semibold"
          style={{
            backgroundColor: "var(--bc-semantic-aqi-moderate-bg)",
            color: "var(--bc-semantic-aqi-moderate-text)",
          }}
        >
          [TK]
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {stat.metric}
        </span>
      </div>
    );
  }

  if (stat.kind === "figure") {
    return (
      <div className="flex flex-col items-start gap-1">
        {/* Headline number capped at the shared ConceptStat text-3xl scale. */}
        <span className="text-3xl font-bold leading-none tracking-tight text-foreground">
          {stat.value}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {stat.metric}
        </span>
      </div>
    );
  }

  // progression — before → after, both real
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-2">
        <span className="text-base font-medium text-muted-foreground">
          {stat.from}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-muted-foreground/70"
        />
        <span className="text-3xl font-bold leading-none tracking-tight text-foreground">
          {stat.to}
        </span>
      </span>
      <span className="text-xs leading-snug text-muted-foreground">
        {stat.metric}
      </span>
    </div>
  );
}
