/**
 * store.ts — server-side Netlify Blobs wrapper for the comments feature (Stage 1).
 *
 * Purpose
 *   The ONLY module that imports @netlify/blobs. It isolates the Blobs SDK behind two
 *   small async functions so the route handler (api/comments/route.ts) never touches the
 *   SDK directly, and so swapping the backend later touches one file. One Blobs store
 *   ('comments'); one key per build (buildId); value is a CommentStoreRecord JSON blob.
 *
 * Auto-wiring vs explicit config
 *   Under the Netlify runtime (@netlify/plugin-nextjs), getStore('comments') auto-wires
 *   from the ambient deploy context — no siteID/token needed. If those are ever required
 *   (e.g. an environment where the context is absent), they are read from env here and
 *   NEVER hardcoded. When neither auto-wiring nor env config is available (e.g. plain
 *   `next dev`), getStore / the get/set call throws; callers catch and the client adapter
 *   falls back to localStorage. This module surfaces failure by throwing — it does not
 *   swallow errors, so the route can return a 502.
 *
 * Consistency
 *   The store is opened with consistency:'strong' on BOTH the auto-wired and explicit
 *   (siteID/token) paths. Netlify Blobs defaults to EVENTUAL consistency, where a read
 *   can lag a write by up to ~60s. That breaks this feature: the route's append path is
 *   read-modify-write (getComments → push → putComments) and would silently drop comments
 *   under stale reads, and reviewer reloads / agent pulls read-after-write would miss
 *   recent comments. Strong consistency makes every read reflect the latest write.
 *
 * Key exports: getComments, putComments
 * External dependencies: @netlify/blobs (getStore), CommentStoreRecord type
 */

import { getStore } from '@netlify/blobs'
import type { CommentStoreRecord } from '../../components/annotation/AnnotationLayer.types'

/** The single Blobs store name for all comment records. */
const STORE_NAME = 'comments'

/**
 * Resolve a handle to the comments Blobs store.
 *
 * Prefers auto-wiring (the runtime injects the deploy context). Falls back to explicit
 * siteID + token from env ONLY if both are present — this covers environments where the
 * ambient context is missing. Secrets are read from process.env, never hardcoded. Any
 * failure to construct the store propagates to the caller.
 */
function commentsStore(): ReturnType<typeof getStore> {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID
  const token = process.env.NETLIFY_BLOBS_TOKEN
  if (siteID !== undefined && token !== undefined) {
    return getStore({ name: STORE_NAME, siteID, token, consistency: 'strong' })
  }
  // Auto-wired path (standard under @netlify/plugin-nextjs runtime).
  return getStore({ name: STORE_NAME, consistency: 'strong' })
}

/**
 * Read the stored record for a build, or null when the build has no record yet.
 * Returns the parsed CommentStoreRecord. Throws if the store is unavailable (caller
 * decides whether that is a 502 or a fall-through to local cache).
 */
export async function getComments(
  buildId: string,
): Promise<CommentStoreRecord | null> {
  const store = commentsStore()
  // get with type:'json' returns the parsed object, or null when the key is absent.
  const record = (await store.get(buildId, { type: 'json' })) as
    | CommentStoreRecord
    | null
  return record ?? null
}

/**
 * Write the full record for a build (overwrites the key). The route layer owns
 * read-modify-write for appends; this is the raw put. Throws if the store is unavailable.
 */
export async function putComments(
  buildId: string,
  record: CommentStoreRecord,
): Promise<void> {
  const store = commentsStore()
  await store.setJSON(buildId, record)
}
