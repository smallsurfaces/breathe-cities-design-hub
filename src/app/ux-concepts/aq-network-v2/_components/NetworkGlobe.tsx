/**
 * NetworkGlobe.tsx — the AQ Network homepage centrepiece: an interactive 3D Mapbox GLOBE
 *   showing the WHOLE Breathe Cities sensor network worldwide, driven by a committed
 *   programme snapshot (NO live OpenAQ call — decision #7).
 *
 * Purpose / what the user sees + does
 *   - A 3D globe (Mapbox `projection: 'globe'`) on a light basemap, so the
 *     bright sensor markers read like city lights against the Earth (deliberate theme choice —
 *     a globe pops on dark; the page chrome around it stays light per the hub convention).
 *   - EVERY programme sensor plotted as a GL circle. Reference-grade monitors and low-cost
 *     sensors are sized/coloured by tier; Breathe Cities member-city sensors are emphasised
 *     (larger, brighter) vs any future non-member reference points.
 *   - Drag to spin, scroll/pinch to zoom (native Mapbox).
 *   - "Reset to globe" button → flyTo a global low-zoom framing.
 *   - Slow auto-rotate when idle near globe zoom (rAF bearing/centre nudge); pauses on any
 *     user interaction and resumes after an idle delay while still zoomed out.
 *   - A timeline scrubber + Play: scrubbing the year filters which sensors are shown (a sensor
 *     appears in its firstSeenYear) and updates the three programme counters, so dragging from
 *     the start to now plays the network's global growth. Play runs once (no loop); manual
 *     scrub cancels it; everything is cleaned up on unmount.
 *
 * RENDER PATTERN (critical — flat maps blanked with `absolute inset-0` on this hub)
 *   This copies the PROVEN structure from best-practice-roadmap/_components/CityMapHero.tsx:
 *     - the map div is a FLOW CHILD `className="w-full h-full"` inside an explicit-height
 *       `relative` wrapper (NOT `absolute inset-0`),
 *     - sensors are a GL GeoJSON source + circle layer (NOT DOM `mapboxgl.Marker`),
 *     - year filtering uses a Mapbox filter EXPRESSION on the source (cheap; no marker churn).
 *   plus a load-time + ResizeObserver resize (the robust fix for the mid-page blank-canvas bug).
 *
 * Honesty
 *   Sensor positions + type are real OpenAQ data; per-year city + sensor counts are the true
 *   cumulative network deployment. Population-in-range is a documented estimate (labelled).
 *
 * Key exports: NetworkGlobe (named)
 * External dependencies: react, mapbox-gl, lucide-react, ../_data/sensor-snapshots/programme-types.
 *
 * Side effects (all cleaned up on unmount / re-run):
 *   - Creates a Mapbox GL globe instance in the container ref; sets fog on load.
 *   - Adds a GeoJSON source + THREE circle layers (a blue glow beneath, then low-cost + reference
 *     markers); updates all three layer filters when the year changes.
 *   - Runs ONE rAF loop doing two things: time-based auto-rotate (~10s/turn, pauses on interaction,
 *     resumes on idle) AND a blue glow pulse (sine-driven radius/opacity on the glow layer's paint,
 *     so the network "breathes"). Single loop, cancelled on unmount.
 *   - Runs a play-timeline interval (advance year start→end once); cleared on unmount + on scrub.
 *   - Reads process.env.NEXT_PUBLIC_MAPBOX_TOKEN (client-exposed token).
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import { Building2, Radar, Users, Play, RotateCcw, Globe2 } from 'lucide-react'
import {
  SENSOR_TIER_REFERENCE_HEX,
  SENSOR_TIER_LOWCOST_HEX,
} from '@/components/concept'
import type {
  ProgrammeSnapshot,
  ProgrammeSensor,
  ProgrammeYear,
} from '../_data/sensor-snapshots/programme-types'
import { CITY_PROFILE_SLUGS } from '../_data/cities'

import 'mapbox-gl/dist/mapbox-gl.css'

/** Client-exposed Mapbox token (NEXT_PUBLIC_ prefix → available in the browser bundle). */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/**
 * Slugs of cities that have a member-profile page, as a Set for O(1) membership tests in the
 * globe's hover/click handlers. Sourced from the SAME registry the dynamic [city] route uses
 * (CITY_PROFILE_SLUGS), so when a new profile is registered the matching dots become interactive
 * automatically — no edit here. Today: only `accra` + `london`. A dot whose city is NOT in this
 * set is inert (no pointer cursor, click does nothing) so there are never dead-end navigations.
 */
