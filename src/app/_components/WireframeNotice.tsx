/**
 * WireframeNotice.tsx — the single, GENERIC "wireframe / no visual design" disclaimer strip.
 *
 * Purpose
 *   A thin, full-width framing band shown above the BC chrome on every concept route (via the
 *   PrototypeHeader, which mounts this as its Row 2) and at the top of the client-review landing
 *   (src/app/page.tsx). Single-sourced so the copy and the visual treatment cannot drift between
 *   the landing and the concept pages a reviewer is about to click into.
 *
 *   Extracted from PrototypeHeader 2026-05-27 so the landing (which does NOT mount PrototypeHeader)
 *   can reuse the exact same strip without duplicating the copy string. The copy is locked — do
 *   not edit without a decision.
 *
 *   Quiet muted styling on a subtle muted fill so it reads as framing, not as a loud warning.
 *   role="note" so assistive tech treats it as an aside, not an alert.
 *
 * Key exports: WireframeNotice (named), WIREFRAME_DISCLAIMER (named — the locked copy string)
 * External dependencies: none.
 */

/**
 * The locked, GENERIC wireframe disclaimer copy — shown on every build that mounts the PrototypeHeader
 * AND on the client-review landing. Named no concept on purpose so it reads correctly everywhere.
 */
export const WIREFRAME_DISCLAIMER =
  "Concept wireframe — no visual design applied yet. Review the UX and the high-level concept, not the visual design.";

/**
 * The thin disclaimer strip. Renders the locked copy in muted text on a muted fill. The caller
 * controls vertical placement; this component owns only the strip's own visual treatment.
 */
export function WireframeNotice() {
  return (
    <div
      role="note"
      className="w-full border-y border-border bg-muted/40 px-4 py-1.5 text-center text-[11px] leading-snug text-muted-foreground"
    >
      {WIREFRAME_DISCLAIMER}
    </div>
  );
}
