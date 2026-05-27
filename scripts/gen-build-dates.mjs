/**
 * gen-build-dates.mjs — generate the per-build "last updated" date map.
 *
 * Purpose
 *   Each prototype build in the design hub shows an "Updated [date]" stamp in its
 *   standard header. The date is the git last-commit date of THAT build's route
 *   folder — so dates differ across builds (older directions read older, recent
 *   work reads recent) and the stamp is self-maintaining: it updates whenever a
 *   build's route files change, with no manual edit.
 *
 *   This script computes that date per build by running, for each route folder:
 *       git log -1 --format=%cs -- <route-folder>
 *   (%cs = committer date, strict ISO short form YYYY-MM-DD). It writes the result
 *   to src/app/_data/build-dates.json, keyed by route path.
 *
 * The committed JSON is AUTHORITATIVE and hand-maintained — DO NOT auto-regenerate
 *   src/app/_data/build-dates.json is the single source of truth for build dates and
 *   is hand-maintained. This script is NOT wired into the build pipeline (it is a
 *   standalone on-demand `build:dates` npm script only). Earlier it ran in `prebuild`
 *   and the `build` chain; that was removed because regenerating at deploy time
 *   collapses every build to the same date: any commit that touches all route folders
 *   (e.g. a cross-cutting retrofit) makes `git log -1 -- <folder>` return that one
 *   commit's date for every folder, destroying the honest distinct per-build dates.
 *   Run this script ONLY when you deliberately intend to refresh dates, then review
 *   the diff by hand and commit. A content-aware generator that derives a build's
 *   real "last meaningfully changed" date (rather than last-touched) is tracked as
 *   cleanup #21 — until then, edit the JSON by hand for intentional updates.
 *
 * Why we COMMIT the JSON rather than generate at deploy (shallow-clone gotcha)
 *   Netlify shallow-clones the repo by default (single commit, no history). Running
 *   `git log -- <folder>` at Netlify build time would therefore return empty/wrong
 *   dates for older builds — the history simply isn't present in the shallow clone.
 *   The header reads the committed JSON; the build never depends on git history being
 *   present at deploy time.
 *
 * Key exports: none — run as a Node script (`node scripts/gen-build-dates.mjs`).
 * External dependencies: node:child_process, node:fs, node:path, node:url.
 */

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

/**
 * BUILDS — every hub build that shows a date stamp, mapped to:
 *   - routes: the URL path(s) the build serves. Dynamic [slug] routes are NOT
 *     listed individually; they inherit their parent build's date via prefix
 *     lookup at render time (see build-date helper). We list the canonical base
 *     route(s) here so the JSON is keyed by what the header looks up.
 *   - folder: the src/app route folder whose last git commit date IS the build's
 *     "updated" date.
 * The hub home "/" is intentionally absent — it carries no date stamp.
 */
const BUILDS = [
  { routes: ["/design-system"], folder: "src/app/design-system" },
  { routes: ["/direction-1-final"], folder: "src/app/direction-1-final" },
  { routes: ["/direction-1-mapbox"], folder: "src/app/direction-1-mapbox" },
  { routes: ["/direction-1-mapbox-v2"], folder: "src/app/direction-1-mapbox-v2" },
  { routes: ["/direction-2-live-data"], folder: "src/app/direction-2-live-data" },
  { routes: ["/jtbd-framework"], folder: "src/app/jtbd-framework" },
  {
    routes: ["/jtbd-framework/architecture"],
    folder: "src/app/jtbd-framework/architecture",
  },
  {
    // Resident Concerns concept (concern-centric). Index "/ux-concepts/cities" also covers the
    // dynamic concern route "/ux-concepts/cities/[concern]" via longest-prefix lookup at render
    // time. (The v1/v2 split and the old per-city "[slug]" route were retired in the
    // concern-centric restructure.)
    routes: ["/ux-concepts/cities"],
    folder: "src/app/ux-concepts/cities",
  },
  {
    // AQ Network Membership concept (canonical build — v1 retired in the v1-retire pass).
    // Index "/ux-concepts/aq-network-v2" also covers its dynamic profile route
    // "/ux-concepts/aq-network-v2/[city]" via longest-prefix lookup at render time.
    routes: ["/ux-concepts/aq-network-v2"],
    folder: "src/app/ux-concepts/aq-network-v2",
  },
  {
    // Best Practice Roadmap concept (canonical build — v1 retired in the v1-retire pass).
    // Sub-routes (/cities, /city/[slug], /domain/[slug]) inherit via longest-prefix lookup.
    routes: ["/ux-concepts/best-practice-roadmap-v2"],
    folder: "src/app/ux-concepts/best-practice-roadmap-v2",
  },
  {
    // City AQ Toolkit concept (component-catalogue build). Supersedes the retired JTBD
    // per-city-audit toolkit (jtbd-city-toolkit + -v2, both removed in the v1-retire pass).
    // The dynamic "/real-time-monitoring" sub-route inherits via longest-prefix lookup.
    routes: ["/ux-concepts/toolkit"],
    folder: "src/app/ux-concepts/toolkit",
  },
];

/**
 * Return the last git commit date (YYYY-MM-DD) for a folder, or null if git has
 * no record of it. Uses execFileSync (no shell) so the folder path is passed as a
 * literal argument — safe and predictable.
 */
function lastCommitDate(folder) {
  const out = execFileSync(
    "git",
    ["log", "-1", "--format=%cs", "--", folder],
    { cwd: REPO_ROOT, encoding: "utf8" },
  ).trim();
  return out.length > 0 ? out : null;
}

const map = {};
const missing = [];

for (const build of BUILDS) {
  const date = lastCommitDate(build.folder);
  if (date === null) {
    missing.push(build.folder);
    continue;
  }
  for (const route of build.routes) {
    map[route] = date;
  }
}

// Fail loudly rather than silently emitting wrong/empty dates (brief requirement).
if (missing.length > 0) {
  console.error(
    `gen-build-dates: no git date found for: ${missing.join(", ")}.\n` +
      "Refusing to write a partial map — run against full history (not a shallow clone).",
  );
  process.exit(1);
}

const outDir = join(REPO_ROOT, "src/app/_data");
const outFile = join(outDir, "build-dates.json");
mkdirSync(outDir, { recursive: true });
// Side effect: writes the committed date map. Trailing newline for clean diffs.
writeFileSync(outFile, JSON.stringify(map, null, 2) + "\n", "utf8");

console.log(`gen-build-dates: wrote ${Object.keys(map).length} routes to ${outFile}`);
for (const [route, date] of Object.entries(map)) {
  console.log(`  ${date}  ${route}`);
}
