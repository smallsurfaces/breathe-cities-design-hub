/**
 * CityPanel.tsx — the city detail panel for the proof-directory globe (v3, category-led redesign).
 *
 * Purpose / what the user sees + does
 *   When a pin is opened on the ProofGlobe, this panel slides in — a MOBILE HALF-SHEET (peek, then
 *   drag to full) on small screens, a RIGHT-SIDE slide-in panel on desktop — while the globe stays
 *   visible behind a light scrim. It is the payoff of the toolkit hero: "here is exactly which of OUR
 *   catalogue capabilities this city already runs."
 *
 *   STICKY HEADER (every city): city name + country, region tag, and city POPULATION (the `~` carries
 *   the approximation — no Estimate pill; Fix 1/2). The one-line "Running N tools" proof summary was
 *   removed (Fix 2).
 *
 *   STORY LEAD (every city): a short, real one-line adoption story rendered at the TOP of the
 *   scrollable body, above the capability list (the approved hybrid: story first, then capabilities).
 *
 *   CATEGORY-LED CAPABILITY ROWS (the core v3 inversion — Fix 2):
 *     The panel now leads with OUR catalogue categories, not the city's tools. Rows are AUTO-DERIVED:
 *     for the open city we iterate the catalogue capabilities in CATALOGUE ORDER (COMPONENT_ENTRIES
 *     then GUIDANCE_ENTRIES, imported read-only from the locked toolkit config) and, for each, collect
 *     the city's tools that match it. The match uses the SHARED toolMatchesCapability predicate (same
 *     one the catalogue prevalence counts use, factored into proof-cities.ts) keyed off
 *     CATALOGUE_PROOF_KEYWORDS, so the panel and the counts can never disagree. A capability with >=1
 *     matching tool becomes a row; a capability with none is omitted. One tool may match several
 *     capabilities and therefore appear under several rows (intended — it shows one product covering
 *     several capabilities). Tools matching NO capability are hidden entirely.
 *     - Collapsed row LEADS WITH OUR CATEGORY: capability.title + a small tier tag (Component /
 *       Guidance, from capability.tier) + a trailing chevron affordance.
 *     - Tap a row → it expands as an accordion (ONE open at a time), listing the city's matching
 *       product(s) for that capability. For EACH product: its name + one-line blurb + optional
 *       "via <provider>" label + the CTA. CTA (Fix 3): a real URL renders the primary "See the tool →"
 *       (new tab); NO URL renders NOTHING (the old disabled "Link coming soon" placeholder is gone).
 *
 *   REGION-FACTUAL PEER BLOCK (Finding 6 peer-learning cue — at the FOOT of the body):
 *     Below the capability list, a small muted region-factual label (peerBlockLabel — e.g. "Other
 *     African cities", with a neutral "Other cities in the region" fallback; the retired "Cities like
 *     yours" wrongly presumed we knew the visitor's own city) followed by the OTHER plotted cities in
 *     the SAME region as tappable chips. This is peer-learning, NOT a ranking: no scores,
 *     no order-by-anything, no leading/behind language. Tapping a chip swaps the open city
 *     (onSelectPeer), and the panel's city-change effect resets row/sheet state so the peer opens
 *     clean. The block renders nothing when there are no peers.
 *
 * Mobile half-sheet mechanic
 *   Opens at ~55% viewport height (peek — globe stays visible above). A drag handle / tap expands it
 *   to full height for cities with many capabilities; tapping again collapses back to peek. Desktop
 *   ignores the peek/full state — it is a full-height right-side panel.
 *
 * Honesty (the project's backbone — v3)
 *   The CTA link-state is the SOLE honesty mechanic: a "See the tool →" link fires ONLY on a real
 *   proven-live URL; where we hold no URL the CTA slot renders NOTHING (Fix 3) — so a city can still
 *   show it RUNS a capability even where we hold no proven link, without a dead/placeholder control.
 *   Every tool is real and research-grounded (the illustrative/educated-guess concept is retired).
 *   Third-party links are framed "see the tool this city uses" via the provider label. Population is
 *   city population (the `~` signals approximation), never implied reach.
 *
 * Styling (concept-prototyping standard)
 *   BC tokens only, no hardcoded hex. Bridged shadcn semantics for neutrals; inline `var(--bc-*)`
 *   for the functional category tint. Light mode only.
 *
 * Key exports: CityPanel (named)
 * External dependencies: react, lucide-react, ../_data/proof-cities (types + shared match predicate),
 *   ../_components/catalogue-proof.config (keyword map, read-only),
 *   ./toolkit-catalogue.local.config (catalogue capabilities, concept-local vendored copy).
 *
 * Side effects (all cleaned up):
 *   - Attaches a keydown listener for Escape-to-close while a city is open; removed on close/unmount.
 *   - Resets the open-row + sheet-expanded state whenever a different city opens (via effect).
 */

