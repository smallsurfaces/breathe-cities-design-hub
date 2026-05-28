/**
 * route.ts — /api/comments — durable, machine-readable comment store API (Stage 1).
 *
 * Purpose
 *   Server-side read/write face of the element-anchored comments feature. Persists to a
 *   Netlify Blobs store (via lib/comments/store.ts) so review comments survive deploys and
 *   can later be read by agents (the read/pull tooling is Stage 2). Mirrors the style of
 *   api/stations/route.ts: NextResponse.json everywhere, validation before any store call,
 *   and a generic 502 that leaks no internals on store failure.
 *
 * Endpoints
 *   GET  /api/comments?build=<id>  → 200 CommentStoreRecord (empty {comments:[]} if none);
 *                                    400 when build is missing/blank.
 *   GET  /api/comments             → 200 { builds: string[] } — discovery of builds that
 *                                    have a record (best-effort; Stage 2 pull tooling uses it).
 *   POST /api/comments             → append one OR full replace:
 *                                      { buildId, route, comment }  → append (read-modify-write)
 *                                      { buildId, route, comments } → full replace (edit/resolve/delete)
 *                                    200 updated record; 400 bad shape / unknown route /
 *                                    buildId mismatch / oversize text or comment count; 413
 *                                    oversize body; 502 store failure.
 *
 * Hardening (gate-blocker pass 2026-05-28)
 *   This handler runs on a PUBLIC client-review URL. The original implementation accepted
 *   any client-supplied `buildId` against any `route`, with no size caps — meaning random
 *   internet POSTs could persist arbitrary blobs against any key, and clients could spray
 *   unbounded payloads through to the Blobs store. The hardening layers added here are:
 *
 *     1. ROUTE ALLOWLIST. `route` must be one of the prototype routes this site ships
 *        (lib/comments/build-ids ALLOWED_ROUTES). Rejects POSTs that name a route the
 *        build does not emit. 400 with a clear message.
 *
 *     2. SERVER-COMPUTED BUILDID MATCH. The expected buildId is re-derived from the
 *        client-supplied `route` using the SAME pathToBuildId() the client uses. If the
 *        client's `buildId` ≠ the server's expected buildId, reject 400. Closes the path
 *        where a client could pass `route=/known` + `buildId=arbitrary` and have the
 *        arbitrary blob persisted under the spoofed key.
 *
 *     3. SIZE CAPS. Body 64 KiB max (413). Single comment `text` 2 KiB max. `comments`
 *        array 200 entries max (full-replace path). Optional fields (`authorName`,
 *        `kind` enum, `anchor.*` strings, `capturedText`) carry sane string-length caps.
 *
 *     4. STRING-FIELD DISCIPLINE. All free-text fields here are UNTRUSTED. They are
 *        round-tripped to /api/comments → Blobs → back to a client which renders them
 *        as text via React (which escapes them). They MUST NOT be passed to
 *        `dangerouslySetInnerHTML` anywhere in the codebase. There is no current
 *        consumer doing that; this comment is the reminder for future agents.
 *
 *     5. RATE LIMITING IS OUT OF SCOPE for this pass — it requires external infra
 *        (Netlify Edge Functions + a KV/Redis quota counter, or an upstream WAF). Worth
 *        adding before this surface stays public for longer than the CAF/C40/Bloomberg
 *        window. Tracked as a follow-up; not blocking the gate-blocker pass.
 *
 * Runtime
 *   Netlify Blobs requires the Netlify runtime (or `netlify dev`). Under plain `next dev`
 *   the store is absent and store calls throw → this route returns 502 and the browser
 *   adapter (lib/comments/client.ts) falls back to localStorage. That is expected.
 *
 * Key export: GET, POST (Next.js App Router route handlers)
 * External dependencies: lib/comments/store (getComments, putComments),
 *   lib/comments/build-ids (allowlist + buildId derivation), @netlify/blobs (listStores,
 *   for discovery), AnnotationLayer types
 */

