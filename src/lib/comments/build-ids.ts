/**
 * build-ids.ts — Shared route/buildId derivation + allowlist for the comments API.
 *
 * Purpose
 *   This module is the SINGLE SOURCE OF TRUTH for two questions the comments API and the
 *   client annotation widget both need to answer the SAME way:
 *
 *     1. "What buildId does this route map to?"   → `pathToBuildId(pathname)`
 *     2. "Is this route a real prototype route?"  → `isAllowedRoute(pathname)`
 *
 *   Before this module existed, `pathToBuildId` lived only inside PrototypeHeader.tsx (a
 *   client component) — meaning the server route had no way to verify a client-supplied
 *   buildId/route pair. The /api/comments POST handler accepted any string-shaped buildId,
 *   so a stranger could POST against any buildId on the public client-review URL and have
 *   it persist (security-expert HOLD finding, gate consolidation 2026-05-28). Lifting the
 *   helper into a shared lib file lets the server re-derive the expected buildId from the
 *   `route` field of an incoming POST and reject mismatches with a 400 — no path injection,
 *   no spray-and-pray persistence.
 *
 *   `ALLOWED_ROUTES` is a CONSERVATIVE allowlist of every prototype route this site ships.
 *   Dynamic-route slugs are enumerated explicitly (cities/concerns/domains) by mirroring the
 *   data sources the build's `generateStaticParams` already reads. Adding a new prototype
 *   route here is a one-line change; SHOULD be paired with the corresponding `generateStatic
 *   Params` edit so the allowlist stays in lockstep with the routes the build actually emits.
 *
 *   Slug data is duplicated here statically rather than imported from the data modules so
 *   that the route handler does not pull the entire roadmap/concerns dataset into a single
 *   Lambda invocation — keeps cold-start cost low and prevents accidental coupling between
 *   the comments boundary and the content data layer. The duplication is intentional and
 *   small. A future change that adds a city slug needs to touch BOTH the data file (for
 *   `generateStaticParams`) AND this allowlist (for the comments API).
 *
 * Slug discipline
 *   The CITY_SLUGS / CONCERN_KEYS / DOMAIN_SLUGS / NETWORK_CITY_SLUGS arrays MUST mirror the
 *   slugs returned by the corresponding `generateStaticParams` calls in:
 *     - src/app/ux-concepts/best-practice-roadmap-v2/city/[slug]/page.tsx     (CITIES)
 *     - src/app/ux-concepts/best-practice-roadmap-v2/domain/[slug]/page.tsx   (DOMAINS)
 *     - src/app/ux-concepts/cities/[concern]/page.tsx                         (CONCERNS)
 *     - src/app/ux-concepts/aq-network-v2/[city]/page.tsx                     (CITY_PROFILE_SLUGS)
 *
 *   If any of those route generators add a new entry, add the matching slug here too. The
 *   build will not catch the divergence (the allowlist is independent), but a client-side
 *   attempt to POST a comment from a newly-shipped page will then 400 with a clear message.
 *
 * Key exports: pathToBuildId, ALLOWED_ROUTES, isAllowedRoute, expectedBuildIdForRoute.
 * External dependencies: none (deliberately self-contained — see "Slug discipline" above).
 */

/**
 * Derive a stable build slug from a route pathname — the SAME function the client annotation
 * widget uses (PrototypeHeader.tsx imports this), so a server-computed buildId matches a
 * client-computed buildId byte-for-byte for any given route.
 *
 *   "/ux-concepts/cities"              → "ux-concepts-cities"
 *   "/ux-concepts/toolkit"             → "ux-concepts-toolkit"
 *   "/ux-concepts/cities/who-polluting" → "ux-concepts-cities-who-polluting"
 *   "/"                                → "hub-home"
 *
 * Trims leading/trailing slashes, lowercases, replaces path separators and any non
 * [a-z0-9] characters with a single hyphen, then collapses any leading/trailing hyphens
 * the replace might have introduced. Deterministic across reloads and platforms.
 */
export function pathToBuildId(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '')
  if (trimmed === '') return 'hub-home'
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Slug data — kept in lockstep with the route generators (see "Slug discipline") ───────

