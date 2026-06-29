/**
 * ProofGlobe.tsx — the proof-directory globe for /ux-concepts/global-toolkit-network (v2).
 *
 * Purpose / what the user sees + does
 *   A 3D Mapbox GLOBE (light basemap) where every pin is a Breathe Cities member CITY (not a
 *   sensor). v2 model: pins are UNIFORM — one pin treatment, one legend entry ("BC members"), NO
 *   proven / newly-joined / member tier colours and NO league table. EVERY plotted city is
 *   clickable → opens the city panel listing the tools that city runs. Pointer cursor + hover
 *   tooltip appear on every pin, so the click invitation is honest and consistent.
 *
 *   Honesty rides the LINK STATE inside the panel, not a pin ranking: every city shows real,
 *   research-grounded tools (v3 — the illustrative-tools model is retired), and each tool's CTA is
 *   active only where a proven-live link exists, otherwise visibly disabled. See proof-cities.ts +
 *   CityPanel.tsx for the honesty model.
 *
 *   Drag to spin, scroll/pinch to zoom, slow idle auto-rotate near globe zoom, and a "Reset to
 *   globe" button. NO timeline scrubber (the membership/growth story was dropped in the reframe).
 *   Clicking a pin opens a panel — a right-side panel on desktop, a half-sheet on mobile — while
 *   the globe stays visible behind it. This component also feeds the panel its region-factual peer
 *   block PEERS (the same-region cities, excluding the open one, in natural order — peer-learning,
 *   not a ranking) and an `onSelectPeer` handler that swaps the open city when a peer chip is tapped.
 *
 * Default framing — COPIED from the membership concept's globe
 *   The default + reset framing (center, zoom, container height) is copied verbatim from
 *   aq-network-v2's NetworkGlobe so the proof globe loads at the SAME visual size as the original
 *   membership concept's globe (Jack reverted the earlier immersive bigger-globe steer). The 3×
 *   faster auto-rotate is NOT copied — that steer is retained (see AUTO_ROTATE_PERIOD_MS).
 *
 * Isolation (full-isolation rule — section brief §"New build, full isolation")
 *   This is a FRESH component owned by this concept. It does NOT import aq-network-v2's
 *   NetworkGlobe, programme snapshot, or city data. It replicates the proven globe TECH pattern
 *   (light basemap, GeoJSON circle layer, ResizeObserver resize, time-based rAF auto-rotate,
 *   flyTo reset) from that reference, but reads only this concept's own PROOF_CITIES data.
 *
 * RENDER PATTERN (proven — do not change to absolute inset-0)
 *   The map div is a FLOW CHILD `w-full h-full` inside an explicit-height `relative` wrapper, plus
 *   a load-time + ResizeObserver resize (the robust fix for the mid-page blank-canvas bug). City
 *   pins are a GL GeoJSON source + TWO circle layers: a pulse halo beneath, and the pin on top.
 *
 * PULSATING PINS (so BC members "look special")
 *   Beneath the pin layer sits a `cities-pulse` halo layer (a DISTINCT brighter blue glow, blurred
 *   edge) whose radius + opacity are animated by a sine on the rAF tick — every member city pulses
 *   like a beacon, the brighter blue glow breathing behind the darker pin. The colour + technique are
 *   copied from aq-network-v2's NetworkGlobe glow layer (NOT imported — that concept is locked and
 *   fully isolated). The TUNING is NOT value-parity with the reference: it is tuned up for this
 *   globe's default zoom 1.4, where the reference's copied values render to almost nothing behind the
 *   pin (see PULSE_* consts for the why). Goal here is an obviously throbbing beacon at globe view.
 *
 * Key exports: ProofGlobe (named)
 * External dependencies: react, mapbox-gl, lucide-react, ./CityPanel, ../_data/proof-cities.
 *
 * Side effects (all cleaned up on unmount):
 *   - Creates a Mapbox GL globe instance in the container ref; sets light fog on style load.
 *   - Adds a GeoJSON source + TWO circle layers (a pulse halo beneath, the uniform "BC members" pin
 *     on top).
 *   - Runs ONE rAF loop doing two things: time-based idle auto-rotate (pauses on interaction,
 *     resumes on idle) AND the pin pulse (sine-driven radius/opacity on the pulse layer's paint).
 *   - Attaches hover + click handlers on the pin layer (pointer + panel-open) — every pin clickable.
 *   - Reads process.env.NEXT_PUBLIC_MAPBOX_TOKEN (client-exposed token).
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import mapboxgl from 'mapbox-gl'
import { Globe2 } from 'lucide-react'
import { CityPanel } from './CityPanel'
import { PROOF_CITIES } from '../_data/proof-cities'
import type { ProofCity } from '../_data/proof-cities'

import 'mapbox-gl/dist/mapbox-gl.css'

/** Client-exposed Mapbox token (NEXT_PUBLIC_ prefix → available in the browser bundle). */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/** Light basemap (matches the page chrome); pins deepened for contrast on light. */
const GLOBE_STYLE = 'mapbox://styles/mapbox/light-v11'