'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { X, ArrowRight, ChevronDown } from 'lucide-react'
import type { ProofCity, ProofTool } from '../_data/proof-cities'
import { toolMatchesCapability } from '../_data/proof-cities'
import { CATALOGUE_PROOF_KEYWORDS } from './catalogue-proof.config'
import {
  COMPONENT_ENTRIES,
  GUIDANCE_ENTRIES,
} from './toolkit-catalogue.local.config'
import type {
  CatalogueEntry,
  CatalogueTier,
} from './toolkit-catalogue.local.config'

/**
 * Catalogue capabilities in CANONICAL ORDER — components first, then guidance — read-only from the
 * locked toolkit config. This is the iteration order for the panel's category-led rows (Fix 2): the
 * panel walks this list and keeps the capabilities the open city has >=1 matching tool for.
 */
const CATALOGUE_CAPABILITIES: readonly CatalogueEntry[] = [...COMPONENT_ENTRIES, ...GUIDANCE_ENTRIES]

/**
 * One category-led row for the open city: a catalogue capability plus the city's tools that match it
 * (>=1 — rows with no match are never built). The auto-derived unit the panel renders (Fix 2).
 */
type CapabilityRow = {
  /** The catalogue capability this row leads with. */
  capability: CatalogueEntry
  /** The open city's tools that matched this capability, in the city's natural array order. */
  tools: ProofTool[]
}

/**
 * Build the open city's category-led rows: iterate catalogue capabilities in canonical order, collect
 * each city's tools that match (shared toolMatchesCapability predicate keyed off CATALOGUE_PROOF_KEYWORDS),
 * and keep only capabilities with >=1 match. A tool may appear under several capabilities (intended);
 * tools matching no capability are dropped. Pure — no side effects.
 */
function buildCapabilityRows(city: ProofCity): CapabilityRow[] {
  const rows: CapabilityRow[] = []
  for (const capability of CATALOGUE_CAPABILITIES) {
    const keywords = CATALOGUE_PROOF_KEYWORDS[capability.id] ?? []
    const matchedTools = city.tools.filter((tool) => toolMatchesCapability(tool, keywords))
    if (matchedTools.length > 0) {
      rows.push({ capability, tools: matchedTools })
    }
  }
  return rows
}

/** Props for CityPanel. `city` null = closed (the panel renders nothing). */
type CityPanelProps = {
  /** The open city, or null when the panel is closed. */
  city: ProofCity | null
  /** Called when the panel requests close (close button, scrim click, or Escape). */
  onClose: () => void
  /**
   * Peer cities for the region-factual peer block — the other plotted cities in the SAME region as
   * the open city (caller computes; excludes the open city itself). These are comparable peers for
   * peer-learning, NOT a ranking: pass them in natural array order, no sorting. Empty = block hidden.
   */
  peers: ProofCity[]
  /** Called with a peer city when a peer chip is tapped (caller swaps the open city). */
  onSelectPeer: (city: ProofCity) => void
}

/**
 * Functional tint for a tier tag. Component vs Guidance get distinct BC token tints via color-mix
 * (no new hex, no collision) — mirrors the roadmap StageBadge tinting pattern. Keyed off the catalogue
 * capability's tier ('component' | 'guidance') now that the row leads with OUR category (Fix 2).
 */
function tierTagStyle(tier: CatalogueTier): { backgroundColor: string; color: string } {
  // component → brand-blue tint; guidance → teal tint. Distinct base tokens, tinted to a soft wash.
  const base = tier === 'component' ? 'var(--bc-color-blue)' : 'var(--bc-color-teal)'
  return {
    backgroundColor: `color-mix(in srgb, ${base} 16%, var(--bc-color-white))`,
    color: 'var(--bc-semantic-text)',
  }
}

/** Human-readable label for a catalogue tier — the small tag shown beside the capability title. */
function tierLabel(tier: CatalogueTier): string {
  return tier === 'component' ? 'Component' : 'Guidance'
}

