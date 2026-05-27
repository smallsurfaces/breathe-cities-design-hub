/**
 * BuildDateStamp.tsx — the "Updated [date]" metadata stamp shown in build headers.
 *
 * Purpose
 *   Renders a subtle, secondary "Updated 23 May 2026" label next to a build's
 *   "Back to hub" nav. The date is per-build and git-derived (see _data/build-date
 *   and _data/build-dates.json) — older builds read older, recent builds read
 *   recent — so the stamp is honest and self-maintaining.
 *
 *   Standalone reusable stamp. The standard PrototypeHeader inlines this same
 *   date resolver/formatter directly, so this component is currently unused by any
 *   route — it is kept as a documented, reusable utility for future builds that want
 *   a date stamp outside the standard header.
 *
 *   Two render modes:
 *     - <BuildDateStamp /> with no props: client-side, resolves the date from the
 *       current pathname.
 *     - <BuildDateStamp date="2026-05-23" />: a fixed ISO date passed by a caller
 *       that already knows its build, avoiding a pathname lookup.
 *   Renders nothing when no build date applies (e.g. the hub home).
 *
 * Styling: metadata, not a headline — text-muted-foreground, small, light mode,
 * BC/shadcn tokens only (no hardcoded hex), no emoji.
 *
 * Key exports: BuildDateStamp
 * External dependencies: next/navigation (usePathname), ../_data/build-date
 */

"use client";

import { usePathname } from "next/navigation";
import { buildDateForPath, formatBuildDate } from "../_data/build-date";

/** Props: optionally pass a known ISO date; omit to resolve from the pathname. */
type BuildDateStampProps = {
  date?: string;
  className?: string;
};

export function BuildDateStamp({ date, className }: BuildDateStampProps) {
  const pathname = usePathname();
  // Prefer an explicitly-passed date; otherwise resolve from the current route.
  const iso = date ?? buildDateForPath(pathname);
  if (iso === null || iso === undefined) return null;

  return (
    <span
      className={[
        "text-[11px] font-medium tabular-nums text-muted-foreground/80",
        className ?? "",
      ].join(" ")}
    >
      Updated {formatBuildDate(iso)}
    </span>
  );
}
