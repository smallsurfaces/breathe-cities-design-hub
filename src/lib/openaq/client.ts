/**
 * client.ts — Typed fetch wrapper for the OpenAQ v3 API
 *
 * Purpose:
 *   The only module that talks to OpenAQ over the network. Centralizes auth (X-API-Key),
 *   base URL, Next.js fetch caching, and 429 rate-limit backoff so callers (the adapter)
 *   never deal with HTTP concerns. Server-only — must never run in the browser because it
 *   reads a secret key.
 *
 * Key exports:
 *   - getLocationsByBbox(bbox, params) -> OpenAQLocation[]
 *   - getLocationLatest(locationId)    -> OpenAQLatestValue[]
 *   - OpenAQError (typed error surfaced for non-2xx and missing-key cases)
 *
 * External dependencies: process.env.OPENAQ_API_KEY (server-only secret), global fetch.
 *
 * Rate limits (probe-verified): 60 req/min, 2000 req/hr. This wrapper does not itself meter
 * request volume — that is the caller's job (cap stations) and the route's job (cache). It
 * does handle transient 429s with bounded exponential backoff.
 */

import type {
  OpenAQLatestValue,
  OpenAQListResponse,
  OpenAQLocation,
} from './types'

/** OpenAQ v3 base URL. */
const OPENAQ_BASE_URL = 'https://api.openaq.org/v3'

/** Cache window (seconds) applied to every upstream GET via Next.js fetch revalidation. */
const REVALIDATE_SECONDS = 600

/** Maximum number of 429 retries before giving up. */
const MAX_RETRIES = 3

/** Base delay (ms) for exponential backoff: attempt n waits BACKOFF_BASE_MS * 2^n. */
const BACKOFF_BASE_MS = 500

/**
 * Typed error for any OpenAQ failure the caller should handle. Carries an HTTP `status` when
 * one exists (0 for non-HTTP failures such as a missing key). Never embeds the API key.
 */
export class OpenAQError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'OpenAQError'
    this.status = status
  }
}

/**
 * Read the API key from the environment. Throws a clear OpenAQError if absent so a
 * misconfiguration surfaces immediately rather than as a confusing 401 from upstream.
 * The key value is never included in the error message or logged.
 */
function requireApiKey(): string {
  const key = process.env.OPENAQ_API_KEY
  if (key === undefined || key.length === 0) {
    throw new OpenAQError(
      'OPENAQ_API_KEY is not set. Add it to .env.local (server-only, never NEXT_PUBLIC).',
      0,
    )
  }
  return key
}

/** Sleep helper for backoff delays. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Perform a cached, authenticated GET against an OpenAQ v3 path and parse the JSON envelope.
 *
 * Why the retry loop: OpenAQ enforces 60/min and will return HTTP 429 under burst. Rather
 * than fail the whole request, we retry up to MAX_RETRIES with exponential backoff, honoring
 * the upstream `Retry-After` header when present. Non-429 non-2xx responses fail fast as a
 * typed OpenAQError — there is nothing to gain from retrying a 4xx/5xx that is not a 429.
 *
 * Caching: every request sets Next.js `next.revalidate` so identical upstream calls are served
 * from the framework data cache within the window, protecting the rate limit. The API key is
 * sent only in the request header and never logged.
 */
async function openaqGet<T>(path: string): Promise<T> {
  const apiKey = requireApiKey()
  const url = `${OPENAQ_BASE_URL}${path}`

  let lastError: OpenAQError | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    // API call — authenticated, cached upstream GET to OpenAQ v3.
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    })

    if (response.ok) {
      return (await response.json()) as T
    }

    // 429: rate-limited. Back off and retry unless we are out of attempts.
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfterHeader = response.headers.get('retry-after')
      const retryAfterMs =
        retryAfterHeader !== null && retryAfterHeader.trim().length > 0
          ? Number(retryAfterHeader) * 1000
          : BACKOFF_BASE_MS * 2 ** attempt
      lastError = new OpenAQError('OpenAQ rate limit hit (429).', 429)
      await delay(Number.isFinite(retryAfterMs) ? retryAfterMs : BACKOFF_BASE_MS * 2 ** attempt)
      continue
    }

    // Any other non-2xx (or a 429 on the final attempt): fail fast with a typed error.
    // The status text is safe; the body is not included to avoid leaking internal detail.
    throw new OpenAQError(
      `OpenAQ request failed with status ${response.status}.`,
      response.status,
    )
  }

  // Exhausted retries on repeated 429s.
  throw lastError ?? new OpenAQError('OpenAQ request failed after retries.', 429)
}

/**
 * List locations within a bbox. bbox is [minLon, minLat, maxLon, maxLat]. `limit` caps the
 * page size (OpenAQ default is small; we request a full page). bbox is the only geographic
 * filter that works on this endpoint — see cities.ts for why.
 */
export async function getLocationsByBbox(
  bbox: [number, number, number, number],
  params: { limit: number },
): Promise<OpenAQLocation[]> {
  const bboxParam = bbox.join(',')
  const search = new URLSearchParams({
    bbox: bboxParam,
    limit: String(params.limit),
  })
  const data = await openaqGet<OpenAQListResponse<OpenAQLocation>>(
    `/locations?${search.toString()}`,
  )
  return data.results
}

/**
 * Fetch the latest readings for a single location. Returns one entry per sensor that has
 * reported; the caller joins these back to the location's sensors via `sensorsId` to find the
 * value for a specific parameter.
 */
export async function getLocationLatest(
  locationId: number,
): Promise<OpenAQLatestValue[]> {
  const data = await openaqGet<OpenAQListResponse<OpenAQLatestValue>>(
    `/locations/${locationId}/latest`,
  )
  return data.results
}
