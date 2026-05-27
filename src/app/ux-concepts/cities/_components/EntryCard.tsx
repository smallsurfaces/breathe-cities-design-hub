/**
 * EntryCard.tsx — compact, graphical, scannable entry card for a concern page's answer grid.
 *
 * The data-visualisation face of one CITY ANSWER on a concern page (Jack's 2026-05-23 review: lean
 * data-viz, scan at a glance). After the concern-centric restructure (2026-05-25) the resident's
 * QUESTION is the concern-page header and these cards are the city answers under it. Each entry
 * card shows, at a glance:
 *   1. A category ICON (source/setting/action/place/actor) — shared ConcernIcon, large for scan.
 *   2. The §4 framing line — "Here's how {City} answered" — so the card reads as a city answer.
 *   3. A HEADLINE STAT (shared StatViz): a before→after progression, a single real figure, or a
 *      styled [TK] placeholder. The card's most representative REAL number — no fabrication.
 *   4. A minimal facet chip.
 *
 * TAP/CLICK → opens a modal (shadcn/base-ui Dialog) containing the FULL detailed card via the
 * reused ConcernCardView, which carries the §4 content order AND the §7 infographic (icon + stat).
 * Dismiss by overlay click, Esc, or the close button — all provided by DialogContent.
 *
 * The icon + stat use the SHARED concern-visuals primitives, so the grid face and the popup render
 * the same infographic. The old `isLead` localisation ring is GONE — the city switcher and per-city
 * lead state were retired with the restructure (the concern, not the city, is the organising unit).
 *
 * Light mode, functional colour only, no emoji.
 *
 * Key exports: EntryCard
 * External dependencies: shadcn Dialog/Card/Badge, concern-visuals, ConcernCardView, concerns-data
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConcernIcon, StatViz } from "./concern-visuals";
import { ConcernCardView } from "./ConcernCardView";
import { type ConcernCard, type City } from "../_data/concerns-data";

interface EntryCardProps {
  card: ConcernCard;
  city: City;
}

export function EntryCard({ card, city }: EntryCardProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Card
            role="button"
            tabIndex={0}
            aria-label={`How ${city.name} answered: ${card.facet}. Open full detail.`}
            className={[
              "group cursor-pointer p-5 text-left transition-all",
              "hover:shadow-md hover:ring-1 hover:ring-foreground/15",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
            ].join(" ")}
          />
        }
      >
        {/* Top row: category icon (~2x for at-a-glance data-viz) + city label. */}
        <div className="flex items-start justify-between gap-2">
          <ConcernIcon
            iconKey={card.iconKey}
            tileClassName="h-20 w-20"
            iconClassName="h-10 w-10"
          />
          <span className="text-xs text-muted-foreground">{city.name}</span>
        </div>

        {/* §4 framing line — the card is one city's answer to the page's question. */}
        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--bc-color-blue)" }}
        >
          Here&rsquo;s how {city.name} answered
        </p>

        {/* Hero: the headline stat (shared with the popup). */}
        <div className="mt-2">
          <StatViz stat={card.stat} />
        </div>

        {/* Minimal label: facet chip. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {card.facetLabel}
          </Badge>
        </div>
      </DialogTrigger>

      {/* Modal: the FULL detailed card (§4 order + §7 infographic), reused verbatim. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {/* Accessible title/description (visually carried by the card itself, so kept
            screen-reader-only to avoid duplication). */}
        <DialogTitle className="sr-only">
          {card.facet} — {city.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          How {city.name} answered its residents about{" "}
          {card.facetLabel.toLowerCase()}, the outcome, and why it could apply to
          your city.
        </DialogDescription>
        <ConcernCardView card={card} city={city} />
      </DialogContent>
    </Dialog>
  );
}