const PROFILE_SLUG_SET = new Set<string>(CITY_PROFILE_SLUGS)

/** Light basemap (matches the page chrome); markers deepened for contrast on light. */
const GLOBE_STYLE = 'mapbox://styles/mapbox/light-v11'

/** The global "see the whole network" framing the Reset button (and initial load) flies to. */
const GLOBE_VIEW = {
  center: [10, 25] as [number, number],
  zoom: 1.4,
  pitch: 0,
  bearing: 0,
}

/**
 * Zoom at/below which auto-rotate is allowed to run. Above this the user has zoomed into a
 * region and spinning would be disorienting, so rotation only resumes once back near globe view.
 */
const AUTO_ROTATE_MAX_ZOOM = 2.2

/**
 * Milliseconds for one full 360° rotation. TIME-BASED (not per-frame): each rAF tick advances
 * the globe by (deltaMs / AUTO_ROTATE_PERIOD_MS) * 360 degrees using the timestamp delta between
 * frames, so a full turn takes ~40s on ANY display (the old per-frame nudge was frame-rate
 * dependent — twice as fast on a 120Hz panel as on 60Hz).
 */
const AUTO_ROTATE_PERIOD_MS = 40_000

/** Idle delay (ms) after the last user interaction before auto-rotate resumes. */
const AUTO_ROTATE_RESUME_MS = 3500

/**
 * Blue "alive" glow tuning. A soft blue circle sits BENEATH the marker layers and breathes via a
 * sine over GLOW_PULSE_PERIOD_MS, oscillating its radius (GLOW_RADIUS_MIN→MAX) and opacity
 * (GLOW_OPACITY_MIN→MAX). It animates on the SAME rAF tick as the rotation (one loop, not two).
 */
const GLOW_PULSE_PERIOD_MS = 1800
const GLOW_RADIUS_MIN = 7
const GLOW_RADIUS_MAX = 12
const GLOW_OPACITY_MIN = 0.1
const GLOW_OPACITY_MAX = 0.32

/**
 * Glow colour. Mapbox paint properties cannot read CSS custom properties, so a literal hex is the
 * documented exception here (same exception the marker tier colours use). Soft network blue — sits
 * BEHIND the blue/amber dots so it never washes out the marker colours.
 */
const COLOR_GLOW = '#3b82f6' // blue-500 — the network "alive" pulse, behind all markers

/**
 * Milliseconds per year-step when Play runs the timeline. ~750ms/step gives a watchable sweep
 * over the ~11-year programme range — slow enough to see cities + sensors appear worldwide.
 */
const PLAY_STEP_MS = 750

/*
 * Marker tier colours now come from the shared concept palette (the documented Mapbox hex
 * exception lives there). v2 binds the globe's reference/low-cost colours to the SAME
 * SENSOR_TIER_* constants the sensor-growth map uses — this is the v2 fix that brings the globe's
 * former amber/sky tiers into line with the map's brand-ink / slate (one network, one tier
 * colour system). Aliased to the existing local names so the rest of the file is unchanged.
 */
/** Reference-grade monitors — brand dark-blue ink (shared with the map). */
const COLOR_REFERENCE = SENSOR_TIER_REFERENCE_HEX
/** Low-cost / community sensors — muted slate (shared with the map). */
const COLOR_LOWCOST = SENSOR_TIER_LOWCOST_HEX
/** White contrast ring around markers so they stay legible over land + ocean. */
const MARKER_RING = '#ffffff'

/** Props for NetworkGlobe. */
type NetworkGlobeProps = {
  /** The committed network-wide programme snapshot (the single data source for the globe). */
  snapshot: ProgrammeSnapshot
}

