/**
 * ConfidentialFooter.tsx — persistent confidential-framing strip shown on every route.
 *
 * Purpose
 *   The breathe-cities-design-hub site is a public client-review URL. This footer is the
 *   single framing affordance that tells reviewers the prototypes are confidential and not
 *   for redistribution. Mounted by the root layout so it appears on every surface (landing
 *   + the four concept routes + any dynamic sub-routes).
 *
 * Placement & opacity (gate-blocker pass 2026-05-28)
 *   The earlier iteration used `bg-background/95` + `backdrop-blur-sm` and pinned at z-200,
 *   which (1) blur-washed in-flow content sitting behind the strip (the new Small Surfaces
 *   credit on the landing was a load-bearing instance) and (2) occluded the bottom edge of
 *   AnnotationLayer click targets when the annotation overlay sat above z-200.
 *
 *   New contract (both halves applied — belt-and-braces):
 *     1. SOLID strip — `bg-background` (no opacity, no `backdrop-blur-sm`). Content
 *        behind the strip is cleanly hidden rather than blur-washed; a clear `border-t`
 *        marks the strip's top edge.
 *     2. BODY PADDING — `<body>` carries `pb-10` (set in app/layout.tsx) so page content
 *        scrolls ABOVE the strip rather than under it. No in-flow content overlap.
 *     3. Z-INDEX 50 — high enough to sit above ordinary page content (no z-index), low
 *        enough to render UNDER the AnnotationLayer's pins (z-101), hover label (z-102),
 *        PrototypeHeader (z-105 — note: the header is sticky top-0, never coincides with
 *        this bottom strip), and comment cards (z-110). With the lowered z-index the
 *        annotator can drop a pin near the viewport bottom and it will appear over (not
 *        behind) the framing strip — fixes the AnnotationLayer-at-bottom occlusion the
 *        bug-tester gate flagged.
 *
 *   The trio (opaque + body padding + lowered z) is intentional. Removing any one of them
 *   regresses to a prior failure mode.
 *
 *   Styling: BC semantic tokens only. No hardcoded hex. No emoji.
 *
 * Key exports: ConfidentialFooter (default)
 * External dependencies: none (pure presentation).
 */

/** Locked framing copy. Do not edit without an explicit decision. */
const CONFIDENTIAL_TEXT =
  'Breathe Cities — Confidential prototypes for CAF / C40 / Bloomberg review. Please do not redistribute.'

/**
 * Solid, opaque, fixed-position framing strip pinned to the viewport bottom. Visible on
 * every route because it is mounted in the root layout, beside <children>.
 */
export default function ConfidentialFooter() {
  return (
    <div
      role="contentinfo"
      aria-label="Confidential review framing"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 py-2 text-center text-[11px] leading-snug"
      style={{ color: 'var(--bc-semantic-muted)' }}
    >
      {CONFIDENTIAL_TEXT}
    </div>
  )
}
