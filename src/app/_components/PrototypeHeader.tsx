/**
 * PrototypeHeader.tsx — the standard chrome bar for every hub prototype build.
 *
 * Purpose
 *   One full-width bar that sits at the top of EVERY hub build (every route except
 *   the hub home "/"). It is the single source of: the "← Back to hub" affordance,
 *   the build's name, and the per-build "Updated [date]" stamp. Page content always
 *   renders BELOW this bar — the component renders only the bar itself, never the
 *   page body.
 *
 *   This replaces two older patterns:
 *     - the global fixed HomeNav back-pill (retired from layout.tsx — this bar now
 *       owns back-to-hub on every retrofitted route), and
 *     - the per-build floating wordmark pills on the map prototypes.
 *
 * Layout
 *   LEFT  : back-to-hub link to "/" (lucide ArrowLeft, not a glyph) + truncated
 *           build name + an optional `controls` slot (reserved for future
 *           build-level controls; empty today).
 *   RIGHT : "Updated [date]" stamp + the `commentSlot` (map builds pass their
 *           existing spatial <AnnotationLayer/> here; its toggle renders inline so it
 *           lands in this bar) OR, when no commentSlot is given, the element-anchored
 *           AnnotationLayer (anchorMode="element") wired to the durable /api/comments
 *           store — so EVERY non-map build gets real, machine-readable commenting.
 *           The bar is sticky (top-0, z-105) so it stays pinned while the page scrolls;
 *           the z-index coordinates with the portaled annotation overlay (see render).
 *
 * Tokens
 *   shadcn-style semantic aliases only (bg-background, text-foreground,
 *   border-border, text-muted-foreground, bg-muted). In globals.css these are all
 *   aliased to --bc-* tokens, so the bar is automatically BC-branded with NO
 *   hardcoded hex — matching how HomeNav / JtbdNav already work. Light mode. No emoji.
 *
 * Date resolution
 *   `date` (ISO) may be passed explicitly; otherwise it is resolved from the current
 *   route via build-date.ts (longest-prefix match against the committed
 *   build-dates.json). Renders no stamp when no build owns the path.
 *
 * Wireframe disclaimer
 *   Below the bar row sits a thin, full-width disclaimer banner shown on EVERY build that mounts
 *   this header (so the framing is single-sourced, not per-concept). The copy and visual
 *   treatment live in <WireframeNotice />, which the client-review landing also mounts so the
 *   strip cannot drift between the landing and the concept pages.
 *
 * Key exports: PrototypeHeader (named)
 * External dependencies: next/link, next/navigation (usePathname),
 *   lucide-react (ArrowLeft), ../_data/build-date,
 *   ../../components/annotation/AnnotationLayer, ../../lib/comments/client,
 *   ./WireframeNotice
 */

"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buildDateForPath, formatBuildDate } from "../_data/build-date";
import AnnotationLayer from "../../components/annotation/AnnotationLayer";
import { createApiPersistence } from "../../lib/comments/client";
import { WireframeNotice } from "./WireframeNotice";

/**
 * Derive a stable build slug from a route pathname — used as the Blobs store key and the
 * localStorage cache key for a build's comments. Deterministic across reloads:
 *   "/ux-concepts/cities"            → "ux-concepts-cities"
 *   "/ux-concepts/toolkit"           → "ux-concepts-toolkit"
 *   "/"                              → "hub-home"
 * Strips leading/trailing slashes, lowercases, and replaces path separators + unsafe
 * characters with hyphens so the key is filesystem/URL safe.
 */