/**
 * Convert programme sensors to a GeoJSON FeatureCollection for the circle layers. Each feature
 * carries `firstSeenYear` (so a Mapbox filter expression can show/hide by the scrubbed year),
 * `tier`/`member` (so paint can size+colour reference vs low-cost and emphasise members), and
 * `citySlug` (so the hover/click handlers can route a dot to its member-profile page when one
 * exists). `citySlug` is the programme snapshot's `city` field, which IS the OpenAQ city slug.
 */
function sensorsToGeoJSON(
  sensors: ProgrammeSensor[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: sensors.map((s) => ({
      type: 'Feature',
      properties: {
        id: s.id,
        name: s.name,
        cityName: s.cityName,
        citySlug: s.city, // OpenAQ city slug — drives click-through to the city's profile page
        tier: s.type, // 'reference' | 'low-cost'
        member: s.isMember,
        firstSeenYear: s.firstSeenYear,
      },
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    })),
  }
}

/**
 * One programme counter — a big number with a label + icon. `estimate` adds a small pill
 * (population-in-range is a documented guesstimate).
 */
function Counter({
  icon,
  value,
  label,
  estimate,
}: {
  icon: ReactElement
  value: string
  label: string
  estimate: boolean
}): ReactElement {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
        {estimate && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--bc-color-yellow) 30%, var(--bc-color-white))',
              color: 'var(--bc-semantic-text)',
            }}
          >
            Estimate
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

/**
 * The network globe section. Holds the scrubbed-year state (the single source of truth for both
 * the layer filter and the counters), the Mapbox globe with the sensor circle layers, the
 * reset + auto-rotate behaviour, and the timeline scrubber + play + three programme counters.
 */