/**
 * The default + reset framing. COPIED EXACTLY from aq-network-v2's NetworkGlobe `GLOBE_VIEW`
 * (Jack reverted the earlier "bigger globe" steer — the proof globe now loads at the SAME visual
 * size and framing as the original membership concept's globe).
 *
 * Reverts the prior immersive `center [18,10] / zoom 2.1` back to the membership globe's
 * `center [10, 25] / zoom 1.4 / pitch 0 / bearing 0`. NetworkGlobe uses no camera padding, so the
 * `padding` field + the `setPadding` call are dropped here too — a faithful 1:1 of the reference
 * framing. Applied to BOTH the default load and the "Reset to globe" reset state (resetToGlobe
 * flies to this same object).
 */
const GLOBE_VIEW = {
  center: [10, 25] as [number, number],
  zoom: 1.4,
  pitch: 0,
  bearing: 0,
}

/**
 * Zoom at/below which auto-rotate runs. Above it the user has zoomed into a region and spinning
 * would be disorienting, so rotation only resumes once back near globe view.
 */
const AUTO_ROTATE_MAX_ZOOM = 2.2

/**
 * Milliseconds for one full 360° rotation. TIME-BASED (not per-frame) so a full turn takes the
 * same wall-clock time on any refresh rate — each rAF tick advances by (deltaMs / PERIOD) * 360.
 *
 * Tuned ~3× faster than the prior 400_000 (Jack steer) so the spin reads lively — at ~133s/turn
 * it's still slow enough not to be disorienting near globe zoom. KEPT at this value when the framing
 * reverted to the membership globe's zoom 1.4 (the 3× faster spin steer is explicitly retained).
 */
const AUTO_ROTATE_PERIOD_MS = 133_000

/** Idle delay (ms) after the last user interaction before auto-rotate resumes. */
const AUTO_ROTATE_RESUME_MS = 3500

/**
 * Pulsating-pin tuning. A soft pulse circle sits BENEATH the BC-member pin layer and breathes via
 * a sine over PULSE_PERIOD_MS, oscillating its radius (PULSE_RADIUS_MIN→MAX) and opacity
 * (PULSE_OPACITY_MIN→MAX) so every member city pulses like a beacon. It animates on the SAME rAF
 * tick as the rotation (one loop, not two) via setPaintProperty — no per-frame feature rebuild.
 *
 * NOT value-parity with the reference. The technique is copied (not imported) from aq-network-v2's
 * NetworkGlobe glow layer per the full-isolation rule, but the TUNING is tuned UP for this concept's
 * default framing. WHY: the reference's copied values (radius 7→12, opacity 0.1→0.32, blur 1) render
 * to almost nothing HERE because the membership map is viewed zoomed-IN, whereas this globe loads at
 * zoom 1.4 where the pin is only ~6px. At that zoom a 7→12px halo at ≤0.32 opacity extends barely
 * 1–6px past the solid 0.95-opacity pin and is blurred away — effectively invisible behind the pin.
 *
 * So the pulse is given real REACH beyond the pin and more PRESENCE: radius 10→24 (halo clearly
 * breathes well past the ~6px pin), opacity 0.25→0.6 (actually paints against the light basemap),
 * blur 0.6 (softer than a disc but not so diffuse it disappears). Bright blue #3b82f6 + period 1800ms
 * kept. Goal is "obviously pulsing at the default globe view" — a visibly throbbing beacon, not
 * parity with a reference that renders to nothing at this zoom. Needs Jack's eyes to confirm.
 */
