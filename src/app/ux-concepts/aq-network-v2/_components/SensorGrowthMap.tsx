/**
 * SensorGrowthMap.tsx — the AQ Network "Sensors & coverage" centrepiece: an interactive
 *   sensor-growth map driven by a committed OpenAQ snapshot.
 *
 * Purpose
 *   Replaces the old programme-vs-live table. Shows a city's sensor network GROWING over
 *   time on a light Mapbox basemap, with three linked counters that update as the user
 *   scrubs a timeline. The story is "how the network was built", told honestly from a
 *   one-time OpenAQ snapshot — NO air-quality data, NO per-page-load API call (decision #7).
 *
 *   What the user sees / does:
 *     - A LIGHT basemap centred on the city.
 *     - Each sensor is a marker styled by TYPE, not air quality: reference-grade monitors
 *       (filled ink diamonds) vs low-cost sensors (hollow dots). A small legend explains it.
 *     - A timeline scrubber (startYear → endYear from the snapshot). Scrubbing changes which
 *       markers are shown: a marker appears in the year that sensor was first seen
 *       (firstSeenYear). So dragging from the start to now plays the network's growth.
 *     - Three counters that reflect the scrubbed year: Sensors deployed · Districts covered ·
 *       People within sensor range. People-in-range keeps its "Estimate" label (guesstimate).
 *
 * Rendering (reuses the proven CityMapHero structure)
 *   The map's rendering is rebuilt on the pattern that renders reliably on the deployed hub —
 *   src/app/ux-concepts/best-practice-roadmap-v2/_components/CityMapHero.tsx. Two things from
 *   that component are the reason it renders (and the reason this one previously went blank):
 *     1. CONTAINER: the map div is a NORMAL-FLOW child `<div className="w-full h-full" />`
 *        inside an explicit-height `relative` wrapper — NOT `absolute inset-0`. An
 *        absolutely-positioned map div can initialise before the container has a measured
 *        size, leaving the WebGL canvas 0×0 and blank. A loading skeleton (absolute inset-0,
 *        animate-pulse) sits over the wrapper until the map's load event fires.
 *     2. MARKERS: sensors are a single GeoJSON source + `circle` LAYER with data-driven colour
 *        by sensor TYPE — NOT per-sensor mapboxgl.Marker DOM elements. Scrubbing the timeline
 *        updates the layer via source.setData(geojsonForYear) instead of tearing down and
 *        recreating DOM markers each tick (far cheaper, and it shares CityMapHero's path).
 *   NOTE: CityMapHero fetches /api/locations live — we deliberately do NOT copy that. This
 *   component stays snapshot-driven (decision #7, no per-load OpenAQ call).
 *
 * Data-driven
 *   Everything comes from the SensorSnapshot passed in (keyed by OpenAQ slug upstream), so
 *   this component renders any city by data alone — London is a snapshot drop-in, no edit here.
 *   The circle layer's colour is data-driven on each feature's `type` property, so other
 *   cities' snapshots colour correctly with no component change.
 *
 * Client component: it creates a Mapbox map and manages a GeoJSON layer via side effects.
 *
 * Honesty
 *   Sensor positions + type are real OpenAQ data. The population counter is always labelled
 *   an estimate; the timeline's pre-data runway years are flagged (a small "modelled growth"
 *   note appears while scrubbed into an estimated year).
 *
 * Key exports: SensorGrowthMap (named)
 * External dependencies: react, mapbox-gl, lucide-react (icons), ../_data/sensor-snapshots/types,
 *   @/components/concept (InfoTooltip — the "i" affordance hiding the provenance/methodology copy).
 *
 * Side effects (all cleaned up on unmount / re-run):
 *   - Creates a Mapbox GL map instance in the container ref.
 *   - On the map's load event: adds a GeoJSON source ('sensors') + a circle layer
 *     ('sensors-circle') with data-driven colour by type, and flips mapLoaded → true (hides
 *     the skeleton). Calls map.resize() once on load as harmless belt-and-braces.
 *   - As the scrubbed year changes, updates the circle layer's data via
 *     source.setData(geojsonForYear) — no DOM marker churn.
 *   - Runs a play-timeline interval (setInterval) that advances selectedYear start→end once;
 *     the interval is cleared on unmount and when the user manually scrubs.
 *   - Reads process.env.NEXT_PUBLIC_MAPBOX_TOKEN (client-exposed token).
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import mapboxgl from 'mapbox-gl'
import { Radar, MapPin, Users, Play, RotateCcw } from 'lucide-react'
import {
  ConceptCard,
  ConceptStat,
  InfoTooltip,
  SENSOR_TIER_REFERENCE_HEX,
  SENSOR_TIER_LOWCOST_HEX,
  SENSOR_TIER_FALLBACK_HEX,
  SENSOR_TIER_STROKE_HEX,
} from '@/components/concept'
import type {
  SensorSnapshot,
  SnapshotSensor,
  SnapshotYear,
} from '../_data/sensor-snapshots/types'

import 'mapbox-gl/dist/mapbox-gl.css'

/** Client-exposed Mapbox token (NEXT_PUBLIC_ prefix → available in the browser bundle). */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/** Light basemap style — cribbed from direction-1-mapbox / the light-basemap branch. */
const LIGHT_BASEMAP_STYLE = 'mapbox://styles/mapbox/light-v11'

