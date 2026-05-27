/**
 * capture-rt-snapshots.mjs — one-shot capture of OpenAQ snapshots for the real-time monitoring demo.
 *
 * Purpose:
 *   Produces the committed snapshot JSON under src/data/snapshots/rt-monitoring/<city>.json that the
 *   real-time monitoring component serves by default (see src/lib/openaq/snapshot.ts). For each demo
 *   city it fetches the LIVE normalized Station[] (via the same adapter the live route uses, so the
 *   shape is byte-identical) for each captured parameter, and writes one file per city carrying every
 *   parameter plus the capture instant. Freshness is captured exactly as the adapter computed it at
 *   this instant and is FROZEN — the snapshot is never re-aged at read time.
 *
 *   This is the ONLY producer of those JSON files (they are never hand-edited). Re-run it to refresh
 *   the demo data; commit the result. The honest "data as of <date>" label is driven by capturedAt.
 *
 * Usage (from the repo root, with .env.local carrying OPENAQ_API_KEY):
 *   node --import tsx tools/capture-rt-snapshots.mjs
 *
 * It loads .env.local itself (dotenv) so OPENAQ_API_KEY is available to the adapter's client.
 *
 * External dependencies: dotenv (env load), tsx (runs the TS adapter), the OpenAQ adapter + cities.
 */

import { config as loadEnv } from 'dotenv'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Load the server-only OpenAQ key from .env.local before importing the adapter (its client reads
// process.env.OPENAQ_API_KEY at call time, so the env must be populated first).
loadEnv({ path: '.env.local' })

// Import the adapter AFTER env load. tsx compiles the .ts on the fly.
const { fetchStations } = await import('../src/lib/openaq/adapter.ts')

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'snapshots', 'rt-monitoring')

/** The demo cities (brief) and the parameters the toolkit UI can display. */
const CITY_SLUGS = ['accra', 'bangkok', 'paris', 'london']
const PARAMETERS = ['pm25', 'pm10']

/**
 * Pause between successive parameter fetches. Each city's pm25 fetch can issue up to ~30 per-station
 * /latest calls; firing the pm10 fetch immediately after bursts past OpenAQ's 60/min limit on the
 * big cities (Bangkok, London) and trips a 429. A short spacer keeps the rolling window under the
 * cap. Capture is a one-shot offline job, so the extra wall-clock cost is irrelevant.
 */
const INTER_FETCH_DELAY_MS = 15000

/** Sleep helper for the inter-fetch spacer. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Capture one city: fetch each parameter, assemble the SnapshotFile shape. */
async function captureCity(slug, capturedAt) {
  const parameters = {}
  for (let i = 0; i < PARAMETERS.length; i += 1) {
    const parameter = PARAMETERS[i]
    process.stdout.write(`  ${slug} / ${parameter} … `)
    try {
      const stations = await fetchStations(slug, parameter)
      parameters[parameter] = stations
      const fresh = stations.filter((s) => {
        const r = s.parameters[parameter]
        return r !== undefined && r.isStale === false
      }).length
      console.log(`${stations.length} stations (${fresh} fresh at capture)`)
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`)
      // Write an empty array rather than abort the whole run — a city/parameter with no live data
      // at capture time is an honest empty snapshot (the route still falls through to live for it).
      parameters[parameter] = []
    }
    // Space out the next fetch (within this city and before the next city) to respect the rate limit.
    await sleep(INTER_FETCH_DELAY_MS)
  }
  return { city: slug, capturedAt, parameters }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  // One capture instant for the whole run so every city's label reads the same "as of" date.
  const capturedAt = new Date().toISOString()
  console.log(`Capturing OpenAQ snapshots at ${capturedAt}`)

  for (const slug of CITY_SLUGS) {
    const snapshot = await captureCity(slug, capturedAt)
    const outPath = join(OUT_DIR, `${slug}.json`)
    await writeFile(outPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
    console.log(`  → wrote ${outPath}`)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error('Capture failed:', err)
  process.exit(1)
})
