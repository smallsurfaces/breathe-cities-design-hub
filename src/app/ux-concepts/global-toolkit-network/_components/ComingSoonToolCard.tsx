/**
 * ComingSoonToolCard.tsx — concept-local catalogue card for the three illustrative example tools
 * (AQ Patterns, Air Window, City Futures), rendered INSIDE the Components catalogue grid of the
 * Global Toolkit Network concept.
 *
 * Purpose
 *   After the v2 founder review the example tools no longer live in a standalone "Tailored tools"
 *   section. Each is now a "Coming soon" card appended to the Components grid (page.tsx Section 2),
 *   sitting uniformly alongside the real COMPONENT_ENTRIES cards rendered by ProofCatalogueCard. This
 *   card mirrors that card's structure so the two read as one grid: ConceptCard
 *   (`flex h-full flex-col gap-2.5`), a title row (h3 + the muted "Coming soon" StatusBadge), the
 *   muted blurb, then the preview image in the preview slot.
 *
 * What this card shows (and what it does NOT)
 *   One full-colour representative preview image, the locked blurb, and a muted "Coming soon" badge.
 *   There is NO prevalence counter, NO stat line, and NO link/CTA — these tools are illustrative
 *   concepts, not navigable. The "Coming soon" badge is the only status marker.
 *
 * Image treatment (differs from the sketch coming-soon cards)
 *   Unlike the sketch ToolPreview on a coming-soon ProofCatalogueCard, this image stays FULL-COLOUR —
 *   it is the showcase, not a de-emphasised sketch — so it does NOT take the grayscale/opacity drain.
 *   Rendered with next/image (the PNGs are large, ~0.6–1.6MB each); intrinsic dimensions are passed so
 *   the optimizer can size and lazy-load it, and `className="h-auto w-full"` keeps it responsive within
 *   the grid cell while preserving the 2880×2048 aspect ratio.
 *
 * Token discipline: badge uses the same muted neutral chip as ProofCatalogueCard's coming-soon badge
 *   (border / muted / muted-foreground). The card chrome is neutral; colour lives only inside the
 *   screenshot, which is content (functional-colour rule). Light mode. No emoji. Server-compatible.
 *
 * Key exports: ComingSoonToolCard (named).
 * External dependencies: next/image, @/components/concept (ConceptCard), ./example-tools.config (type).
 */

import Image from 'next/image'
import { ConceptCard } from '@/components/concept'
import type { ExampleTool } from './example-tools.config'

/** Intrinsic pixel dimensions of every example-tool screenshot (all share this size). */
const IMAGE_WIDTH = 2880
const IMAGE_HEIGHT = 2048

/**
 * Muted "Coming soon" badge — matches the ProofCatalogueCard coming-soon StatusBadge treatment so the
 * example-tool cards read as part of the same Components grid. Text only, no emoji.
 */
function StatusBadge() {
  return (
    <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Coming soon
    </span>
  )
}

/** Props for ComingSoonToolCard. */
type ComingSoonToolCardProps = {
  /** The example tool to render — name, locked blurb, and its single preview image. */
  tool: ExampleTool
}

/**
 * Renders a single example tool as a "Coming soon" catalogue card. Server component, no client state.
 * Structure mirrors ProofCatalogueCard so the card sits uniformly in the Components grid: title row
 * (h3 + badge), blurb, then the full-colour preview image in the preview slot. No link, no CTA, no
 * counter.
 */
export function ComingSoonToolCard({ tool }: ComingSoonToolCardProps) {
  return (
    <ConceptCard className="flex h-full flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{tool.name}</h3>
        <StatusBadge />
      </div>
      <p className="text-sm text-muted-foreground">{tool.description}</p>
      {/* Preview image — kept FULL-COLOUR (the showcase); no grayscale/opacity de-emphasis. */}
      <div className="mt-1 overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={tool.image}
          alt={tool.imageAlt}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-auto w-full"
        />
      </div>
    </ConceptCard>
  )
}