/**
 * Milliseconds per year-step when the Play control runs the timeline. ~700ms/step gives a
 * ~4–5s sweep over Accra's ~6–7 year range — slow enough to watch markers appear and the
 * three counters tick up ("watch the network grow"), fast enough not to drag.
 */
const PLAY_STEP_MS = 700

/*
 * Sensor circle-layer colours by TYPE come from the shared concept palette's SENSOR_TIER_*
 * constants (the documented Mapbox hex exception — GL paint expressions cannot read CSS custom
 * properties). reference → brand ink, low-cost → muted slate, fallback → grey, stroke → white.
 * Previously these were declared locally here; v2 sources them from @/components/concept so the
 * map and the globe share one definition.
 */

/** Props for SensorGrowthMap. */
type SensorGrowthMapProps = {
  /**
   * The city's committed sensor snapshot — the single data source: sensor positions + type,
   * the per-year growth curve, AND the map framing (center/zoom). So the page passes one object.
   */
  snapshot: SensorSnapshot
}

/**
 * Convert the snapshot sensors that exist by the scrubbed year into a GeoJSON FeatureCollection
 * for the circle layer. Each feature carries `properties.type` so the layer's `circle-color`
 * match expression can colour it data-drivenly (reference vs low-cost) with no per-feature
 * styling. `name` is carried for potential future popups/tooltips. Coordinates are [lng, lat]
 * (Mapbox order). This replaces the old per-sensor DOM-marker construction: one source + one
 * layer renders the whole set, and scrubbing just swaps the data (source.setData).
 */
function sensorsToGeoJSON(
  sensors: SnapshotSensor[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: sensors.map((sensor) => ({
      type: 'Feature',
      properties: {
        id: sensor.id,
        name: sensor.name,
        // 'reference' | 'low-cost' — the ONLY thing the layer colour encodes (not air quality).
        type: sensor.type,
      },
      geometry: {
        type: 'Point',
        coordinates: [sensor.lng, sensor.lat],
      },
    })),
  }
}

/*
 * The three linked counters previously used a local Counter component; v2 renders them with the
 * shared <ConceptCard><ConceptStat/></ConceptCard> primitives (same card surface + same stat
 * layout, including the functional Estimate pill) — see the render below.
 */

/**
 * The sensor-growth map section. Holds the scrubbed-year state (the single source of truth
 * for both which markers show and what the counters read), renders the Mapbox map with
 * type-styled markers filtered to that year, the type legend, the timeline slider, and the
 * three linked counters.
 */