const PULSE_PERIOD_MS = 1800
const PULSE_RADIUS_MIN = 10
const PULSE_RADIUS_MAX = 24
const PULSE_OPACITY_MIN = 0.25
const PULSE_OPACITY_MAX = 0.6

/*
 * Pin colour. Mapbox paint properties cannot read CSS custom properties, so literal hex is the
 * documented exception here (the same exception the reference globe's tier colours use). The value
 * is the RESOLVED hex of a real BC palette token (from dist/css/tokens.css) — kept in sync with the
 * token, never an off-palette invention. v2 uses ONE uniform pin (no tier states):
 *   - BC member pin = --bc-color-dark-blue (#003574) — the brand ink "open me" pin.
 */
/** Uniform BC-member pin — brand dark-blue ink (= --bc-color-dark-blue). */
const COLOR_PIN = '#003574'
/**
 * Pulse-halo colour. A DISTINCT brighter blue glow (blue-500) that sits behind the darker pin so the
 * pulsating beacon reads as a separate breathing glow, not as the pin ink. COPIED EXACTLY from
 * aq-network-v2's NetworkGlobe glow layer (COLOR_GLOW = '#3b82f6') — the whole point of the reference
 * is a brighter blue glow behind the markers. Same literal-hex Mapbox-paint exception as COLOR_PIN.
 */
const COLOR_PULSE = '#3b82f6'
/** White contrast ring so pins stay legible over land + ocean. */
const PIN_RING = '#ffffff'

/**
 * Build the city GeoJSON for the circle layer. Each feature carries `slug` (so the click handler
 * resolves the city), `name` and `country` (for the hover tooltip). v2: no `state`/`clickable`
 * property — every city is a uniform, clickable BC member.
 */
function citiesToGeoJSON(cities: ProofCity[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: cities.map((c) => ({
      type: 'Feature',
      properties: {
        slug: c.slug,
        name: c.name,
        country: c.country,
      },
      geometry: { type: 'Point', coordinates: c.coordinates },
    })),
  }
}

/** Props for ProofGlobe. */
type ProofGlobeProps = {
  /** The proof-directory cities (the single data source for the globe + panel). */
  cities: ProofCity[]
}

/**
 * The proof-directory globe section. Holds the open-city state (drives the panel), the Mapbox
 * globe with ONE uniform pin layer, the idle auto-rotate + reset behaviour, and the hover/click
 * affordances (every pin clickable).
 */
