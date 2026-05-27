/**
 * ConfidentialFooter.tsx — persistent confidential-framing strip shown on every route.
 *
 * Purpose
 *   The breathe-cities-design-hub site is a public client-review URL. This footer is the
 *   single framing affordance that tells reviewers the prototypes are confidential and not
 *   for redistribution. Mounted by the root layout so it appears on every surface (landing
 *   + the four concept routes + any dynamic sub-routes).
 *
 *   Placement: rendered at the bottom of the document body as a fixed-position strip pinned
 *   to the viewport bottom. Fixed (not in-flow) so it stays visible even on long-scrolling
 *   concept pages without the page needing to know about it. A bottom pad on the html body
 *   would conflict with concept layouts that own their own bottom spacing, so we stick to
 *   fixed positioning here and rely on the strip's quiet styling to coexist with concept
 *   content.
 *
 *   z-index sits ABOVE the PrototypeHeader (z-[105]) and the annotation overlay layers so
 *   the framing is never hidden by another sticky chrome — z-[200] is deliberately well
 *   above the AnnotationLayer stack documented in PrototypeHeader (90 / 100 / 101 / 102 /
 *   105 / 110).
 *
 *   Styling: BC semantic tokens only. Token-aligned muted background and quiet text. No
 *   hardcoded hex. No emoji.
 *
 * Key exports: ConfidentialFooter (default)
 * External dependencies: none (pure presentation).
 */

/** Locked framing copy. Do not edit without an explicit decision. */
const CONFIDENTIAL_TEXT =
  'Breathe Cities — Confidential prototypes for CAF / C40 / Bloomberg review. Please do not redistribute.'

/**
 * Fixed-position quiet framing strip pinned to the viewport bottom. Visible on every route
 * because it is mounted in the root layout, beside <children>. Renders nothing else.
 */
export default function ConfidentialFooter() {
  return (
    <div
      role="contentinfo"
      aria-label="Confidential review framing"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-border bg-background/95 px-4 py-2 text-center text-[11px] leading-snug backdrop-blur-sm"
      style={{ color: 'var(--bc-semantic-muted)' }}
    >
      {CONFIDENTIAL_TEXT}
    </div>
  )
}