/**
 * Region-factual peer-block label. Maps a city's `region` to a region adjective and returns a label
 * that makes NO assumption about the visitor's own city (the retired "Cities like yours" presumed
 * we knew where the visitor was). Known regions read "Other <adjective> cities"; any unmapped region
 * falls back to the neutral "Other cities in the region".
 *
 * EU → "Other European cities", Africa → "Other African cities",
 * LatAm → "Other Latin American cities", SE Asia → "Other Southeast Asian cities".
 */
function peerBlockLabel(region: ProofCity['region']): string {
  const adjectiveByRegion: Record<string, string> = {
    EU: 'European',
    Africa: 'African',
    LatAm: 'Latin American',
    'SE Asia': 'Southeast Asian',
  }
  const adjective = adjectiveByRegion[region]
  return adjective === undefined ? 'Other cities in the region' : `Other ${adjective} cities`
}

/** Props for one category-led capability row. */
type CapabilityRowItemProps = {
  /** The auto-derived row: a catalogue capability + the open city's tools that matched it. */
  row: CapabilityRow
  /** Whether this row is the one currently expanded (accordion — one open at a time). */
  isOpen: boolean
  /** Toggle this row open/closed. */
  onToggle: () => void
}

/**
 * One product entry inside an expanded capability row: the city's matched product name + blurb +
 * optional "via <provider>" + the conditional CTA. CTA (Fix 3): a real `url` renders the active
 * "See the tool →" link (new tab); a null `url` renders NOTHING in the CTA slot — the old disabled
 * "Link coming soon" placeholder is gone.
 */
