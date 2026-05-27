/**
 * ConceptHero.tsx — the standard page hero for concept prototypes.
 *
 * Purpose
 *   The shared hero block: an OPTIONAL small uppercase brand-blue eyebrow, a single h1 headline,
 *   a muted lead paragraph, and an optional children slot beneath (for hero-adjacent content the
 *   page wants directly under the lead). Extracted from the AQ Network homepage header
 *   (aq-network/page.tsx) so every concept opens with the SAME hero shape and type scale.
 *
 *   The eyebrow is OPTIONAL — when omitted, the hero renders headline + body + children with no
 *   eyebrow element in the DOM. This subsumed the former ConceptHeroPlain wrapper (deleted in the
 *   ds-tidy pass): every caller that previously used <ConceptHeroPlain> now uses <ConceptHero>
 *   without an `eyebrow` prop and gets identical markup to before.
 *
 * Caps
 *   The h1 is capped at `sm:text-4xl` — never larger — matching the reference homepage hero
 *   (`text-3xl sm:text-4xl`). This is deliberate: a concept hero must not introduce a bigger
 *   display size than the established hub scale.
 *
 * Colour (resolved canonical)
 *   - Eyebrow (when present): brand blue, set inline as `var(--bc-color-blue)` (the reference's
 *     `text-bc-blue`, converted to the robust inline-token mechanism per the project styling
 *     convention).
 *   - Headline: `text-foreground`, which in globals.css resolves to --bc-semantic-text =
 *     --bc-color-dark-blue — the SAME value the reference's `text-bc-dark-blue` h1 produced, via
 *     the bridged shadcn semantic that works reliably in this Tailwind v4 config.
 *   - Body: `text-muted-foreground` (bridged), max-w-2xl, base size.
 *   No `*-bc-*` utility classes; no hardcoded hex.
 *
 * Key exports: ConceptHero (named)
 * External dependencies: react (ReactNode).
 */

import type { ReactNode } from 'react'

/** Props for ConceptHero. */
type ConceptHeroProps = {
  /**
   * Optional small uppercase eyebrow above the headline (brand blue). When omitted, the eyebrow
   * element is not rendered — the hero opens with the h1.
   */
  eyebrow?: string
  /** The h1 headline (capped at sm:text-4xl). */
  headline: string
  /** The muted lead paragraph beneath the headline. */
  body: string
  /** Optional content rendered directly beneath the lead (hero-adjacent slot). */
  children?: ReactNode
}

/**
 * The hero block. Renders the optional eyebrow → h1 → lead, then the optional children slot. The
 * h1 size is fixed at text-3xl/sm:text-4xl (the cap); colour comes from bridged semantics + one
 * inline brand-blue eyebrow token. When `eyebrow` is undefined, no eyebrow <p> is rendered (the
 * DOM matches the former ConceptHeroPlain output exactly).
 */
export function ConceptHero({
  eyebrow,
  headline,
  body,
  children,
}: ConceptHeroProps) {
  return (
    <header className="space-y-3">
      {eyebrow !== undefined && (
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--bc-color-blue)' }}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {headline}
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground">{body}</p>
      {children}
    </header>
  )
}
