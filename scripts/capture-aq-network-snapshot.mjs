/**
 * capture-aq-network-snapshot.mjs — one-time OpenAQ capture for the AQ Network
 *   sensor-growth map.
 *
 * Purpose
 *   The AQ Network "Sensors & coverage" section is an interactive sensor-growth map.
 *   Per decision #7 ("don't burn the API") it must NOT call OpenAQ on page load —
 *   instead the map + counters render from a committed SNAPSHOT JSON. This script does
 *   that capture ONCE: it reads a city's OpenAQ locations (a single /locations?bbox call
 *   — no per-station /latest requests, the cheap path) and writes a static snapshot that
 *   the page reads at build time.
 *
 *   Per sensor it captures only what the map needs:
 *     - id          (OpenAQ location id, as string)
 *     - lng, lat    (coordinates, [lng, lat] / Mapbox order)
 *     - type        ('reference' | 'low-cost', derived from OpenAQ isMonitor:
 *                    isMonitor=true → reference-grade monitor; else → low-cost)
 *     - firstSeen   (ISO date the sensor was first seen by OpenAQ = datetimeFirst;
 *                    null upstream → assigned the dataset's median deployment year so
 *                    the sensor still has a place on the timeline — flagged firstSeenEstimated)
 *
 *   It also derives the per-year growth curve the counters read:
 *     - sensors deployed per year (REAL — cumulative count by firstSeen year)
 *     - a short guesstimated pre-data RUNWAY before the earliest real year so the story
 *       reads as growth rather than appearing fully-formed (Accra's real data is recent,
 *       ~2020+, and back-loaded). The runway years are flagged estimated.
 *     - districts covered + people-in-range per year (DERIVED/GUESSTIMATED, scaled from
 *       the sensor count — there is no measured district/catchment dataset; flagged estimate).
 *
 * Honesty contract (matches the concept's guesstimate decision)
 *   Real things are real: per-sensor type + firstSeen come straight from OpenAQ; the
 *   real-year sensor counts are the true cumulative deployment. Guessed things are
 *   flagged: every snapshot carries `estimateNotes` and per-year `isEstimate` so the UI
 *   can label estimated values. We never present a guesstimate as a measured figure.
 *
 * How to run (ONE-TIME, on demand — NOT wired into the build):
 *   node scripts/capture-aq-network-snapshot.mjs            # default city: accra
 *   node scripts/capture-aq-network-snapshot.mjs london     # any registered city slug
 *   node scripts/capture-aq-network-snapshot.mjs --programme # ALL cities → programme.json
 *   Reads OPENAQ_API_KEY from .env.local (Node does not auto-load env files).
 *   Writes src/app/ux-concepts/aq-network-v2/_data/sensor-snapshots/<slug>.json (per-city)
 *   or .../programme.json (--programme, the network-wide globe snapshot).
 *   Review the diff by hand and commit the JSON. The committed JSON is what ships.
 *
 * Programme mode (--programme) — the AQ Network globe homepage data source
 *   Fetches EVERY city in PROGRAMME_CITIES (mirrors src/lib/openaq/cities.ts), tags each
 *   sensor with its city slug + member flag, and aggregates a network-wide per-year curve
 *   {year, cities, sensors, population}. Population-in-range per city is a documented
 *   guesstimate (PROGRAMME_CITIES[].populationInRange); the per-year population scales with
 *   the cumulative sensors deployed that year, so the curve reads as the programme growing.
 *   All cities here are Breathe Cities member cities (isMember=true) — the flag exists so the
 *   globe can EMPHASISE members vs any future non-member reference sensors without a code change.
 *
 * Why committed, not generated at deploy: Netlify shallow-clones and we must not hit
 *   OpenAQ at build/deploy time (rate limit + decision #7). The snapshot is source data.
 *
 * Key exports: none — run as a Node script.
 * External dependencies: node:fs, node:path, node:url, global fetch (Node 18+).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Repo paths (script lives in scripts/, repo root is its parent) ──────────────
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')
const ENV_LOCAL = resolve(REPO_ROOT, '.env.local')
const SNAPSHOT_DIR = resolve(
  REPO_ROOT,
  'src/app/ux-concepts/aq-network-v2/_data/sensor-snapshots',
)

/** OpenAQ v3 base URL. */
const OPENAQ_BASE_URL = 'https://api.openaq.org/v3'