function MatchedProduct({ tool }: { tool: ProofTool }): ReactElement {
  const hasLink = tool.url !== null

  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      {/* Product name — the city's real product, under OUR category heading. */}
      <p className="text-sm font-semibold text-foreground">{tool.name}</p>
      {/* One-line blurb. */}
      <p className="mt-0.5 text-sm text-muted-foreground">{tool.blurb}</p>

      {/* Provider tag + conditional CTA. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tool.provider !== null && (
          <span className="text-xs text-muted-foreground">via {tool.provider}</span>
        )}

        {/* Conditional CTA — right-aligned (thumb-reachable). Real url → active link; null → nothing. */}
        {hasLink && (
          <span className="ml-auto">
            <a
              href={tool.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:underline"
              style={{ color: 'var(--bc-semantic-brand)' }}
            >
              See the tool
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * One CATEGORY-LED capability row (Fix 2). Collapsed: a single line — OUR capability title (truncates)
 * + a small tier tag (Component / Guidance) + chevron. Expanded (accordion, one at a time): lists the
 * open city's matching product(s) for that capability, each rendered via MatchedProduct (name + blurb
 * + optional provider + conditional CTA). One row can carry several products.
 */
function CapabilityRowItem({ row, isOpen, onToggle }: CapabilityRowItemProps): ReactElement {
  const { capability, tools } = row

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-background">
      {/* Collapsed line — the whole row is the toggle. Min-height meets the 56px touch target. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-h-[56px] w-full items-center gap-2.5 px-4 text-left transition-colors hover:bg-muted/50"
      >
        {/* OUR category title — leads the row (Fix 2). Truncates so the row never wraps when collapsed. */}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {capability.title}
        </span>
        {/* Small tier tag — functional colour (Component / Guidance), from capability.tier. */}
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={tierTagStyle(capability.tier)}
        >
          {tierLabel(capability.tier)}
        </span>
        {/* Trailing affordance — rotates to signal expanded. */}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Expanded content — the city's matched product(s) for this capability. */}
      {isOpen && (
        <div className="space-y-3 px-4 pb-4">
          {tools.map((tool) => (
            <MatchedProduct key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </li>
  )
}

/**
 * The city panel. Renders nothing when `city` is null. Otherwise: a light scrim over the globe; a
 * MOBILE HALF-SHEET (peek ~55%, drag handle expands to full) that becomes a RIGHT-SIDE panel on
 * desktop (`sm:` and up); a STICKY header (name / country / region / city population — `~` carries the
 * approximation, no Estimate pill, no proof-summary line); and a scrollable body that leads with the
 * one-line adoption story then lists the auto-derived, category-led capability rows (one open at a time).
 */
export function CityPanel({ city, onClose, peers, onSelectPeer }: CityPanelProps): ReactElement | null {
  // Which capability row is expanded (catalogue capability id). null = all collapsed. Accordion: one
  // open at a time.
  const [openCapabilityId, setOpenCapabilityId] = useState<string | null>(null)
  // Mobile half-sheet: false = peek (~55%), true = full height. Ignored on desktop (always full).
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false)

  // Side effect: reset row + sheet state whenever a DIFFERENT city opens (or the panel closes), so a
  // newly opened city starts collapsed at peek height rather than inheriting the last city's state.
  useEffect(() => {
    setOpenCapabilityId(null)
    setSheetExpanded(false)
  }, [city])

  // Side effect: Escape-to-close while a city is open. Listener added on open, removed on close /
  // unmount (deps include `city` so it re-binds correctly and tears down when the panel closes).
  useEffect(() => {
    if (city === null) {
      return
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [city, onClose])

  if (city === null) {
    return null
  }

  // Auto-derived category-led rows for the open city (Fix 2): catalogue capabilities (canonical order)
  // the city has >=1 matching tool for. A city that matches no capability yields an empty list and the
  // capability section renders nothing (the story still shows) — no invented fallback.
  const capabilityRows = buildCapabilityRows(city)

  // Mobile sheet height: peek vs full. Desktop overrides both via `sm:inset-y-0` + `sm:h-auto`.
  const sheetHeightClass = sheetExpanded ? 'h-[90vh]' : 'h-[55vh]'

  return (
    <div className="absolute inset-0 z-30">
      {/* Light scrim — globe stays visible behind it. Click to close. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close city panel"
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/10 backdrop-blur-[1px]"
      />

      {/*
        Panel surface.
        Mobile: bottom half-sheet — peek (~55vh) or full (~90vh), anchored bottom, rounded top.
        Desktop (sm+): right-side panel — full height of the globe area, fixed width, rounded left.
        The globe wrapper is `relative` so this `absolute` panel scopes to the globe, not the page.
      */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${city.name} tools`}
        className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border border-border bg-background shadow-xl transition-[height] duration-200 ${sheetHeightClass} sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[400px] sm:rounded-l-2xl sm:rounded-tr-none`}
      >
        {/* Mobile drag handle — tap to toggle peek/full. Hidden on desktop (panel is always full). */}
        <button
          type="button"
          onClick={() => setSheetExpanded((v) => !v)}
          aria-label={sheetExpanded ? 'Collapse panel' : 'Expand panel to full height'}
          className="flex w-full shrink-0 items-center justify-center py-2.5 sm:hidden"
        >
          <span className="h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
        </button>

        {/* STICKY HEADER — stays pinned while the tool list scrolls. */}
        <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-5 pb-4 pt-3 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bc-color-blue) 12%, var(--bc-color-white))',
                color: 'var(--bc-semantic-text)',
              }}
            >
              {city.region}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* City name + country. */}
          <h3 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground">{city.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{city.country}</p>

          {/* City population — one compact line. The leading `~` carries the approximation; the old
              Estimate pill and the "Running N tools" proof-summary line were removed (Fix 2). */}
          <div className="mt-3 text-sm text-muted-foreground">
            <span className="tabular-nums">{`~${city.population.toLocaleString()}`} residents</span>
          </div>
        </div>

        {/* SCROLLABLE BODY — a short real adoption story (lead), then category-led capability rows. */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {/* Story lead — the approved hybrid: story first, capabilities below. Muted concept-layer copy. */}
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{city.story}</p>
          {/* Category-led rows (Fix 2): OUR catalogue capabilities the city has matching tools for.
              Renders nothing if the city matched no capability (story still shows above). */}
          {capabilityRows.length > 0 && (
            <ul className="space-y-2.5">
              {capabilityRows.map((row) => (
                <CapabilityRowItem
                  key={row.capability.id}
                  row={row}
                  isOpen={openCapabilityId === row.capability.id}
                  onToggle={() =>
                    setOpenCapabilityId((cur) => (cur === row.capability.id ? null : row.capability.id))
                  }
                />
              ))}
            </ul>
          )}

          {/*
            REGION-FACTUAL PEER BLOCK — Finding 6 peer-learning cue, appended below the tools.
            Peers are the same-region cities (computed + passed by the caller). Peer-learning, NOT a
            ranking: chips render in natural order, no scores, no leading/behind copy. Hidden when
            there are no peers.
          */}
          {peers.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              {/* Small muted label — matches the file's uppercase/tracking-wide/muted small-label idiom.
                  Region-factual copy (peerBlockLabel) — no presumption of the visitor's own city. */}
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {peerBlockLabel(city.region)}
              </p>
              {/* Tappable peer chips — bordered, rounded-full, neutral on-token surface; ~44px tap size. */}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {peers.map((peer) => (
                  <button
                    key={peer.slug}
                    type="button"
                    onClick={() => onSelectPeer(peer)}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {peer.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
