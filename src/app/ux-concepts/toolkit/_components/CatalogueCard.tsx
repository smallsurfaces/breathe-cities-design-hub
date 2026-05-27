/**
 * CatalogueCard.tsx — one capability card on the toolkit landing catalogue.
 *
 * Purpose
 *   Renders a single catalogue entry as a card: a status badge, the title + blurb, and the
 *   capability's sketch preview. The card's affordance follows its status:
 *     - AVAILABLE  → the WHOLE card is a link to the live route, at full opacity, with a hover lift
 *       and an "Available" badge. (Real-time Monitoring is the only one today.)
 *     - COMING SOON → a plain, de-emphasised card (reduced opacity, the sketch greyed) with a muted
 *       "Coming soon" badge. NOT linked — there is nowhere to go yet, so it must not look clickable.
 *
 *   The sketch preview is kept for BOTH states (the brief: keep the sketch panel as a preview); the
 *   coming-soon treatment just drains it so the available card wins attention.
 *
 * Key exports: CatalogueCard
 * External dependencies: next/link, @/components/concept (ConceptCard), ./ToolPreview (the sketch),
 *   ./toolkit-catalogue.config (CatalogueEntry)
 *
 * Token discipline: badges use bridged/inline BC tokens (brand for Available, muted for Coming
 *   soon) — functional status colour, not decoration. Light mode. No emoji.
 */

import Link from 'next/link'
import { ConceptCard } from '@/components/concept'
import { ToolPreview } from './ToolPreview'
import type { CatalogueEntry } from './toolkit-catalogue.config'

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

/**
 * A catalogue card. Available entries wrap the whole card in a Link (full opacity + hover lift);
 * coming-soon entries render a plain de-emphasised card with no link.
 */
export function CatalogueCard({ entry }: { entry: CatalogueEntry }) {
  // Available + has a route → the whole card is a link.
  if (entry.status === 'available' && entry.href !== null) {
    return (
      <Link
        href={entry.href}
        className="group block rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${entry.title} — available, open the component`}
      >
        <ConceptCard className="flex h-full flex-col gap-2.5 transition-shadow group-hover:shadow-md">
          <CardInner entry={entry} />
          <span
            className="mt-auto pt-1 text-sm font-medium"
            style={{ color: 'var(--bc-semantic-brand)' }}
          >
            Open the component →
          </span>
        </ConceptCard>
      </Link>
    )
  }

  // Coming soon → de-emphasised, not linked.
  return (
    <ConceptCard className="flex h-full flex-col gap-2.5 opacity-90">
      <CardInner entry={entry} />
    </ConceptCard>
  )
}