/** Page size requested from /locations (OpenAQ's typical max page size). */
const LOCATIONS_PAGE_LIMIT = 100

/** The last year the timeline runs to (the "now" end of the growth story). */
const TIMELINE_END_YEAR = 2026

/**
 * How many guesstimated pre-data runway years to prepend before the earliest REAL
 * deployment year.
 *
 * Set to 0: the map is MARKER-DRIVEN (a sensor appears in the year it was first seen), and
 * real markers cannot exist before the earliest real year. A synthetic runway would show a
 * non-zero "sensors" curve with an EMPTY map in those years — a mismatch between the headline
 * and what the user sees. Starting the timeline at the earliest real year keeps markers,
 * counters, districts and people perfectly consistent and fully honest, while the real curve
 * (e.g. Accra 2020:1 → 2026:83) already reads clearly as growth. Kept as a named, documented
 * knob in case a city ever wants a short modelled lead-in.
 */
const RUNWAY_YEARS = 0

/**
 * City registry — slug → bbox + display name. Mirrors src/lib/openaq/cities.ts (kept
 * inline so this standalone script has no app-import dependency). bbox order is
 * [minLon, minLat, maxLon, maxLat] — the order OpenAQ's /locations expects.
 */
const CITIES = {
  accra: {
    name: 'Accra',
    center: [-0.187, 5.604],
    zoom: 11,
    bbox: [-0.35, 5.45, 0.1, 5.85],
  },
  london: {
    name: 'London',
    center: [-0.118, 51.509],
    zoom: 10.5,
    bbox: [-0.51, 51.287, 0.334, 51.692],
  },
}

/**
 * Read OPENAQ_API_KEY from .env.local. Node does not auto-load env files, so we parse
 * the one key we need. Throws a clear error if it's missing rather than failing later
 * with a confusing 401.
 */
function readApiKey() {
  let raw
  try {
    raw = readFileSync(ENV_LOCAL, 'utf8')
  } catch {
    throw new Error(`Could not read ${ENV_LOCAL} — is OPENAQ_API_KEY set there?`)
  }
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.startsWith('OPENAQ_API_KEY='))
  const key = line?.slice('OPENAQ_API_KEY='.length).trim()
  if (key === undefined || key.length === 0) {
    throw new Error('OPENAQ_API_KEY is not set in .env.local.')
  }
  return key
}

/**
 * Fetch all locations in a city bbox (single call, no /latest). Returns the raw OpenAQ
 * location rows. This is the cheap path: one request per city, well within the rate limit.
 */
