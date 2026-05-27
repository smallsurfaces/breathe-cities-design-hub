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
 *                                    200 updated record; 400 bad shape; 502 store failure.
 *
 * Runtime
 *   Netlify Blobs requires the Netlify runtime (or `netlify dev`). Under plain `next dev`
 *   the store is absent and store calls throw → this route returns 502 and the browser
 *   adapter (lib/comments/client.ts) falls back to localStorage. That is expected.
 *
 * Key export: GET, POST (Next.js App Router route handlers)
 * External dependencies: lib/comments/store (getComments, putComments),
 *   @netlify/blobs (listStores, for discovery), AnnotationLayer types
 */

import { NextResponse } from 'next/server'
import { listStores } from '@netlify/blobs'
import { getComments, putComments } from '../../../lib/comments/store'
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

/**
 * Minimal structural guard that a value looks like an Annotation we can store.
 * x/y must be FINITE numbers: a non-finite coord (Infinity/NaN) passes `typeof === 'number'`
 * but `JSON.stringify(Infinity) === "null"`, so it would be persisted as null and the pin
 * would snap to (0,0) on render. Reject those at the boundary with a 400.
 */
function isAnnotation(value: unknown): value is Annotation {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.x === 'number' &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === 'number' &&
    Number.isFinite(candidate.y) &&
    typeof candidate.text === 'string'
  )
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
 * Bad shapes fail fast as 400 before any store call; store failure is a generic 502.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
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

  const hasComment = 'comment' in payload
  const hasComments = 'comments' in payload

  // Exactly one of the two shapes must be present.
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
      if (!Array.isArray(comments) || !comments.every(isAnnotation)) {
        return NextResponse.json(
          { error: '`comments` must be an array of valid annotations.' },
          { status: 400 },
        )
      }
      const record: CommentStoreRecord = {
        buildId,
        route,
        updatedAt: Date.now(),
        comments,
      }
      await putComments(buildId, record)
      return NextResponse.json(record)
    }

    // ── Append one (read-modify-write) ───────────────────────────────────────────
    const comment = payload.comment
    if (!isAnnotation(comment)) {
      return NextResponse.json(
        { error: '`comment` must be a valid annotation.' },
        { status: 400 },
      )
    }
    const existing = await getComments(buildId)
    const base = existing ?? emptyRecord(buildId, route)
    const record: CommentStoreRecord = {
      buildId,
      route,
      updatedAt: Date.now(),
      comments: [...base.comments, comment],
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
