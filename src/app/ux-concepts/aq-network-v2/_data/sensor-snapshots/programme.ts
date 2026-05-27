/**
 * programme.ts — loader for the network-wide GLOBE snapshot.
 *
 * Purpose
 *   The AQ Network homepage globe renders from a single committed snapshot aggregated across
 *   all member cities (captured once via `node scripts/capture-aq-network-snapshot.mjs
 *   --programme`). This module imports that JSON, asserts it to ProgrammeSnapshot (the one
 *   place the JSON↔type contract is enforced), and exposes it to the page + component.
 *
 *   Single static import (resolveJsonModule) — no per-load network call (decision #7).
 *
 * Key exports: getProgrammeSnapshot
 * External dependencies: ./programme-types (ProgrammeSnapshot), ./programme.json.
 */

import type { ProgrammeSnapshot } from './programme-types'
// The committed network-wide snapshot JSON (captured once from OpenAQ, aggregated; not fetched
// at page load). Plain JSON import — matches the repo's existing accra.json import pattern.
import programme from './programme.json'

/**
 * Return the network-wide programme snapshot. Asserted to ProgrammeSnapshot here so the rest
 * of the app gets a typed object. Synchronous (the JSON is bundled) — no loading state needed.
 */
export function getProgrammeSnapshot(): ProgrammeSnapshot {
  return programme as ProgrammeSnapshot
}
