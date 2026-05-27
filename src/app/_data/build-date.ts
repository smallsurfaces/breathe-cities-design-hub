/**
 * build-date.ts — resolve and format the per-build "last updated" date.
 *
 * Purpose
 *   The design hub shows an "Updated [date]" stamp in each build's standard
 *   header. The date map (build-dates.json) is keyed by the build's base route and
 *   holds the git last-commit date of that build's route folder (YYYY-MM-DD). This
 *   module turns a current pathname into the right date string for that build.
 *
 *   Dynamic routes (e.g. /ux-concepts/cities/london, /ux-concepts/best-practice-
 *   roadmap/city/warsaw) are NOT keyed individually — they inherit their parent
 *   build's date via longest-prefix matching here. The map data itself is generated
 *   and committed by scripts/gen-build-dates.mjs (committed to survive Netlify's
 *   shallow clone).
 *
 * Key exports:
 *   - buildDateForPath(pathname): ISO date string for the build, or null
 *   - formatBuildDate(iso): "23 May 2026" style readable string
 *   - buildDateLabelForPath(pathname): combined readable date, or null
 * External dependencies: ./build-dates.json
 */

import buildDates from "./build-dates.json";

/** Route → ISO commit date (YYYY-MM-DD). Generated; keyed by build base route. */
const DATE_MAP: Record<string, string> = buildDates;

/**
 * Resolve the ISO build date for a pathname using longest-prefix matching.
 *
 * Why longest-prefix: a build's base route (e.g. "/ux-concepts/cities") must match
 * its own dynamic children ("/ux-concepts/cities/london") so they inherit the
 * parent build's date — and a more specific sub-route (if added in future) must
 * win over its parent for its own page. Sorting candidate keys longest-first and
 * taking the first prefix match gives both behaviours. Returns null when no build
 * owns the path (e.g. the hub home "/"), so the header can render nothing.
 */
export function buildDateForPath(pathname: string): string | null {
  const keys = Object.keys(DATE_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname === key || pathname.startsWith(key + "/")) {
      return DATE_MAP[key];
    }
  }
  return null;
}

/**
 * Format an ISO date (YYYY-MM-DD) as a readable "23 May 2026" string. Parses the
 * parts explicitly and builds a UTC date so the rendered day never shifts by
 * timezone (a date-only value has no time-of-day to localise).
 */
export function formatBuildDate(iso: string): string {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Convenience: readable build-date string for a pathname, or null when the path
 * has no associated build (so callers can conditionally render the stamp).
 */
export function buildDateLabelForPath(pathname: string): string | null {
  const iso = buildDateForPath(pathname);
  return iso === null ? null : formatBuildDate(iso);
}