async function fetchLocations(bbox, apiKey) {
  const url = `${OPENAQ_BASE_URL}/locations?bbox=${bbox.join(',')}&limit=${LOCATIONS_PAGE_LIMIT}`
  const res = await fetch(url, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`OpenAQ request failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.results ?? []
}

/**
 * Normalise OpenAQ's datetimeFirst (which is either null or {utc, local} or, defensively,
 * a bare ISO string) to an ISO date string or null. We keep the full ISO; the year is
 * derived where needed.
 */
function readFirstSeen(datetimeFirst) {
  if (datetimeFirst === null || datetimeFirst === undefined) {
    return null
  }
  if (typeof datetimeFirst === 'string') {
    return datetimeFirst
  }
  // {utc, local} shape — utc is the source of truth.
  return datetimeFirst.utc ?? datetimeFirst.local ?? null
}

/** Year (UTC) of an ISO date string, or null when it can't be parsed. */
function yearOf(isoDate) {
  if (isoDate === null) {
    return null
  }
  const y = new Date(isoDate).getUTCFullYear()
  return Number.isFinite(y) ? y : null
}

/** Median of a list of numbers (sorted middle). Used to place sensors with no firstSeen. */
function median(nums) {
  if (nums.length === 0) {
    return null
  }
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

/**
 * Estimate how many DISTINCT districts a given sensor count plausibly covers. There is no
 * measured district dataset, so this is a deliberate guesstimate: districts grow with the
 * network but saturate (a city has a finite number of districts, and new sensors
 * increasingly land in already-covered areas). We model it as a saturating curve toward a
 * cap, scaled by the present-day real figure so the present-day value lands on the curated
 * number. Flagged as estimate by the caller.
 */
function estimateDistricts(sensorCount, presentSensorCount, presentDistricts) {
  if (sensorCount <= 0) {
    return 0
  }
  // Saturating fraction: ~1 - e^(-k * n). k chosen so the present-day count reaches
  // ~presentDistricts. Then clamp to presentDistricts so it never overshoots the curated value.
  const k = 2.2 / Math.max(presentSensorCount, 1)
  const fraction = 1 - Math.exp(-k * sensorCount)
  const presentFraction = 1 - Math.exp(-k * presentSensorCount)
  const scaled = (fraction / presentFraction) * presentDistricts
  return Math.min(presentDistricts, Math.max(1, Math.round(scaled)))
}

/**
 * Estimate people within sensor range for a given district count. Guesstimate: average
 * people per covered district × districts covered. Per-district population is derived from
 * the curated present-day figure so the present-day value matches the curated estimate.
 * Flagged as estimate by the caller.
 */
function estimatePeopleInRange(
  districtsCovered,
  presentDistricts,
  presentPeople,
) {
  if (districtsCovered <= 0 || presentDistricts <= 0) {
    return 0
  }
  const perDistrict = presentPeople / presentDistricts
  return Math.round(perDistrict * districtsCovered)
}

/**
 * Build the snapshot object for a city from its raw OpenAQ locations.
 *
 * presentDistricts / presentPeople are the CURATED present-day figures (the real programme
 * district count and the existing guesstimated population) — passed in so the derived
 * per-year curves land on the curated numbers at the present day and only the SHAPE of the
 * earlier curve is guesstimated.
 */
function buildSnapshot(slug, city, locations, presentDistricts, presentPeople) {
  // ── Per-sensor records (REAL: type + firstSeen straight from OpenAQ). ──────────
  const realYears = locations
    .map((loc) => yearOf(readFirstSeen(loc.datetimeFirst)))
    .filter((y) => y !== null)
  // Sensors with no firstSeen get the median real year so they still sit on the timeline.
  const medianYear = median(realYears) ?? TIMELINE_END_YEAR

  const sensors = locations.map((loc) => {
    const firstSeenIso = readFirstSeen(loc.datetimeFirst)
    const realYear = yearOf(firstSeenIso)
    const firstSeenEstimated = realYear === null
    const firstSeenYear = realYear ?? medianYear
    return {
      id: String(loc.id),
      name: loc.name ?? `Location ${loc.id}`,
      // [lng, lat] — Mapbox/GeoJSON order (OpenAQ gives {latitude, longitude}).
      lng: loc.coordinates.longitude,
      lat: loc.coordinates.latitude,
      // isMonitor=true → reference-grade monitor; else → low-cost sensor.
      type: loc.isMonitor ? 'reference' : 'low-cost',
      // The year this sensor first appears on the timeline (real, or median when estimated).
      firstSeenYear,
      // Full ISO firstSeen when real; null when estimated (so the JSON stays honest).
      firstSeen: firstSeenIso,
      // True when firstSeen was missing upstream and the year was assigned.
      firstSeenEstimated,
    }
  })

  const presentSensorCount = sensors.length
  const earliestRealYear = realYears.length > 0 ? Math.min(...realYears) : medianYear

  // ── Timeline range: a short guesstimated runway before the earliest real year, → end. ──
  const startYear = earliestRealYear - RUNWAY_YEARS

  // ── Per-year curve. ───────────────────────────────────────────────────────────
  // For real years: cumulative count of sensors whose firstSeenYear <= year (REAL).
  // For runway years: a guesstimated ramp from a small seed up to the earliest real count,
  // so the line reads as growth rather than starting flat. Districts + people are derived.
  const timeline = []
  // The real cumulative count at the earliest real year — the runway ramps UP toward this.
  const countAtEarliestReal = sensors.filter(
    (s) => s.firstSeenYear <= earliestRealYear,
  ).length

  for (let year = startYear; year <= TIMELINE_END_YEAR; year += 1) {
    let sensorCount
    let isEstimate
    if (year < earliestRealYear) {
      // Guesstimated runway: linear ramp from ~1 up to (but not reaching) the earliest real count.
      const progress = (year - startYear + 1) / (RUNWAY_YEARS + 1)
      sensorCount = Math.max(1, Math.round(countAtEarliestReal * progress))
      isEstimate = true
    } else {
      // REAL: cumulative deployed by this year.
      sensorCount = sensors.filter((s) => s.firstSeenYear <= year).length
      isEstimate = false
    }
    const districtsCovered = estimateDistricts(
      sensorCount,
      presentSensorCount,
      presentDistricts,
    )
    const peopleInRange = estimatePeopleInRange(
      districtsCovered,
      presentDistricts,
      presentPeople,
    )
    timeline.push({
      year,
      // Sensors count: real for real years, guesstimated for the runway (flagged below).
      sensorCount,
      // Districts + people are ALWAYS derived/guesstimated from the sensor count.
      districtsCovered,
      peopleInRange,
      // True when the SENSOR count itself is guesstimated (runway years). Districts + people
      // are guesstimated in every year; the UI labels the population figure as an estimate always.
      isEstimate,
    })
  }

  return {
    // ── Provenance + honesty metadata. ──
    citySlug: slug,
    cityName: city.name,
    capturedAt: new Date().toISOString(),
    source: 'OpenAQ v3 /locations (one-time snapshot; not fetched at page load)',
    // Map framing carried in the snapshot so the page passes ONE object and the component
    // needs no separate cities import — keeps the section data-driven per city.
    center: city.center,
    zoom: city.zoom,
    startYear,
    endYear: TIMELINE_END_YEAR,
    counts: {
      total: presentSensorCount,
      reference: sensors.filter((s) => s.type === 'reference').length,
      lowCost: sensors.filter((s) => s.type === 'low-cost').length,
      firstSeenMissing: sensors.filter((s) => s.firstSeenEstimated).length,
    },
    estimateNotes: {
      sensors:
        'Sensor positions + type (reference/low-cost) are real OpenAQ data. Per-sensor ' +
        'firstSeen year is real where OpenAQ provides datetimeFirst; sensors missing it ' +
        'are placed at the dataset median year (firstSeenEstimated=true). Sensor counts in ' +
        'real years are the true cumulative deployment; the pre-data runway years are a ' +
        'guesstimated growth ramp (timeline[].isEstimate=true).',
      districtsAndPeople:
        'Districts covered and people-in-range are DERIVED/GUESSTIMATED from the sensor ' +
        'count (no measured district or catchment dataset). They are calibrated so the ' +
        'present-day values match the curated programme figures; earlier years are modelled.',
    },
    sensors,
    timeline,
  }
}

/**
 * Programme city registry for the GLOBE (network-wide) snapshot. Mirrors
 * src/lib/openaq/cities.ts (kept inline so this standalone script keeps zero app-import
 * dependency), plus two fields the per-city CITIES map doesn't carry:
 *   - isMember:          true for Breathe Cities member cities. Today every entry is a member;
 *                        the flag lets the globe emphasise members without a future code change.
 *   - populationInRange: a DOCUMENTED guesstimate of people living within sensor range at the
 *                        present day (order-of-magnitude city-scale figures, NOT a measured
 *                        catchment). Flagged as an estimate in the snapshot's estimateNotes.
 * bbox order is [minLon, minLat, maxLon, maxLat] (OpenAQ /locations order).
 */
const PROGRAMME_CITIES = {
  paris: { name: 'Paris', center: [2.349, 48.864], bbox: [2.22, 48.81, 2.47, 48.92], isMember: true, populationInRange: 2100000 },
  london: { name: 'London', center: [-0.118, 51.509], bbox: [-0.51, 51.287, 0.334, 51.692], isMember: true, populationInRange: 8900000 },
  'mexico-city': { name: 'Mexico City', center: [-99.133, 19.432], bbox: [-99.35, 19.15, -98.95, 19.65], isMember: true, populationInRange: 9200000 },
  milan: { name: 'Milan', center: [9.190, 45.464], bbox: [9.05, 45.38, 9.35, 45.55], isMember: true, populationInRange: 1400000 },
  brussels: { name: 'Brussels', center: [4.352, 50.847], bbox: [4.25, 50.78, 4.48, 50.92], isMember: true, populationInRange: 1200000 },
  jakarta: { name: 'Jakarta', center: [106.845, -6.208], bbox: [106.65, -6.40, 107.05, -6.05], isMember: true, populationInRange: 10500000 },
  johannesburg: { name: 'Johannesburg', center: [28.047, -26.204], bbox: [27.85, -26.40, 28.25, -26.00], isMember: true, populationInRange: 5600000 },
  accra: { name: 'Accra', center: [-0.187, 5.604], bbox: [-0.35, 5.45, 0.1, 5.85], isMember: true, populationInRange: 2500000 },
  nairobi: { name: 'Nairobi', center: [36.817, -1.286], bbox: [36.65, -1.45, 37.00, -1.10], isMember: true, populationInRange: 4400000 },
  bangkok: { name: 'Bangkok', center: [100.501, 13.756], bbox: [100.30, 13.55, 100.75, 13.95], isMember: true, populationInRange: 8300000 },
  bogota: { name: 'Bogota', center: [-74.072, 4.711], bbox: [-74.25, 4.50, -73.90, 4.85], isMember: true, populationInRange: 7400000 },
  'rio-de-janeiro': { name: 'Rio de Janeiro', center: [-43.173, -22.907], bbox: [-43.45, -23.10, -42.90, -22.70], isMember: true, populationInRange: 6700000 },
  sofia: { name: 'Sofia', center: [23.321, 42.698], bbox: [23.15, 42.60, 23.50, 42.80], isMember: true, populationInRange: 1300000 },
  warsaw: { name: 'Warsaw', center: [21.012, 52.230], bbox: [20.85, 52.10, 21.20, 52.35], isMember: true, populationInRange: 1800000 },
}

/**
 * Build the network-wide GLOBE snapshot from all programme cities' raw OpenAQ locations.
 *
 * `cityResults` is an array of { slug, city, locations } (one per programme city). Each sensor
 * is flattened into a single global list, tagged with its city slug + member flag, with the
 * SAME per-sensor honesty model as the per-city snapshot (real type + firstSeen, median-year
 * fallback flagged firstSeenEstimated).
 *
 * The aggregated per-year timeline carries exactly what the globe homepage counters read:
 *   - cities:     count of member cities that had >=1 sensor deployed by that year (REAL —
 *                 derived from the earliest sensor firstSeenYear per city).
 *   - sensors:    cumulative count of all sensors deployed network-wide by that year (REAL).
 *   - population: people-in-range network-wide, scaled by the fraction of each city's sensors
 *                 deployed by that year (DERIVED/GUESSTIMATE; lands on the curated present-day
 *                 sum at endYear). Flagged estimate.
 * Early/thin years are flagged isEstimate where the sensor curve is sparse so the UI can label
 * the modelled lead-in.
 */
function buildProgrammeSnapshot(cityResults) {
  // ── Flatten every city's sensors into one global list (REAL type + firstSeen). ──
  // First pass: collect all real firstSeen years across the whole programme for the median fallback.
  const allRealYears = []
  for (const { locations } of cityResults) {
    for (const loc of locations) {
      const y = yearOf(readFirstSeen(loc.datetimeFirst))
      if (y !== null) {
        allRealYears.push(y)
      }
    }
  }
  const programmeMedianYear = median(allRealYears) ?? TIMELINE_END_YEAR

  const sensors = []
  for (const { slug, city, locations } of cityResults) {
    for (const loc of locations) {
      const firstSeenIso = readFirstSeen(loc.datetimeFirst)
      const realYear = yearOf(firstSeenIso)
      const firstSeenEstimated = realYear === null
      sensors.push({
        id: `${slug}-${loc.id}`,
        name: loc.name ?? `Location ${loc.id}`,
        city: slug,
        cityName: city.name,
        isMember: city.isMember,
        // [lng, lat] — Mapbox/GeoJSON order (OpenAQ gives {latitude, longitude}).
        lng: loc.coordinates.longitude,
        lat: loc.coordinates.latitude,
        type: loc.isMonitor ? 'reference' : 'low-cost',
        firstSeenYear: realYear ?? programmeMedianYear,
        firstSeen: firstSeenIso,
        firstSeenEstimated,
      })
    }
  }

  // ── Per-city present-day figures + the year that city first appears (earliest sensor). ──
  const perCity = cityResults.map(({ slug, city }) => {
    const citySensors = sensors.filter((s) => s.city === slug)
    const cityRealYears = citySensors
      .map((s) => s.firstSeenYear)
      .filter((y) => Number.isFinite(y))
    const joinedYear = cityRealYears.length > 0 ? Math.min(...cityRealYears) : programmeMedianYear
    return {
      slug,
      name: city.name,
      center: city.center,
      isMember: city.isMember,
      populationInRange: city.populationInRange,
      sensorCount: citySensors.length,
      joinedYear,
    }
  })

  const earliestYear = Math.min(...perCity.map((c) => c.joinedYear))
  const startYear = earliestYear
  const presentSensors = sensors.length
  const presentCities = perCity.length
  const presentPopulation = perCity.reduce((sum, c) => sum + c.populationInRange, 0)

  // ── Aggregated per-year curve. ─────────────────────────────────────────────────
  const timeline = []
  for (let year = startYear; year <= TIMELINE_END_YEAR; year += 1) {
    // Cities that had at least one sensor deployed by this year (REAL).
    const citiesByYear = perCity.filter((c) => c.joinedYear <= year).length
    // Cumulative sensors network-wide by this year (REAL).
    const sensorsByYear = sensors.filter((s) => s.firstSeenYear <= year).length
    // Population-in-range network-wide: sum over cities of (city pop × fraction of that city's
    // sensors deployed by this year). DERIVED/GUESSTIMATE — lands on the curated sum at endYear.
    let population = 0
    for (const c of perCity) {
      const deployedInCity = sensors.filter(
        (s) => s.city === c.slug && s.firstSeenYear <= year,
      ).length
      const fraction = c.sensorCount > 0 ? deployedInCity / c.sensorCount : 0
      population += c.populationInRange * fraction
    }
    timeline.push({
      year,
      cities: citiesByYear,
      sensors: sensorsByYear,
      population: Math.round(population),
      // Flag thin early years (fewer than ~10% of the present network deployed) so the UI can
      // label the modelled lead-in. The curve itself is real; this only marks sparse years.
      isEstimate: sensorsByYear < presentSensors * 0.1,
    })
  }

  return {
    kind: 'programme',
    capturedAt: new Date().toISOString(),
    source: 'OpenAQ v3 /locations (one-time per-city snapshots, aggregated; not fetched at page load)',
    startYear,
    endYear: TIMELINE_END_YEAR,
    counts: {
      cities: presentCities,
      memberCities: perCity.filter((c) => c.isMember).length,
      sensors: presentSensors,
      reference: sensors.filter((s) => s.type === 'reference').length,
      lowCost: sensors.filter((s) => s.type === 'low-cost').length,
      population: presentPopulation,
      firstSeenMissing: sensors.filter((s) => s.firstSeenEstimated).length,
    },
    estimateNotes: {
      sensors:
        'Sensor positions + type (reference/low-cost) are real OpenAQ data across all programme ' +
        'cities. Per-sensor firstSeen year is real where OpenAQ provides datetimeFirst; sensors ' +
        'missing it are placed at the programme-wide median year (firstSeenEstimated=true). ' +
        'Cumulative sensor + city counts per year are the true network deployment.',
      population:
        'People-in-range per city is a documented order-of-magnitude guesstimate (city-scale, ' +
        'NOT a measured sensor catchment). The per-year population scales each city figure by ' +
        'the fraction of that city’s sensors deployed that year, so it lands on the curated ' +
        'present-day sum at the end year and reads as growth earlier. Always an estimate in the UI.',
    },
    // Per-city summary (used for the globe legend / future per-city emphasis).
    cities: perCity,
    sensors,
    timeline,
  }
}

/** Entry point. */
async function main() {
  // ── Programme (globe) mode: capture ALL cities, aggregate, write programme.json. ──
  if (process.argv[2] === '--programme') {
    const apiKey = readApiKey()
    const slugs = Object.keys(PROGRAMME_CITIES)
    console.log(`Capturing PROGRAMME snapshot — ${slugs.length} cities from OpenAQ …`)
    const cityResults = []
    for (const slug of slugs) {
      const city = PROGRAMME_CITIES[slug]
      try {
        const locations = await fetchLocations(city.bbox, apiKey)
        console.log(`  ${city.name.padEnd(16)} ${locations.length} locations`)
        cityResults.push({ slug, city, locations })
      } catch (err) {
        // One city failing must not sink the whole capture — record zero and continue.
        console.warn(`  ${city.name.padEnd(16)} FAILED (${err.message}) — captured as 0`)
        cityResults.push({ slug, city, locations: [] })
      }
    }

    const snapshot = buildProgrammeSnapshot(cityResults)
    mkdirSync(SNAPSHOT_DIR, { recursive: true })
    const outPath = resolve(SNAPSHOT_DIR, 'programme.json')
    writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

    console.log(
      `  TOTAL: ${snapshot.counts.cities} cities, ${snapshot.counts.sensors} sensors ` +
        `(${snapshot.counts.reference} reference, ${snapshot.counts.lowCost} low-cost)`,
    )
    console.log(`  timeline: ${snapshot.startYear}–${snapshot.endYear} (${snapshot.timeline.length} years)`)
    console.log(`  wrote ${outPath}`)
    return
  }

  const slug = (process.argv[2] ?? 'accra').toLowerCase()
  const city = CITIES[slug]
  if (city === undefined) {
    throw new Error(
      `Unknown city slug "${slug}". Known: ${Object.keys(CITIES).join(', ')}`,
    )
  }

  // Curated present-day figures (must match the city's CityProfile so the curve lands on
  // the real programme numbers). Accra: 13 districts, ~1.2M people in range (from accra.ts).
  const PRESENT_FIGURES = {
    accra: { districts: 13, people: 1200000 },
    london: { districts: 33, people: 8000000 },
  }
  const present = PRESENT_FIGURES[slug] ?? { districts: 1, people: 1 }

  const apiKey = readApiKey()
  console.log(`Capturing ${city.name} (${slug}) from OpenAQ …`)
  const locations = await fetchLocations(city.bbox, apiKey)
  console.log(`  fetched ${locations.length} locations`)

  const snapshot = buildSnapshot(
    slug,
    city,
    locations,
    present.districts,
    present.people,
  )

  mkdirSync(SNAPSHOT_DIR, { recursive: true })
  const outPath = resolve(SNAPSHOT_DIR, `${slug}.json`)
  writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

  console.log(`  reference: ${snapshot.counts.reference}  low-cost: ${snapshot.counts.lowCost}`)
  console.log(`  timeline: ${snapshot.startYear}–${snapshot.endYear} (${snapshot.timeline.length} years)`)
  console.log(`  wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