export function NetworkGlobe({ snapshot }: NetworkGlobeProps): ReactElement {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapReadyRef = useRef<boolean>(false)
  const [mapReady, setMapReady] = useState<boolean>(false)

  // ── Scrubbed year — the single source of truth. Opens on the present day (full network). ──
  const [selectedYear, setSelectedYear] = useState<number>(snapshot.endYear)

  // ── Play state. The interval id lives in a ref so cleanup/cancel reach it without re-render. ──
  const [playing, setPlaying] = useState<boolean>(false)
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [hasPlayed, setHasPlayed] = useState<boolean>(false)

  // ── Auto-rotate machinery (refs so the rAF loop reads live values without re-subscribing). ──
  const rotateFrameRef = useRef<number | null>(null)
  const interactingRef = useRef<boolean>(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timestamp of the previous rAF frame — drives BOTH the time-based rotation delta and the glow
  // pulse phase. null until the first frame (so we never apply a bogus huge delta on frame one).
  const lastFrameTsRef = useRef<number | null>(null)

  /** The timeline row for the scrubbed year — drives the three counters. */
  const yearData: ProgrammeYear = useMemo(() => {
    const row = snapshot.timeline.find((t) => t.year === selectedYear)
    return row ?? snapshot.timeline[snapshot.timeline.length - 1]
  }, [snapshot.timeline, selectedYear])

  /** The full sensor GeoJSON (built once — the YEAR filter is applied on the layer, not here). */
  const sensorGeoJSON = useMemo(() => sensorsToGeoJSON(snapshot.sensors), [snapshot.sensors])

  // ── Map initialisation — runs once on mount. ──────────────────────────────────
  useEffect(() => {
    if (containerRef.current === null) {
      return
    }
    if (MAPBOX_TOKEN === undefined || MAPBOX_TOKEN.length === 0) {
      return // token guard handled in render
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Side effect: create the Mapbox GLOBE on the dark basemap at the global framing.
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: GLOBE_STYLE,
      projection: { name: 'globe' },
      center: GLOBE_VIEW.center,
      zoom: GLOBE_VIEW.zoom,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map

    map.on('style.load', () => {
      // Side effect: light atmosphere so the globe reads as a planet against a light backdrop.
      map.setFog({
        color: 'rgb(214, 226, 240)', // lower atmosphere — soft light blue
        'high-color': 'rgb(170, 200, 235)', // upper atmosphere — light sky
        'horizon-blend': 0.12,
        'space-color': 'rgb(246, 249, 252)', // near-white space behind the globe (light)
        'star-intensity': 0, // no stars on a light backdrop
      })
    })

    map.on('load', () => {
      mapReadyRef.current = true
      // Resize fix (1/2): force a resize once the canvas is ready (mid-page maps can init at 0×0).
      map.resize()
      setMapReady(true)
    })

    // Resize fix (2/2): observe the container for any later size change and resize the globe.
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current !== null) {
        mapRef.current.resize()
      }
    })
    resizeObserver.observe(containerRef.current)

    // ── Auto-rotate: pause on any user interaction, resume after an idle delay (if zoomed out). ──
    const pauseRotation = (): void => {
      interactingRef.current = true
      // Drop the rotation baseline so that when spin resumes, the first active frame uses a normal
      // one-frame delta instead of the entire interaction span (which would jolt the globe).
      lastFrameTsRef.current = null
      if (resumeTimerRef.current !== null) {
        clearTimeout(resumeTimerRef.current)
      }
      // Side effect: schedule resume — only flips the flag; the rAF loop checks zoom itself.
      resumeTimerRef.current = setTimeout(() => {
        interactingRef.current = false
      }, AUTO_ROTATE_RESUME_MS)
    }
    map.on('mousedown', pauseRotation)
    map.on('touchstart', pauseRotation)
    map.on('wheel', pauseRotation)
    map.on('dragstart', pauseRotation)

    // Side effect: ONE rAF loop driving BOTH the time-based spin AND the blue glow pulse.
    //   - Rotation is TIME-BASED: advance by (deltaMs / AUTO_ROTATE_PERIOD_MS) * 360 degrees so a
    //     full turn takes ~10s on any refresh rate. Only runs while idle + near globe zoom; when
    //     paused we reset the delta baseline so resume doesn't apply an accumulated jump.
    //   - Glow pulse runs EVERY frame (independent of the rotation pause) — it's the network
    //     "alive" effect — by oscillating the glow layer's paint props with a sine of the clock.
    const tick = (ts: number): void => {
      const m = mapRef.current
      if (m !== null) {
        const last = lastFrameTsRef.current
        const deltaMs = last === null ? 0 : ts - last
        lastFrameTsRef.current = ts

        // ── Time-based rotation ──
        if (!interactingRef.current && m.getZoom() <= AUTO_ROTATE_MAX_ZOOM) {
          if (deltaMs > 0) {
            const center = m.getCenter()
            center.lng -= (deltaMs / AUTO_ROTATE_PERIOD_MS) * 360
            // jumpTo (not easeTo) inside rAF so we don't stack animations; it's a tiny per-frame nudge.
            m.jumpTo({ center })
          }
        } else {
          // Paused (interacting or zoomed in): drop the baseline so the next active frame's delta
          // is the single-frame gap, not the whole paused span — prevents a sudden spin jump.
          lastFrameTsRef.current = ts
        }

        // ── Blue glow pulse (always, while the glow layer exists) ──
        if (m.getLayer('sensors-glow') !== undefined) {
          // sine in [0,1] over the pulse period → breathe radius + opacity together.
          const phase = (Math.sin((ts / GLOW_PULSE_PERIOD_MS) * Math.PI * 2) + 1) / 2
          const radius = GLOW_RADIUS_MIN + (GLOW_RADIUS_MAX - GLOW_RADIUS_MIN) * phase
          const opacity = GLOW_OPACITY_MIN + (GLOW_OPACITY_MAX - GLOW_OPACITY_MIN) * phase
          // Side effect: animate paint props on the existing layer (no per-frame feature rebuild).
          m.setPaintProperty('sensors-glow', 'circle-radius', radius)
          m.setPaintProperty('sensors-glow', 'circle-opacity', opacity)
        }
      }
      rotateFrameRef.current = requestAnimationFrame(tick)
    }
    rotateFrameRef.current = requestAnimationFrame(tick)

    // Side effect cleanup: stop the rAF (rotation + glow pulse), clear resume timer, reset the
    // frame-timestamp baseline, disconnect observer, remove the map.
    return () => {
      if (rotateFrameRef.current !== null) {
        cancelAnimationFrame(rotateFrameRef.current)
        rotateFrameRef.current = null
      }
      if (resumeTimerRef.current !== null) {
        clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
      }
      lastFrameTsRef.current = null
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      mapReadyRef.current = false
    }
    // Mount-only: the globe initialises once; snapshot data is applied in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Add the sensor source + circle layers once the map is ready. ───────────────
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || map === null) {
      return
    }
    if (map.getSource('sensors') !== undefined) {
      return // already added
    }

    // Side effect: GeoJSON source with every sensor (filtered per-year on the layers below).
    map.addSource('sensors', { type: 'geojson', data: sensorGeoJSON })

    // Glow layer (drawn FIRST → sits BENEATH both marker layers). A soft blue circle per sensor;
    // its radius + opacity are animated by the rAF tick to breathe (the network "alive" effect).
    // Initial radius/opacity are mid-range so it looks right before the first pulse frame lands.
    // Glow shows for ALL sensors present in the scrubbed year (no tier filter — blue on everything).
    map.addLayer({
      id: 'sensors-glow',
      type: 'circle',
      source: 'sensors',
      filter: ['<=', ['get', 'firstSeenYear'], selectedYear],
      paint: {
        'circle-color': COLOR_GLOW,
        'circle-radius': (GLOW_RADIUS_MIN + GLOW_RADIUS_MAX) / 2,
        'circle-opacity': (GLOW_OPACITY_MIN + GLOW_OPACITY_MAX) / 2,
        'circle-blur': 1, // soft edge so it reads as a glow, not a hard disc behind the dot
      },
    })

    // Low-cost layer (above glow, behind reference). Bigger dots than before (~+70%); members
    // emphasised slightly. Radius also grows with zoom so dots stay visible on the globe.
    map.addLayer({
      id: 'sensors-lowcost',
      type: 'circle',
      source: 'sensors',
      filter: ['all', ['==', ['get', 'tier'], 'low-cost'], ['<=', ['get', 'firstSeenYear'], selectedYear]],
      paint: {
        'circle-color': COLOR_LOWCOST,
        // Bumped from 2.4/1.8 (z1) and 5/4 (z5) by ~+70%, keeping member > non-member.
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          1, ['case', ['get', 'member'], 4, 3],
          5, ['case', ['get', 'member'], 8.5, 6.8],
        ],
        'circle-opacity': 0.85,
        'circle-stroke-width': ['case', ['get', 'member'], 0.6, 0.3],
        'circle-stroke-color': MARKER_RING,
      },
    })

    // Reference layer (drawn on top). Bigger dots than before (~+70%); members emphasised more.
    map.addLayer({
      id: 'sensors-reference',
      type: 'circle',
      source: 'sensors',
      filter: ['all', ['==', ['get', 'tier'], 'reference'], ['<=', ['get', 'firstSeenYear'], selectedYear]],
      paint: {
        'circle-color': COLOR_REFERENCE,
        // Bumped from 3.2/2.4 (z1) and 7/5 (z5) by ~+70%, keeping member > non-member.
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          1, ['case', ['get', 'member'], 5.4, 4],
          5, ['case', ['get', 'member'], 12, 8.5],
        ],
        'circle-opacity': 0.92,
        'circle-stroke-width': ['case', ['get', 'member'], 1, 0.5],
        'circle-stroke-color': MARKER_RING,
      },
    })

    // Side effect: hover tooltip + click-through on either sensor layer.
    //   - The city-name tooltip shows for EVERY dot (useful context on any sensor).
    //   - The POINTER cursor is set ONLY when the hovered dot's city has a profile page
    //     (citySlug ∈ PROFILE_SLUG_SET) — that's the affordance that teaches users which dots
    //     are interactive. Dots without a profile keep the default cursor.
    //   - Clicking a dot whose city has a profile navigates to that profile; a dot without a
    //     profile does nothing (no dead-end route).
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
      className: 'aq-globe-popup',
    })
    const onEnter = (e: mapboxgl.MapLayerMouseEvent): void => {
      const f = e.features?.[0]
      if (f === undefined || f.geometry.type !== 'Point') {
        return
      }
      const p = f.properties ?? {}
      // Pointer ONLY for cities with a profile page — the "this dot is clickable" affordance.
      const hasProfile = PROFILE_SLUG_SET.has(String(p.citySlug ?? ''))
      map.getCanvas().style.cursor = hasProfile ? 'pointer' : ''
      popup
        .setLngLat(f.geometry.coordinates.slice() as [number, number])
        .setHTML(
          `<div style="font-family: system-ui; font-size: 12px; line-height: 1.35;">
             <strong>${String(p.cityName ?? '')}</strong><br/>
             <span style="color:#64748b;">${String(p.name ?? '')}</span><br/>
             <span style="color:#64748b;">${p.tier === 'reference' ? 'Reference-grade monitor' : 'Low-cost sensor'}</span>
           </div>`,
        )
        .addTo(map)
    }
    const onLeave = (): void => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    }
    // Click-through: route to the dot's city profile when one exists; otherwise no-op.
    const onClick = (e: mapboxgl.MapLayerMouseEvent): void => {
      const f = e.features?.[0]
      if (f === undefined) {
        return
      }
      const slug = String(f.properties?.citySlug ?? '')
      if (PROFILE_SLUG_SET.has(slug)) {
        // Side effect: client navigation to the member-profile route for this city. v2 routes
        // through the v2 profile so the concept stays self-contained.
        router.push(`/ux-concepts/aq-network-v2/${slug}`)
      }
    }
    map.on('mouseenter', 'sensors-reference', onEnter)
    map.on('mouseenter', 'sensors-lowcost', onEnter)
    map.on('mouseleave', 'sensors-reference', onLeave)
    map.on('mouseleave', 'sensors-lowcost', onLeave)
    map.on('click', 'sensors-reference', onClick)
    map.on('click', 'sensors-lowcost', onClick)
    // The hover/click handlers live for the map's lifetime; map.remove() in the init cleanup drops them.
  }, [mapReady, sensorGeoJSON, selectedYear, router])

  // ── Update the per-year layer filter whenever the scrubbed year changes. ───────
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || map === null || map.getLayer('sensors-reference') === undefined) {
      return
    }
    // Side effect: re-filter all three layers. Markers match their tier AND firstSeenYear; the
    // glow (beneath, all tiers) just matches firstSeenYear so it tracks the same sensor set.
    map.setFilter('sensors-lowcost', [
      'all', ['==', ['get', 'tier'], 'low-cost'], ['<=', ['get', 'firstSeenYear'], selectedYear],
    ])
    map.setFilter('sensors-reference', [
      'all', ['==', ['get', 'tier'], 'reference'], ['<=', ['get', 'firstSeenYear'], selectedYear],
    ])
    if (map.getLayer('sensors-glow') !== undefined) {
      map.setFilter('sensors-glow', ['<=', ['get', 'firstSeenYear'], selectedYear])
    }
  }, [mapReady, selectedYear])

  /** Fly back to the global globe framing (the "Reset to globe" button). */
  const resetToGlobe = useCallback((): void => {
    const map = mapRef.current
    if (map === null) {
      return
    }
    // Side effect: animate back to the whole-network view; clears interaction so spin can resume.
    map.flyTo({ ...GLOBE_VIEW, duration: 1600, essential: true })
    interactingRef.current = false
    if (resumeTimerRef.current !== null) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }, [])

  /** Stop any running playback. Safe to call when nothing is playing. */
  const stopPlay = useCallback((): void => {
    if (playTimerRef.current !== null) {
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }
    setPlaying(false)
  }, [])

  /**
   * Start playback from the beginning: jump to startYear, advance one year every PLAY_STEP_MS
   * until endYear, where it STOPS (plays once, no loop). Clears any existing interval first.
   */
  const startPlay = useCallback((): void => {
    if (playTimerRef.current !== null) {
      clearInterval(playTimerRef.current)
      playTimerRef.current = null
    }
    setPlaying(true)
    setSelectedYear(snapshot.startYear)

    // Side effect: interval that ticks the year forward (functional updater → no stale closure).
    playTimerRef.current = setInterval(() => {
      setSelectedYear((current) => {
        const next = current + 1
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

  /** Manual scrub: cancel playback if running (don't fight the user), then apply the year. */
  const handleManualScrub = useCallback(
    (year: number): void => {
      if (playTimerRef.current !== null) {
        stopPlay()
      }
      setSelectedYear(year)
    },
    [stopPlay],
  )

  // ── Unmount cleanup for the play interval. ─────────────────────────────────────
  useEffect(() => {
    return () => {
      stopPlay()
    }
  }, [stopPlay])

  // ── Token-missing guard. ───────────────────────────────────────────────────────
  if (MAPBOX_TOKEN === undefined || MAPBOX_TOKEN.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Globe unavailable — NEXT_PUBLIC_MAPBOX_TOKEN is not set.
      </div>
    )
  }

  const isPresentDay = selectedYear === snapshot.endYear

  return (
    <div className="space-y-6">
      {/* ── Three programme counters — reflect the scrubbed year. ──────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Counter
          icon={<Building2 className="h-5 w-5" />}
          value={yearData.cities.toLocaleString()}
          label="Cities joined"
          estimate={false}
        />
        <Counter
          icon={<Radar className="h-5 w-5" />}
          value={yearData.sensors.toLocaleString()}
          label="Sensors deployed"
          estimate={false}
        />
        <Counter
          icon={<Users className="h-5 w-5" />}
          value={`~${yearData.population.toLocaleString()}`}
          label="People within sensor range"
          estimate
        />
      </div>

      {/* ── The globe + reset control + legend + timeline scrubber. ───────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {/*
          PROVEN RENDER PATTERN: explicit-height `relative` wrapper with the map div as a FLOW
          CHILD `w-full h-full` (NOT absolute inset-0 — that pattern blanked on this hub).
        */}
        <div className="relative h-[520px] w-full">
          {/* Loading veil until the globe canvas paints. */}
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#080c16]">
              <span className="text-sm text-white/60">Loading the network…</span>
            </div>
          )}

          {/* Map container — the proven flow-child sizing. */}
          <div ref={containerRef} className="h-full w-full" data-slot="network-globe" />

          {/* Reset-to-globe control (top-right, over the canvas). */}
          <button
            type="button"
            onClick={resetToGlobe}
            className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/70"
            aria-label="Reset the view to the whole globe"
          >
            <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
            Reset to globe
          </button>

          {/* Legend (bottom-left, over the canvas) — sensor tier, not air quality. */}
          <div className="absolute bottom-3 left-3 z-20 rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-white backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Sensor type
            </p>
            <ul className="mt-1.5 space-y-1.5">
              <li className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full border border-white"
                  style={{ backgroundColor: COLOR_REFERENCE }}
                />
                Reference-grade monitor
              </li>
              <li className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full border border-white"
                  style={{ backgroundColor: COLOR_LOWCOST }}
                />
                Low-cost sensor
              </li>
            </ul>
          </div>
        </div>

        {/* Timeline scrubber — drives sensor existence over time across the whole network. */}
        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-3 sm:px-6">
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-xs font-semibold text-white">
              Network growth {snapshot.startYear}&ndash;{snapshot.endYear}
            </span>
            <span className="text-[11px] text-white/60">
              {isPresentDay ? 'Drag to replay growth' : 'Scrubbing back in time'}
            </span>
          </div>

          {/* Play control — runs the timeline once start→end so the network grows on its own. */}
          <button
            type="button"
            onClick={startPlay}
            disabled={playing}
            aria-label={
              playing
                ? 'Playing the network growth timeline'
                : 'Play the network growth timeline from the start'
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-60"
            style={{ backgroundColor: 'var(--bc-semantic-brand)' }}
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
            className="rounded-full px-3 py-1 text-sm font-bold tabular-nums text-white"
            style={{ backgroundColor: 'var(--bc-semantic-brand)' }}
          >
            {selectedYear}
          </span>
        </div>
      </div>

      {/* Honest framing line. */}
      <p className="text-xs text-muted-foreground">
        <Globe2 className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />
        Sensor positions and type are real OpenAQ data across all Breathe Cities member cities,
        captured once (not fetched live). Cities joined and sensors deployed are the true
        cumulative deployment; people within sensor range is a city-scale estimate.
        {yearData.isEstimate && (
          <>
            {' '}For {selectedYear}, the network this far back is a sparse early-growth view.
          </>
        )}
      </p>
    </div>
  )
}