function pathToBuildId(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  if (trimmed === "") return "hub-home";
  return trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Props for PrototypeHeader. */
type PrototypeHeaderProps = {
  /** Required bar title — the build's name (e.g. "Direction 01 — PM2.5 Triangulation"). */
  buildName: string;
  /**
   * Optional ISO date (YYYY-MM-DD) for the "Updated" stamp. Omit to resolve from
   * the current route via build-date.ts.
   */
  date?: string;
  /**
   * Optional comment affordance. MAP builds pass their existing <AnnotationLayer/>
   * here; its toggle renders inline so it lands in this bar's right slot. Non-map
   * builds omit it and get the element-anchored AnnotationLayer (also inline) instead.
   */
  commentSlot?: ReactNode;
  /** Reserved future LEFT-slot controls. Empty for now. */
  controls?: ReactNode;
};

/**
 * The standard prototype chrome bar. Renders ONLY the bar; the page renders its
 * content below it. See file header for the full layout/contract.
 */
export function PrototypeHeader({
  buildName,
  date,
  commentSlot,
  controls,
}: PrototypeHeaderProps) {
  const pathname = usePathname();
  // Prefer an explicitly-passed date; otherwise resolve from the current route.
  const iso = date ?? buildDateForPath(pathname);

  // Stable build slug + the /api/comments persistence adapter for the element-anchored
  // comment widget. Memoised on pathname so the adapter identity is stable across renders
  // (re-creating it each render would re-trigger AnnotationLayer's load effect).
  const buildId = useMemo(() => pathToBuildId(pathname), [pathname]);
  const persistence = useMemo(
    () => createApiPersistence(pathname),
    [pathname],
  );

  return (
    /*
      Sticky chrome bar (CHANGE 2): stays pinned at the top of the viewport as the page
      scrolls. z-index is load-bearing — it coordinates with the portaled AnnotationLayer
      overlay stack (all rendered to document.body):
        freeze ring 90 < overlay 100 < pins 101 < hover-label 102 < HEADER 105 < cards 110.
      - HEADER z-105 sits ABOVE the click-capture overlay (100) and pins/hover-label so the
        in-bar Comments/Done-annotating toggle stays clickable while annotation mode is active.
      - HEADER stays BELOW comment cards (110) so an open card is never hidden behind the bar.
      - The freeze ring (90) sits below the header so the brand ring frames the content area.
      shadow-sm gives subtle separation from scrolling content beneath; the existing
      border-b is retained.
    */
    <header className="sticky top-0 z-[105] flex w-full flex-shrink-0 flex-col border-b border-border bg-background shadow-sm">
      {/* Row 1 — the bar: back-to-hub + build name on the left, updated stamp + comments on the right. */}
      <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5">
      {/* LEFT — back-to-hub + build name + reserved controls slot */}
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          aria-label="Back to hub"
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to hub
        </Link>

        <span
          className="truncate text-sm font-semibold text-foreground"
          title={buildName}
        >
          {buildName}
        </span>

        {/* Reserved future build-level controls — renders nothing when empty. */}
        {controls}
      </div>

      {/* RIGHT — updated stamp + comment affordance (AnnotationLayer or disabled placeholder) */}
      <div className="flex flex-shrink-0 items-center gap-3">
        {iso !== null && iso !== undefined && (
          <span className="hidden text-[11px] font-medium tabular-nums text-muted-foreground/80 sm:inline">
            Updated {formatBuildDate(iso)}
          </span>
        )}

        {/*
          commentSlot present → map build's spatial <AnnotationLayer/> (its toggle now
          renders inline, so it sits in this right slot automatically). Absent → the
          element-anchored AnnotationLayer wired to the durable /api/comments store, so
          every non-map build has real commenting. In both cases the AnnotationLayer's
          toggle is a normal in-flow button that lands here, beside the "Updated" stamp.
        */}
        {commentSlot ?? (
          <>
            {/*
              Inject the AnnotationLayer's --al-* token interface, mapped onto the BC
              --bc-* semantic tokens (NO hardcoded hex). Map builds inject their own
              --al-* block per-route; non-map builds get this BC-branded mapping here so
              the widget is styled wherever PrototypeHeader mounts. The toggle renders
              inline in this slot (no fixed position), so the right-slot flex below aligns it.
            */}
            <style>{`
              :root {
                --al-overlay-bg:     var(--bc-semantic-map-overlay);
                --al-overlay-border: var(--bc-semantic-border);
                --al-input-bg:       var(--bc-color-white);
                --al-input-border:   var(--bc-semantic-border);
                --al-text:           var(--bc-semantic-text);
                --al-muted:          var(--bc-semantic-muted);
                --al-brand:          var(--bc-semantic-brand);
                --al-success:        var(--bc-semantic-success);
                --al-error:          var(--bc-semantic-error);
                --al-white:          var(--bc-color-white);
                --al-font:           var(--bc-font-family-sans);
                --al-radius-card:    var(--bc-border-radius-md);
                --al-radius-input:   var(--bc-border-radius-sm);
                --al-radius-pill:    var(--bc-border-radius-pill);
              }
            `}</style>
            <AnnotationLayer
              storageKey={`bc-comments-${buildId}`}
              label="Comments"
              anchorMode="element"
              persistence={persistence}
              buildId={buildId}
              route={pathname}
            />
          </>
        )}
      </div>
      </div>

      {/*
        Row 2 — the GENERIC wireframe disclaimer. Single-sourced via <WireframeNotice /> so it
        shows identically on every build that mounts this header AND on the client-review landing
        (src/app/page.tsx) — copy and visual treatment cannot drift between the two surfaces.
      */}
      <WireframeNotice />
    </header>
  );
}