import { NextResponse } from 'next/server'
import { listStores } from '@netlify/blobs'
import { getComments, putComments } from '../../../lib/comments/store'
import {
  expectedBuildIdForRoute,
  isAllowedRoute,
} from '../../../lib/comments/build-ids'
import type {
  Annotation,
  CommentStoreRecord,
} from '../../../components/annotation/AnnotationLayer.types'

/**
 * Force the Node.js runtime. Netlify Blobs is not available on the Edge runtime, and this
 * route must run server-side where the Blobs context is injected.
 */
export const runtime = 'nodejs'

/** Disable static optimisation — every request reads/writes live store state. */
export const dynamic = 'force-dynamic'

// ─── Size caps — chosen for an element-anchored review tool, not for free-form chat ──────

/**
 * Maximum POST body, in bytes. Element-anchored reviewer comments are short; a full-replace
 * of 200 comments × ~2 KiB each fits well under this. The cap stops a misconfigured (or
 * malicious) client from posting an unbounded blob through to the store.
 */
const MAX_BODY_BYTES = 64 * 1024

/** Maximum length, in characters, of a single comment's `text` field. */
const MAX_COMMENT_TEXT_LEN = 2 * 1024

/** Maximum number of comments per full-replace POST. */
const MAX_COMMENTS_PER_REPLACE = 200

/** Maximum length of optional string fields on a comment (authorName, capturedText, etc.). */
const MAX_OPTIONAL_STRING_LEN = 512

/** Valid anchor kinds — matches the AnchorKind union in AnnotationLayer.types.ts. */
const VALID_ANCHOR_KINDS: readonly string[] = ['viewport', 'element', 'map']

/**
 * Structural + size guard that a value looks like an Annotation we can store. Coordinates
 * must be FINITE numbers (Infinity/NaN serialise as JSON `null` and would snap pins to
 * (0,0) on render — reject at the boundary). Optional fields, when present, are length-
 * and shape-capped: the request returns 400 rather than persisting an oversized field.
 *
 * Returns an error string on rejection, or null when the value passes. The error string
 * is included in the 400 response so the client / debugger can see which field tripped.
 */
function validateAnnotation(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return 'comment must be an object'
  }
  const c = value as Record<string, unknown>

  // Required fields.
  if (typeof c.id !== 'string') return '`id` must be a string'
  if (typeof c.x !== 'number' || !Number.isFinite(c.x)) {
    return '`x` must be a finite number'
  }
  if (typeof c.y !== 'number' || !Number.isFinite(c.y)) {
    return '`y` must be a finite number'
  }
  if (typeof c.text !== 'string') return '`text` must be a string'
  if (c.text.length > MAX_COMMENT_TEXT_LEN) {
    return `\`text\` exceeds the ${MAX_COMMENT_TEXT_LEN}-char limit`
  }

  // Optional string fields — when present, must be sane strings.
  if (
    c.authorName !== undefined &&
    (typeof c.authorName !== 'string' ||
      c.authorName.length > MAX_OPTIONAL_STRING_LEN)
  ) {
    return '`authorName` must be a string within the length limit'
  }
  if (
    c.capturedText !== undefined &&
    (typeof c.capturedText !== 'string' ||
      c.capturedText.length > MAX_OPTIONAL_STRING_LEN)
  ) {
    return '`capturedText` must be a string within the length limit'
  }

  // Optional `kind` enum.
  if (c.kind !== undefined) {
    if (typeof c.kind !== 'string' || !VALID_ANCHOR_KINDS.includes(c.kind)) {
      return '`kind` must be one of viewport/element/map'
    }
  }

  // Optional `anchor` object — each string sub-field is length-capped.
  if (c.anchor !== undefined) {
    if (typeof c.anchor !== 'object' || c.anchor === null) {
      return '`anchor` must be an object when present'
    }
    const anchorFields: readonly string[] = [
      'dataAnchor',
      'selectorPath',
      'nearbyText',
      'role',
      'ariaLabel',
      'tagName',
    ]
    for (const field of anchorFields) {
      const v = (c.anchor as Record<string, unknown>)[field]
      if (
        v !== undefined &&
        (typeof v !== 'string' || v.length > MAX_OPTIONAL_STRING_LEN)
      ) {
        return `\`anchor.${field}\` must be a string within the length limit`
      }
    }
  }

  return null
}

