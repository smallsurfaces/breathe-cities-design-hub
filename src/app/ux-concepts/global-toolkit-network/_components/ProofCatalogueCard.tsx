/**
 * ProofCatalogueCard.tsx — concept-local catalogue card for the proof-directory page (prevalence-only).
 *
 * Purpose
 *   A FORK of the toolkit `CatalogueCard`, owned by this concept so the proof-directory landing can
 *   show, per capability, a single honest prevalence-counter line WITHOUT mutating the shared/locked
 *   toolkit card (isolation constraint, spec §5 + section brief §"full isolation"). It renders the
 *   same capability card — status badge, title + blurb, sketch preview — plus one muted counter line.
 *
 * What this card shows (and what it no longer shows)
 *   The card now shows ONLY a prevalence counter: "{N} BC cities offer something like this for their
 *   citizens". The earlier expandable "See how cities deploy this" toggle and the per-city chip list
 *   created too much noise on the landing-page cards; both have been REMOVED. The detailed per-city
 *   deployment list (which cities, with links to each city's own tool) moves to a component detail
 *   page (separate task) — the data helper for it is preserved, just not rendered here.
 *
 *   Honesty of the copy: "offer something like this for their citizens" — each city runs its OWN
 *   version of the capability serving its residents; it never implies they adopted the BC component.
 *
 *   Affordance mirrors the shared card:
 *     - AVAILABLE → the whole card content is a link to the live route (hover lift, "Available" badge).
 *     - COMING SOON → a de-emphasised, unlinked card with a muted "Coming soon" badge.
 *
 * Why a fork, not a prop on the shared card
 *   The shared toolkit `CatalogueCard` is consumed by the locked toolkit landing; adding this
 *   treatment there would change that surface too. Forking concept-local keeps the locked concept
 *   untouched. The ToolPreview sketch + the CatalogueEntry type ARE imported read-only from the
 *   toolkit concept (shared content, allowed).
 *
 * Concept-local route override (added with the detail-page copy)
 *   The available 'monitoring' entry's `href` (from the LOCKED toolkit catalogue config) points at the
 *   toolkit's own detail route. This concept owns a COPY of that detail page, so the card consults
 *   CONCEPT_ROUTE_OVERRIDES (concept-routes.config.ts) first and links to the concept-local route when
 *   one is registered for the entry id, else falls back to `entry.href`. The locked config is untouched.
 *
 * Key exports: ProofCatalogueCard
 * External dependencies: next/link, @/components/concept (ConceptCard), concept-local ToolPreview +
 *   CatalogueEntry (./ToolPreview.local, ./toolkit-catalogue.local.config), ./concept-routes.config
 *   (CONCEPT_ROUTE_OVERRIDES).
 *
 * Token discipline: badge and counter line use bridged/inline BC tokens — functional status colour
 *   and muted neutral, not decoration. Light mode. No emoji. Server-compatible (no client state).
 */

import Link from 'next/link'
import { ConceptCard } from '@/components/concept'
import { ToolPreview } from './ToolPreview.local'
import type { CatalogueEntry } from './toolkit-catalogue.local.config'
import { CONCEPT_ROUTE_OVERRIDES } from './concept-routes.config'

/** Status badge — brand chip for Available, muted chip for Coming soon. Text only, no emoji. */
function StatusBadge({ status }: { status: CatalogueEntry['status'] }) {
  if (status === 'available') {
    return (
      <span
        className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
        style={{
          backgroundColor: 'var(--bc-semantic-aqi-good-bg)',
          color: 'var(--bc-semantic-aqi-good-text)',
        }}
      >
        Available
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Coming soon
    </span>
  )
}

/**
 * The prevalence counter: a single muted line reporting how many BC cities offer their own version of
 * this capability for their citizens. Renders nothing when no city offers it (cityCount === 0). The
 * copy is honest — it describes cities offering "something like this" for their residents, never an
 * adoption of the BC component. The per-city deployment list is reserved for the component detail page.
 */
function PrevalenceCounter({ cityCount }: { cityCount: number }) {
  if (cityCount === 0) {
    return null
  }

  const countLabel =
    cityCount === 1
      ? '1 city already runs its own version'
      : `${cityCount} cities already run their own version`

  return (
    <p className="mt-auto border-t border-border pt-2.5 text-xs font-medium text-muted-foreground">
      {countLabel}
    </p>
  )
}

/** The card inner: title row (with badge), blurb, and the sketch preview. */
function CardInner({ entry }: { entry: CatalogueEntry }) {
  const isAvailable = entry.status === 'available'
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{entry.title}</h3>
        <StatusBadge status={entry.status} />
      </div>
      <p className="text-sm text-muted-foreground">{entry.blurb}</p>
      {/* Sketch preview — kept for both states; drained on coming-soon so Available wins focus. */}
      <div
        className="mt-1"
        style={{
          opacity: isAvailable ? 1 : 0.55,
          filter: isAvailable ? 'none' : 'grayscale(0.6)',
        }}
      >
        <ToolPreview id={entry.id} />
      </div>
    </>
  )
}

/** Props for the concept-local catalogue card. */
type ProofCatalogueCardProps = {
  /** The catalogue entry (read-only from the toolkit config). */
  entry: CatalogueEntry
  /** How many BC cities offer their own version of this capability — drives the prevalence counter. */
  cityCount: number
}

/**
 * A catalogue card with a single prevalence-counter line. Available entries link the whole card
 * content to the live route (full opacity + hover lift); coming-soon entries render a plain
 * de-emphasised card with no route link. The counter sits under the content in both states.
 * Server-compatible — no client state.
 */
export function ProofCatalogueCard({ entry, cityCount }: ProofCatalogueCardProps) {
  // Concept-local route override: this concept owns a copy of the detail page, so the card links to
  // the concept-local route when one is registered for this entry id, else falls back to entry.href.
  const resolvedHref = CONCEPT_ROUTE_OVERRIDES[entry.id] ?? entry.href

  // Available + has a route → the whole card content links to the route.
  if (entry.status === 'available' && resolvedHref !== null) {
    return (
      <ConceptCard className="flex h-full flex-col gap-2.5">
        <Link
          href={resolvedHref}
          className="group flex h-full flex-col gap-2.5 rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${entry.title}: available. Explore this tool.`}
        >
          <CardInner entry={entry} />
          <span
            className="pt-1 text-sm font-medium"
            style={{ color: 'var(--bc-semantic-brand)' }}
          >
            Explore this tool →
          </span>
          <PrevalenceCounter cityCount={cityCount} />
        </Link>
      </ConceptCard>
    )
  }

  // Coming soon → de-emphasised, not linked.
  return (
    <ConceptCard className="flex h-full flex-col gap-2.5 opacity-90">
      <CardInner entry={entry} />
      <PrevalenceCounter cityCount={cityCount} />
    </ConceptCard>
  )
}