export function ProofGlobe({ cities }: ProofGlobeProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState<boolean>(false)

  // ── Open city — the single source of truth for the panel. null = closed. ──
  const [openCity, setOpenCity] = useState<ProofCity | null>(null)

  // ── Auto-rotate machinery (refs so the rAF loop reads live values without re-subscribing). ──
  const rotateFrameRef = useRef<number | null>(null)
  const interactingRef = useRef<boolean>(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timestamp of the previous rAF frame — drives the time-based rotation delta. null until the
  // first frame so we never apply a bogus huge delta on frame one.
  const lastFrameTsRef = useRef<number | null>(null)

  /** Lookup from slug → city, so the GL click handler (which only has feature props) resolves fast. */
  const cityBySlug = useMemo(() => {
    const map = new Map<string, ProofCity>()
    for (const city of cities) {
      map.set(city.slug, city)
    }
    return map
  }, [cities])

  /** The full city GeoJSON (built once from data — no per-year filtering in this concept). */
  const cityGeoJSON = useMemo(() => citiesToGeoJSON(cities), [cities])

  // ── Map initialisation — runs once on mount. ──────────────────────────────────
  useEffect(() => {
    if (containerRef.current === null) {
      return
    }
    if (MAPBOX_TOKEN === undefined || MAPBOX_TOKEN.length === 0) {
      return // token guard handled in render
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Side effect: create the Mapbox GLOBE on the light basemap at the Atlantic framing.
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: GLOBE_STYLE,
      projection: { name: 'globe' },
      center: GLOBE_VIEW.center,
      zoom: GLOBE_VIEW.zoom,
      pitch: GLOBE_VIEW.pitch,
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

    // Side effect: ONE rAF loop driving BOTH the time-based idle spin AND the pin pulse.
    //   - Rotation only runs while idle + near globe zoom; when paused we reset the delta baseline
    //     so resume doesn't apply an accumulated jump.
    //   - The pin pulse runs EVERY frame (independent of the rotation pause) — it's the "BC members
    //     look special" beacon — by oscillating the pulse layer's paint props with a sine of the
    //     clock. Technique replicated from aq-network-v2's glow layer (not imported; full isolation).
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
            // jumpTo (not easeTo) inside rAF so we don't stack animations; tiny per-frame nudge.
            m.jumpTo({ center })
          }
        } else {
          // Paused (interacting or zoomed in): drop the baseline so the next active frame's delta
          // is the single-frame gap, not the whole paused span — prevents a sudden spin jump.
          lastFrameTsRef.current = ts
        }

        // ── Pin pulse (always, while the pulse layer exists) ──
        if (m.getLayer('cities-pulse') !== undefined) {
          // sine in [0,1] over the pulse period → breathe radius + opacity together.
          const phase = (Math.sin((ts / PULSE_PERIOD_MS) * Math.PI * 2) + 1) / 2
          const radius = PULSE_RADIUS_MIN + (PULSE_RADIUS_MAX - PULSE_RADIUS_MIN) * phase
          const opacity = PULSE_OPACITY_MIN + (PULSE_OPACITY_MAX - PULSE_OPACITY_MIN) * phase
          // Side effect: animate paint props on the existing layer (no per-frame feature rebuild).
          m.setPaintProperty('cities-pulse', 'circle-radius', radius)
          m.setPaintProperty('cities-pulse', 'circle-opacity', opacity)
        }
      }
      rotateFrameRef.current = requestAnimationFrame(tick)
    }
    rotateFrameRef.current = requestAnimationFrame(tick)

    // Side effect cleanup: stop the rAF (rotation + pin pulse), clear resume timer, reset the frame
    // baseline, disconnect the observer, remove the map. No leaked loops on unmount.
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
    }
    // Mount-only: the globe initialises once; city data is applied in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Add the city source + the single uniform pin layer once the map is ready. ──
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || map === null) {
      return
    }
    if (map.getSource('cities') !== undefined) {
      return // already added
    }

    // Side effect: GeoJSON source with every plotted city.
    map.addSource('cities', { type: 'geojson', data: cityGeoJSON })

    // Pulse layer (added FIRST → sits BENEATH the pin — confirmed: this addLayer precedes the
    // cities-pin addLayer below, and Mapbox draws in add-order). A soft, distinct blue glow per
    // member city; radius + opacity are animated EVERY rAF frame to pulse (the "BC members look
    // special" beacon) — the tick's setPaintProperty('cities-pulse', …) branch is gated only by the
    // layer existing, and runs on the same loop that drives the spin. Initial radius/opacity are
    // mid-range so it looks right before the first pulse frame lands. Tuned for reach + presence at
    // zoom 1.4 (see PULSE_* consts) so the halo clearly breathes past the ~6px pin, not behind it.
    map.addLayer({
      id: 'cities-pulse',
      type: 'circle',
      source: 'cities',
      paint: {
        'circle-color': COLOR_PULSE,
        'circle-radius': (PULSE_RADIUS_MIN + PULSE_RADIUS_MAX) / 2,
        'circle-opacity': (PULSE_OPACITY_MIN + PULSE_OPACITY_MAX) / 2,
        // 0.6 (not the reference's 1): softer than a hard disc but tight enough that the bigger,
        // brighter halo still PAINTS at zoom 1.4 — blur 1 diffused the copied small halo to nothing.
        'circle-blur': 0.6,
      },
    })

    // ONE uniform pin layer — brand ink, ringed. Every city reads the same (no tier states).
    // Radius COPIED from aq-network-v2's NetworkGlobe member/reference dot (the emphasised "BC
    // member" treatment there): zoom 1 → 5.4, zoom 5 → 12. Reverts the prior enlarged 8/14 back to
    // the original membership-concept pin size.
    map.addLayer({
      id: 'cities-pin',
      type: 'circle',
      source: 'cities',
      paint: {
        'circle-color': COLOR_PIN,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 5.4, 5, 12],
        'circle-opacity': 0.95,
        'circle-stroke-width': 1.2,
        'circle-stroke-color': PIN_RING,
      },
    })

    // Side effect: hover tooltip + pointer cursor on the pin layer. Every pin is clickable, so the
    // affordance is uniform — no dead-end clicks, no tier signalling.
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      className: 'aq-globe-popup',
    })
    const onEnter = (e: mapboxgl.MapLayerMouseEvent): void => {
      const f = e.features?.[0]
      if (f === undefined || f.geometry.type !== 'Point') {
        return
      }
      const p = f.properties ?? {}
      map.getCanvas().style.cursor = 'pointer'
      popup
        .setLngLat(f.geometry.coordinates.slice() as [number, number])
        .setHTML(
          `<div style="font-family: system-ui; font-size: 12px; line-height: 1.35;">
             <strong>${String(p.name ?? '')}</strong><br/>
             <span style="color:#64748b;">${String(p.country ?? '')}</span><br/>
             <span style="color:#64748b;">See the tools this city runs</span>
           </div>`,
        )
        .addTo(map)
    }
    const onLeave = (): void => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    }
    // Click-through: open the panel for the clicked city.
    const onClick = (e: mapboxgl.MapLayerMouseEvent): void => {
      const f = e.features?.[0]
      if (f === undefined) {
        return
      }
      const slug = String(f.properties?.slug ?? '')
      const city = cityBySlug.get(slug)
      if (city !== undefined) {
        // Side effect: open the city panel (React state) — the globe stays mounted behind it.
        setOpenCity(city)
      }
    }
    map.on('mouseenter', 'cities-pin', onEnter)
    map.on('mouseleave', 'cities-pin', onLeave)
    map.on('click', 'cities-pin', onClick)
    // The hover/click handlers live for the map's lifetime; map.remove() in the init cleanup drops them.
  }, [mapReady, cityGeoJSON, cityBySlug])

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

  /** Close the city panel (back-drop click, close button, or Escape). */
  const closePanel = useCallback((): void => {
    setOpenCity(null)
  }, [])

  // ── Token-missing guard. ───────────────────────────────────────────────────────
  if (MAPBOX_TOKEN === undefined || MAPBOX_TOKEN.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Globe unavailable — NEXT_PUBLIC_MAPBOX_TOKEN is not set.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* The globe + reset control + legend. */}
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        {/*
          PROVEN RENDER PATTERN: explicit-height `relative` wrapper with the map div as a FLOW
          CHILD `w-full h-full` (NOT absolute inset-0 — that pattern blanked on this hub).

          Height COPIED from aq-network-v2's NetworkGlobe (h-[520px]) — reverts the enlarged
          600/640px container so the proof globe loads at the same on-screen size as the membership
          concept's globe at the copied zoom 1.4 framing.
        */}
        <div className="relative h-[520px] w-full">
          {/* Loading veil until the globe canvas paints. */}
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">Loading the directory…</span>
            </div>
          )}

          {/* Map container — the proven flow-child sizing. */}
          <div ref={containerRef} className="h-full w-full" data-slot="proof-globe" />

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

          {/* Legend (bottom-left, over the canvas) — a SINGLE uniform entry (v2: no tier states). */}
          <div className="absolute bottom-3 left-3 z-20 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-white backdrop-blur">
            <div className="flex items-center gap-2 text-xs">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-full border border-white"
                style={{ backgroundColor: COLOR_PIN }}
              />
              Breathe Cities members. Tap any city.
            </div>
          </div>
        </div>
      </div>

      {/* Honest framing line. */}
      <p className="mt-3 text-xs text-muted-foreground">
        <Globe2 className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />
        Every pin is a Breathe Cities member city already putting these tools to work for its
        residents. Population figures shown in panels are estimates.
      </p>

      {/*
        City panel — slides in over the globe when a pin is opened.
        `peers` = the other plotted cities in the SAME region as the open city (excludes itself),
        in natural array order (peer-learning, not a ranking — no sort). `onSelectPeer` swaps the
        open city; CityPanel's city-change effect resets its row/sheet state so the peer opens clean.
      */}
      <CityPanel
        city={openCity}
        onClose={closePanel}
        peers={
          openCity
            ? cities.filter((c) => c.region === openCity.region && c.slug !== openCity.slug)
            : []
        }
        onSelectPeer={(c) => setOpenCity(c)}
      />
    </div>
  )
}

/** Re-export the bundled data so the page can import the globe + its data from one module. */
export { PROOF_CITIES }
