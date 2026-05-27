/**
 * ConceptSectionHeader.tsx — the standard section heading block for concept prototypes.
 *
 * Purpose
 *   The shared "h2 + optional sub" pattern that opens each section on a concept page. Extracted
 *   from the repeated section headers on the AQ Network homepage (aq-network/page.tsx — "Member
 *   cities", "Collective goal & impact"), so every section heading reads identically.
 *
 * Colour (resolved canonical)
 *   The h2 uses `text-foreground` (= --bc-semantic-text = --bc-color-dark-blue in globals.css).
 *   The reference homepage h2s used `text-bc-dark-blue` while the city-profile h2s already used
 *   `text-foreground` (the same value) — `text-foreground` is the canonical choice and the
 *   homepage's `text-bc-dark-blue` was the outlier. Both render the same dark-blue; this uses the
 *   bridged shadcn semantic that works reliably here. Sub uses `text-muted-foreground` (bridged),
 *   max-w-2xl. No `*-bc-*` utility classes; no hardcoded hex.
 *
 * Key exports: ConceptSectionHeader (named)
 * External dependencies: none.
 */

/** Props for ConceptSectionHeader. */
type ConceptSectionHeaderProps = {
  /** The section heading (h2). */
  heading: string
  /** Optional muted sub-line beneath the heading. */
  body?: string
  /** Extra classes appended to the wrapper (layout/spacing only). */
  className?: string
}

/**
 * The section header: an h2 with an optional muted sub-paragraph. The caller owns vertical
 * rhythm via `className` (e.g. the `mt-16` between sections on the homepage).
 */
export function ConceptSectionHeader({
  heading,
  body,
  className,
}: ConceptSectionHeaderProps) {
  const wrapperClasses = ['space-y-2', className ?? '']
    .filter((part) => part.length > 0)
    .join(' ')

  return (
    <header className={wrapperClasses}>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        {heading}
      </h2>
      {body !== undefined && (
        <p className="max-w-2xl text-base text-muted-foreground">{body}</p>
      )}
    </header>
  )
}