/**
 * The Best Practice Roadmap's 14 city slugs — must mirror `CITIES` in src/data/roadmap-data.ts
 * (the source used by `/ux-concepts/best-practice-roadmap-v2/city/[slug]/page.tsx`'s
 * `generateStaticParams`).
 */
const ROADMAP_CITY_SLUGS: readonly string[] = [
  'london',
  'paris',
  'milan',
  'brussels',
  'warsaw',
  'sofia',
  'mexico-city',
  'bogota',
  'rio-de-janeiro',
  'accra',
  'johannesburg',
  'nairobi',
  'jakarta',
  'bangkok',
]

/**
 * The Best Practice Roadmap's 11 domain slugs — must mirror `DOMAINS` in
 * src/data/roadmap-data.ts (the source used by domain/[slug]/page.tsx). Ids 1–10 + 12;
 * id 11 is not in the data set.
 */
const ROADMAP_DOMAIN_SLUGS: readonly string[] = [
  'monitoring',
  'source-apportionment',
  'health-impact',
  'policy-design',
  'transport',
  'clean-fuels',
  'green-infrastructure',
  'awareness',
  'governance',
  'funding',
  'data-technology',
]

/**
 * The Resident Concerns landing's 5 concern keys — must mirror `CONCERNS` in
 * src/app/ux-concepts/cities/_data/concerns-data.ts.
 */
const RESIDENT_CONCERN_KEYS: readonly string[] = [
  'who-polluting',
  'safe-for-kids',
  'what-can-i-do',
  'worst-part',
  'make-them-stop',
]

/**
 * AQ Network member-profile slugs — must mirror `CITY_PROFILE_SLUGS` in
 * src/app/ux-concepts/aq-network-v2/_data/cities/index.ts.
 */
const NETWORK_PROFILE_SLUGS: readonly string[] = ['london', 'accra']

/**
 * Build the allowlist from the static roots + the enumerated dynamic-route expansions. Done
 * once at module load (a small array literal, no I/O) and frozen as a readonly tuple so any
 * accidental mutation at runtime would TypeScript-error.
 */
function buildAllowlist(): readonly string[] {
  const staticRoots = [
    '/',
    '/ux-concepts/best-practice-roadmap-v2',
    '/ux-concepts/best-practice-roadmap-v2/cities',
    '/ux-concepts/cities',
    '/ux-concepts/toolkit',
    '/ux-concepts/toolkit/real-time-monitoring',
    '/ux-concepts/aq-network-v2',
  ]
  const cityDetail = ROADMAP_CITY_SLUGS.map(
    (slug) => `/ux-concepts/best-practice-roadmap-v2/city/${slug}`,
  )
  const domainDetail = ROADMAP_DOMAIN_SLUGS.map(
    (slug) => `/ux-concepts/best-practice-roadmap-v2/domain/${slug}`,
  )
  const concernDetail = RESIDENT_CONCERN_KEYS.map(
    (key) => `/ux-concepts/cities/${key}`,
  )
  const networkCityDetail = NETWORK_PROFILE_SLUGS.map(
    (slug) => `/ux-concepts/aq-network-v2/${slug}`,
  )
  return [
    ...staticRoots,
    ...cityDetail,
    ...domainDetail,
    ...concernDetail,
    ...networkCityDetail,
  ] as const
}

/** Canonical allowlist of every route the comments API will accept. Module-frozen. */
export const ALLOWED_ROUTES: readonly string[] = buildAllowlist()

/** O(1)-ish allowlist lookup — uses a Set under the hood. */
const ALLOWED_ROUTES_SET = new Set<string>(ALLOWED_ROUTES)

/**
 * True when `route` matches one of the prototype routes this site ships. Used by the
 * /api/comments POST handler to reject any POST whose `route` field is not a real route
 * (returns 400). Exact-match (no trailing-slash normalisation needed — the client always
 * sends `usePathname()` which is exact).
 */
export function isAllowedRoute(route: string): boolean {
  return ALLOWED_ROUTES_SET.has(route)
}

/**
 * The buildId the server EXPECTS for `route`. Used by the POST handler: if the client-
 * supplied `buildId` does not equal `expectedBuildIdForRoute(body.route)`, reject 400.
 * This binds the buildId to the route so the API cannot be used to overwrite an unrelated
 * build by spoofing the buildId field.
 */
export function expectedBuildIdForRoute(route: string): string {
  return pathToBuildId(route)
}