export function SensorGrowthMap({
  snapshot,
}: SensorGrowthMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  // True once the map's load event has fired — hides the loading skeleton AND gates the
  // scrub effect (the circle source/layer only exist after load). Mirrors CityMapHero.
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)

  // ── Scrubbed year — the single source of truth. Starts at the present day (endYear) so the
  //    section opens on the full, current network; scrubbing back plays the growth in reverse. ──
  const [selectedYear, setSelectedYear] = useState<number>(snapshot.endYear)

  // ── Play state — true while the timeline is auto-advancing start→end. Drives the button label
  //    and disabled state. The interval id lives in a ref (not state) so cleanup/cancel can reach
  //    it without re-rendering. ──
  const [playing, setPlaying] = useState<boolean>(false)
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // True once a play has run to completion — flips the idle button label from "Play" to "Replay".
  // Distinct from the year check: on first load selectedYear already equals endYear (section opens
  // on the present-day network), so we must NOT show "Replay" until a play actually finished.
  const [hasPlayed, setHasPlayed] = useState<boolean>(false)

  /**
   * The snapshot timeline row for the scrubbed year — drives the three counters. Falls back to
   * the last row if (defensively) the year isn't found. Memoised on year so counters are cheap.
   */
  const yearData: SnapshotYear = useMemo(() => {
    const row = snapshot.timeline.find((t) => t.year === selectedYear)
    return row ?? snapshot.timeline[snapshot.timeline.length - 1]
  }, [snapshot.timeline, selectedYear])

  /** Sensors that exist by the scrubbed year (firstSeenYear <= year). Memoised on year. */
  const visibleSensors: SnapshotSensor[] = useMemo(
    () => snapshot.sensors.filter((s) => s.firstSeenYear <= selectedYear),
    [snapshot.sensors, selectedYear],
  )

  // ── Map initialisation — runs once on mount. Mirrors CityMapHero's proven init: create the
  //    map, and on the load event add a GeoJSON source + circle layer (data-driven colour by
  //    type) seeded with the present-day network. The flow-child container (see render) is the
  //    real fix for the blank canvas; map.resize() on load is kept only as belt-and-braces. ──
  useEffect(() => {
    if (containerRef.current === null) {
      return
    }
    if (MAPBOX_TOKEN === undefined || MAPBOX_TOKEN.length === 0) {
      // Token guard handled in render; nothing to init.
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Side effect: creates the Mapbox map on the LIGHT basemap, centred on the city
    // (framing comes from the snapshot).
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: LIGHT_BASEMAP_STYLE,
      center: snapshot.center,
      zoom: snapshot.zoom,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map

    map.on('load', () => {
      // Belt-and-braces resize once the style/canvas is ready. With the flow-child container the
      // canvas is already sized correctly, so this is a no-op; harmless to keep.
      map.resize()

      // Side effect: add the sensor GeoJSON source, seeded with the present-day network
      // (selectedYear starts at endYear). Subsequent scrubs swap the data via setData below.
      map.addSource('sensors', {
        type: 'geojson',
        data: sensorsToGeoJSON(
          snapshot.sensors.filter((s) => s.firstSeenYear <= snapshot.endYear),
        ),
      })

      // Side effect: add the circle layer with DATA-DRIVEN colour by sensor type. GL paint can't
      // read CSS vars, so these are hex literals (documented Mapbox exception). reference → brand
      // ink, low-cost → muted slate, anything else → grey fallback. White stroke for contrast on
      // the light basemap (matches CityMapHero).
      map.addLayer({
        id: 'sensors-circle',
        type: 'circle',
        source: 'sensors',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'type'],
            'reference',
            SENSOR_TIER_REFERENCE_HEX,
            'low-cost',
            SENSOR_TIER_LOWCOST_HEX,
            SENSOR_TIER_FALLBACK_HEX,
          ],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': SENSOR_TIER_STROKE_HEX,
        },
      })

      // Flip mapLoaded → hides the skeleton AND lets the scrub effect run setData.
      setMapLoaded(true)
    })

    // Side effect cleanup: remove the map instance on unmount (the source/layer go with it).
    return () => {
      map.remove()
      mapRef.current = null
    }
    // The map initialises once per mount; snapshot.center/zoom/sensors are stable for that mount.
    // The seeded data uses endYear (present day); all later years are applied by the scrub effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update the sensor layer for the visible (scrubbed-year) set. Re-runs whenever the visible
  //    set changes (the year moves via scrub or play) or once the map finishes loading. Instead
  //    of recreating DOM markers, it swaps the GeoJSON source's data — the circle layer re-paints
  //    itself from the new features (data-driven colour by type is already in the paint). ──
  useEffect(() => {
    const map = mapRef.current
    // Gate on mapLoaded: the 'sensors' source/layer are only added in the load handler.
    if (map === null || !mapLoaded) {
      return
    }

    const source = map.getSource('sensors') as mapboxgl.GeoJSONSource | undefined
    if (source === undefined) {
      return
    }

    // Side effect: swap the layer's data to the current year's visible sensors.
    source.setData(sensorsToGeoJSON(visibleSensors))
  }, [visibleSensors, mapLoaded])

  /**
   * Stop any running playback: clear the interval and flip `playing` off. Safe to call when
   * nothing is playing (the ref guard makes it a no-op). Used by the unmount cleanup, by the
   * manual-scrub interrupt, and when play reaches the end year.
   */
  const stopPlay = useCallback((): void => {
    if (playTimerRef.current !== null) {
      // Side effect: clears the year-advance interval.
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }
    setPlaying(false)
  }, [])

  /**
   * Start playback from the beginning: jump to startYear, then advance one year every
   * PLAY_STEP_MS until endYear, where it STOPS (plays once, no loop). The button returns to its
   * replay state via stopPlay() at the end. If a play is somehow already running, it's cleared
   * first so we never stack intervals.
   */
  const startPlay = useCallback((): void => {
    if (playTimerRef.current !== null) {
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }
    setPlaying(true)
    setSelectedYear(snapshot.startYear)

    // Side effect: interval that ticks the scrubbed year forward. Uses the functional updater so
    // it doesn't close over a stale selectedYear. When it would pass endYear, it clamps to
    // endYear, tears down the interval, and clears `playing` (replay state) — once only, no loop.
    playTimerRef.current = setInterval(() => {
      setSelectedYear((current) => {
        if (current >= snapshot.endYear) {
          if (playTimerRef.current !== null) {
            clearInterval(playTimerRef.current)
            playTimerRef.current = null
          }
          setPlaying(false)
          setHasPlayed(true)
          return snapshot.endYear
        }
        const next = current + 1
        // The next tick is the last → stop after applying it (don't overshoot endYear).
        if (next >= snapshot.endYear) {
          if (playTimerRef.current !== null) {
            clearInterval(playTimerRef.current)
            playTimerRef.current = null
          }
          setPlaying(false)
          setHasPlayed(true)
          return snapshot.endYear
        }
        return next
      })
    }, PLAY_STEP_MS)
  }, [snapshot.startYear, snapshot.endYear])

  /**
   * Handle a manual scrubber change. If the user drags while a play is running, cancel playback
   * first (don't fight the user — manual scrub interrupts), then apply their chosen year.
   */
  const handleManualScrub = useCallback(
    (year: number): void => {
      if (playTimerRef.current !== null) {
        stopPlay()
      }
      setSelectedYear(year)
    },
    [stopPlay],
  )

  // ── Unmount cleanup for the play interval. Mount-only effect: stopPlay is stable (useCallback
  //    with no changing deps), so this never re-runs and the cleanup fires exactly on unmount. ──
  useEffect(() => {
    return () => {
      stopPlay()
    }
  }, [stopPlay])

  // ── Token-missing guard. ──────────────────────────────────────────────────────
  if (MAPBOX_TOKEN === undefined || MAPBOX_TOKEN.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Map unavailable — NEXT_PUBLIC_MAPBOX_TOKEN is not set.
      </div>
    )
  }

  const isPresentDay = selectedYear === snapshot.endYear

  // The "Sensors deployed" counter is the ACTUAL number of markers on the map for the scrubbed
  // year (visibleSensors.length) — never the modelled timeline.sensorCount. This guarantees the
  // headline number always equals what the user can see on the map (no "counter says 3, map
  // shows 0" mismatch in the pre-data runway years, where real markers don't exist yet). The
  // modelled curve only ever drives the SHAPE; the counter stays honest to the visible markers.
  const sensorsDeployed = visibleSensors.length

  return (
    <div className="space-y-6">
      {/* ── Three linked counters — reflect the scrubbed year. Shared card + stat primitives. ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ConceptCard>
          <ConceptStat
            icon={<Radar className="h-5 w-5" />}
            value={sensorsDeployed.toLocaleString()}
            label="Sensors deployed"
          />
        </ConceptCard>
        <ConceptCard>
          <ConceptStat
            icon={<MapPin className="h-5 w-5" />}
            value={yearData.districtsCovered.toLocaleString()}
            label="Districts covered"
            estimate
          />
        </ConceptCard>
        <ConceptCard>
          <ConceptStat
            icon={<Users className="h-5 w-5" />}
            value={`~${yearData.peopleInRange.toLocaleString()}`}
            label="People within sensor range"
            estimate
          />
        </ConceptCard>
      </div>

      {/* ── The map + its legend + the timeline scrubber. ───────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        {/* Map canvas. Explicit-height RELATIVE wrapper; the map div is a NORMAL-FLOW child
            (w-full h-full), NOT absolute inset-0 — this is the structure that renders reliably
            (CityMapHero). An absolutely-positioned map div can init before the container is
            measured, leaving the WebGL canvas 0×0 and blank. */}
        <div className="relative h-[420px] w-full">
          {/* Loading skeleton — visible until the map's load event fires (mapLoaded). */}
          {!mapLoaded && (
            <div className="absolute inset-0 z-[5] animate-pulse bg-muted" />
          )}

          {/* Map container — flow child, fills the relative wrapper. */}
          <div ref={containerRef} className="h-full w-full" data-slot="sensor-growth-map" />

          {/* Type legend — reference vs low-cost (NOT air quality). Top-left, over the map. */}
          <div
            className="absolute left-3 top-3 z-10 rounded-xl border border-border bg-background/90 px-3 py-2.5 backdrop-blur"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sensor type
            </p>
            <ul className="mt-1.5 space-y-1.5">
              <li className="flex items-center gap-2 text-xs text-foreground">
                {/* Filled diamond swatch — reference-grade. */}
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rotate-45 rounded-[2px] border border-white"
                  style={{ backgroundColor: 'var(--bc-color-dark-blue)' }}
                />
                Reference-grade monitor
              </li>
              <li className="flex items-center gap-2 text-xs text-foreground">
                {/* Hollow dot swatch — low-cost. */}
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full bg-white"
                  style={{ border: '2.5px solid var(--bc-semantic-muted)' }}
                />
                Low-cost sensor
              </li>
            </ul>
          </div>
        </div>

        {/* Timeline scrubber — drives sensor existence over time. Repurposed from the
            direction-1-mapbox slider; here it filters markers by firstSeenYear. */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-3 sm:px-6">
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-xs font-semibold text-foreground">
              Network growth {snapshot.startYear}&ndash;{snapshot.endYear}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isPresentDay ? 'Drag to replay growth' : 'Scrubbing back in time'}
            </span>
          </div>

          {/* Play control — runs the timeline once start→end so the network "grows" on its own.
              Manual scrubbing (below) cancels it. While running it shows a disabled "Playing…"
              state; after it finishes it returns to a "Replay" label (the icon switches to a
              loop-back glyph). No emoji — lucide icon + text only. */}
          <button
            type="button"
            onClick={startPlay}
            disabled={playing}
            aria-label={
              playing
                ? 'Playing the network growth timeline'
                : 'Play the network growth timeline from the start'
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity disabled:cursor-default disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bc-semantic-brand)',
              color: 'var(--bc-color-white)',
            }}
          >
            {playing ? (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Playing&hellip;
              </>
            ) : hasPlayed ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Replay
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Play
              </>
            )}
          </button>

          <input
            type="range"
            min={snapshot.startYear}
            max={snapshot.endYear}
            step={1}
            value={selectedYear}
            onChange={(e) => handleManualScrub(Number(e.target.value))}
            aria-label={`Year: ${selectedYear}. Drag to change which sensors are shown.`}
            className="flex-1 cursor-pointer"
            style={{ accentColor: 'var(--bc-semantic-brand)' }}
          />

          <span
            className="rounded-full px-3 py-1 text-sm font-bold tabular-nums"
            style={{
              backgroundColor: 'var(--bc-semantic-brand)',
              color: 'var(--bc-color-white)',
            }}
          >
            {selectedYear}
          </span>
        </div>
      </div>

      {/* Honest framing / methodology — KEPT (load-bearing for data-attribution-traceability)
          but moved BEHIND an "i" tooltip in the concept-housekeeping pass (the inline descriptive
          paragraph was hidden). The base sentence is always in the tooltip; the modelled-growth
          note is still conditional on the data (it appears only if the scrubbed year's sensor
          count is itself guesstimated — a pre-data runway, RUNWAY_YEARS > 0 in the capture
          script). Accra has no runway, so it stays hidden; the guard keeps any runway city correct. */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <InfoTooltip label="Data sources and methodology">
          <span>
            Sensor positions and type are real OpenAQ data, captured once (not fetched live).
            Districts covered and people within range are estimates derived from the network&rsquo;s
            spread.
            {yearData.isEstimate && (
              <>
                {' '}
                For {selectedYear}, the sensor count is a modelled early-growth estimate (OpenAQ
                has little data this far back).
              </>
            )}
          </span>
        </InfoTooltip>
        <span>Data &amp; methodology</span>
      </div>
    </div>
  )
}