/**
 * Build an empty record for a build that has none yet. Kept as a helper so GET and POST
 * agree on the empty shape returned to the client.
 */
function emptyRecord(buildId: string, route: string): CommentStoreRecord {
  return { buildId, route, updatedAt: Date.now(), comments: [] }
}

/**
 * GET handler.
 *   With ?build=<id>: return that build's record (or an empty record when none exists).
 *   Without a param : return { builds: [...] } discovery list.
 * Validation (missing build param value) fails fast as 400 before any store call.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const buildId = searchParams.get('build')

  // Discovery mode — no ?build param at all.
  if (buildId === null) {
    try {
      // Note: listStores enumerates STORES, not keys. Stage 2 pull tooling treats a single
      // 'comments' store as present/absent; per-build discovery is a Stage 2 refinement.
      const { stores } = await listStores()
      return NextResponse.json({ builds: stores })
    } catch {
      // Discovery is best-effort — return an empty list rather than a hard error so the
      // absence of a store (e.g. next dev) reads as "no builds yet".
      return NextResponse.json({ builds: [] })
    }
  }

  // A param was supplied but is blank — that is a client error.
  if (buildId.trim() === '') {
    return NextResponse.json(
      { error: 'Query param `build` must be a non-empty build id.' },
      { status: 400 },
    )
  }

  try {
    const record = await getComments(buildId)
    if (record === null) {
      // No record yet is a normal state, not an error — return an empty record.
      return NextResponse.json(emptyRecord(buildId, ''))
    }
    return NextResponse.json(record)
  } catch {
    // Store unavailable (e.g. Blobs context missing). Generic 502 — leak nothing.
    return NextResponse.json(
      { error: 'Failed to read comments from the store.' },
      { status: 502 },
    )
  }
}

/**
 * POST handler. Two mutually-exclusive shapes:
 *   { buildId, route, comment  } → append one (read-modify-write: get → push → put)
 *   { buildId, route, comments } → full replace (used for edit / resolve / delete)
 *
 * Validation order (fail fast — cheapest checks first):
 *   1. Content-Length cap (413 — never read an oversize body into memory).
 *   2. JSON parse + object-shape check (400).
 *   3. Required-fields shape (400).
 *   4. Route allowlist (400).
 *   5. Server-derived buildId vs client buildId match (400).
 *   6. Per-shape comment validation incl. size caps (400).
 *   7. Store write — failures are 502 with no leaked internals.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // ── (1) Body size cap (Content-Length pre-check) ────────────────────────────────────────
  // Cheap to verify before any I/O: if the client advertises a body larger than the cap,
  // reject 413 immediately. (A malicious client could lie about Content-Length, but the
  // subsequent `request.json()` would still need to allocate the body — the post-parse
  // length check below catches that case.)
  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    const advertised = Number.parseInt(contentLength, 10)
    if (Number.isFinite(advertised) && advertised > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          error: `Request body exceeds the ${MAX_BODY_BYTES}-byte limit.`,
        },
        { status: 413 },
      )
    }
  }

  // ── (2) Read the raw body, enforce size cap on the actual bytes, then JSON-parse ────────
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json(
      { error: 'Failed to read request body.' },
      { status: 400 },
    )
  }
  // Post-parse defence: clients can lie about Content-Length, so enforce on the actual
  // bytes. (rawBody.length here is JavaScript char-count, not bytes — for an upper bound on
  // bytes that is fine because JS strings are at minimum 1 byte per char in UTF-8.)
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        error: `Request body exceeds the ${MAX_BODY_BYTES}-byte limit.`,
      },
      { status: 413 },
    )
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400 },
    )
  }

  // Array.isArray guard: a top-level JSON array (e.g. [1,2,3]) is `typeof === 'object'` and
  // non-null, so without this it would fall through to the buildId check and return the
  // misleading "`buildId` is required" message. Reject it here with the correct message.
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Request body must be an object.' },
      { status: 400 },
    )
  }

  const payload = body as Record<string, unknown>
  const buildId = payload.buildId
  const route = payload.route

  // ── (3) Required-field shape ────────────────────────────────────────────────────────────
  if (typeof buildId !== 'string' || buildId.trim() === '') {
    return NextResponse.json(
      { error: '`buildId` is required and must be a non-empty string.' },
      { status: 400 },
    )
  }
  if (typeof route !== 'string') {
    return NextResponse.json(
      { error: '`route` is required and must be a string.' },
      { status: 400 },
    )
  }

  // ── (4) Route allowlist ─────────────────────────────────────────────────────────────────
  // Reject any POST whose `route` is not a prototype route this build emits. This stops a
  // stranger from injecting arbitrary route strings (and thus arbitrary buildId keys after
  // the derivation step) into the Blobs store.
  if (!isAllowedRoute(route)) {
    return NextResponse.json(
      { error: '`route` is not a known prototype route.' },
      { status: 400 },
    )
  }

  // ── (5) BuildId / route binding ────────────────────────────────────────────────────────
  // Server re-derives the expected buildId from `route` using the SAME pathToBuildId() the
  // client uses (lib/comments/build-ids). If the client-supplied buildId disagrees, reject.
  // Without this, an attacker could pass route='/known/route' + buildId='arbitrary-key' and
  // have the blob persist under the arbitrary key.
  const expectedBuildId = expectedBuildIdForRoute(route)
  if (buildId !== expectedBuildId) {
    return NextResponse.json(
      {
        error: '`buildId` does not match the server-derived id for `route`.',
      },
      { status: 400 },
    )
  }

  // ── (6) Shape: exactly one of `comment` (append) or `comments` (full replace) ───────────
  const hasComment = 'comment' in payload
  const hasComments = 'comments' in payload

  if (hasComment === hasComments) {
    return NextResponse.json(
      {
        error:
          'Provide exactly one of `comment` (append) or `comments` (full replace).',
      },
      { status: 400 },
    )
  }

  try {
    if (hasComments) {
      // ── Full replace ──────────────────────────────────────────────────────────
      const comments = payload.comments
      if (!Array.isArray(comments)) {
        return NextResponse.json(
          { error: '`comments` must be an array of valid annotations.' },
          { status: 400 },
        )
      }
      if (comments.length > MAX_COMMENTS_PER_REPLACE) {
        return NextResponse.json(
          {
            error: `\`comments\` exceeds the ${MAX_COMMENTS_PER_REPLACE}-entry limit.`,
          },
          { status: 400 },
        )
      }
      for (const entry of comments) {
        const err = validateAnnotation(entry)
        if (err !== null) {
          return NextResponse.json(
            { error: `Invalid comment in array: ${err}` },
            { status: 400 },
          )
        }
      }
      const record: CommentStoreRecord = {
        buildId,
        route,
        updatedAt: Date.now(),
        comments: comments as Annotation[],
      }
      await putComments(buildId, record)
      return NextResponse.json(record)
    }

    // ── Append one (read-modify-write) ───────────────────────────────────────────
    const comment = payload.comment
    const err = validateAnnotation(comment)
    if (err !== null) {
      return NextResponse.json(
        { error: `Invalid comment: ${err}` },
        { status: 400 },
      )
    }
    const existing = await getComments(buildId)
    const base = existing ?? emptyRecord(buildId, route)
    // Defence against a long-running build accumulating an unbounded number of comments:
    // refuse the append once the stored array would breach the per-replace cap.
    if (base.comments.length >= MAX_COMMENTS_PER_REPLACE) {
      return NextResponse.json(
        {
          error: `Build already has ${MAX_COMMENTS_PER_REPLACE} comments — append refused.`,
        },
        { status: 400 },
      )
    }
    const record: CommentStoreRecord = {
      buildId,
      route,
      updatedAt: Date.now(),
      comments: [...base.comments, comment as Annotation],
    }
    await putComments(buildId, record)
    return NextResponse.json(record)
  } catch {
    // Store unavailable or write failed. Generic 502 — leak nothing internal.
    return NextResponse.json(
      { error: 'Failed to write comments to the store.' },
      { status: 502 },
    )
  }
}
