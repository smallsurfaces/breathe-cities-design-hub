/**
 * MapComponent.tsx — Live-data Mapbox map (LIGHT basemap): real OpenAQ markers, city framing,
 * fresh-only "check air quality" probe.
 *
 * Provenance: part of the BC Global Toolkit Network concept (/ux-concepts/global-toolkit-network/real-time-monitoring).
 *   Concept-local copy of toolkit/real-time-monitoring/_components/MapComponent.tsx: copied, original (a locked concept) untouched.
 *
 * Purpose:
 *   The map for the real-time monitoring component. Component copy of
 *   direction-2-live-data/MapComponent.tsx carrying the LIGHT-BASEMAP treatment from
 *   feature/direction-2-light-basemap (style mapbox/light-v11; the probe pin's outer outline and
 *   the triangulation dash lines are dark-blue ink #003574 = --bc-color-dark-blue, since the
 *   dark-basemap white treatment vanished on the light ground). Marker re-tune lives in the
 *   co-located markers.ts (Option A).
 *
 *   What it does:
 *     - Renders markers from LIVE Station[] passed as props, parameter-aware (markers.ts). Markers
 *       RE-RENDER on station/parameter change; the previous city's markers are cleared first.
 *     - Frames the map on the active city on init and fits to the city's bbox on city change.
 *     - Station click opens the provenance StationPopup (with owner + start date).
 *     - "Check air quality" probe triangulates FRESH sensors only; triangulate() returns null for
 *       an empty set, rendered as no result — never a fabricated number.
 *
 * Key exports: MapComponent (default), MapHandle, MapMode
 * External dependencies: mapbox-gl, react-dom/client, ../../../../lib/openaq/types (Station,
 *   read-only), ../../../direction-1-mapbox-v2/triangulation (triangulate + type, READ-ONLY),
 *   ../../../direction-1-mapbox-v2/sensors (Sensor type, READ-ONLY),
 *   ../../../direction-2-live-data/aqiParameters (ParameterKey, READ-ONLY), ./markers,
 *   ./StationPopup, ./ProbeResultPopup
 *
 * Token discipline: all AQI colour comes through markers.ts / the popups (runtime tokens). The
 *   probe pin + dash lines use neutral chrome ink (#003574), not AQI semantics — matching the
 *   light marker re-tune (Option A).
 */

'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import mapboxgl from 'mapbox-gl'
import ReactDOM from 'react-dom/client'
import type { Station } from '@/lib/openaq/types'
import { triangulate } from '@/lib/openaq/triangulation'
import type { Sensor } from '@/lib/openaq/sensors'
import { createStationMarkerElement } from './markers'
import { type ParameterKey } from '@/lib/openaq/aqiParameters'
import { StationPopup } from './StationPopup'
import { ProbeResultPopup } from './ProbeResultPopup'

import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * Mapbox token from the Next.js public env var (NEXT_PUBLIC_ prefix -> available client-side).
 * Set in .env.local; never hardcoded.
 */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/** The three mutually exclusive interaction modes (same contract as the live-data route). */
export type MapMode = 'default' | 'probe' | 'annotate'

/** Imperative handle for the parent (AnnotationLayer adapter + programmatic popup clear). */
export type MapHandle = {
  getMap: () => mapboxgl.Map | null
  clearPopup: () => void
}

type Props = {
  /** Current interaction mode — controls what a map click does. */
  mapMode: MapMode
  /** All stations for the active city+parameter (includes stale — they render in stale treatment). */
  stations: Station[]
  /** Fresh-only legacy sensor set for triangulation (toLegacySensors(..., excludeStale: true)). */
  freshSensors: Sensor[]
  /** Active parameter — drives marker hue/units and probe result classification. */
  parameter: ParameterKey
  /** Fresh-sensor count for the active city+parameter — passed to the probe result for tiering. */
  freshCount: number
  /** Map framing for the active city (from the registry). */
  cityCenter: [number, number]
  cityZoom: number
  cityBbox: [number, number, number, number]
  /** Called by Escape / popup close to return the parent to default mode. */
  onExitProbe: () => void
}

/**
 * Probe pin SVG (location pin + signal waves). On the LIGHT basemap the outer outline is dark-blue
 * ink (#003574) — the dark-basemap white outline vanished on the light ground. Inner white
 * detailing (signal-wave strokes + centre disc) is kept: it reads against the blue pin body, not
 * the map. The pin is map chrome, not an AQI indicator, so it stays a fixed colour; the AQI tier
 * shows in the popup.
 */
function createProbePinElement(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '36px'
  el.style.height = '48px'
  el.style.cursor = 'default'
  el.style.filter = 'drop-shadow(0 3px 8px rgba(0,0,0,0.45))'
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 2 C9 2, 2 9, 2 18 C2 27, 18 46, 18 46 C18 46, 34 27, 34 18 C34 9, 27 2, 18 2 Z"
        fill="#0071c7" stroke="#003574" stroke-width="2"/>
      <circle cx="18" cy="17" r="7" fill="rgba(255,255,255,0.9)" />
      <path d="M22 13 Q28 17 22 21" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
      <path d="M24 11 Q33 17 24 23" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <path d="M26 9  Q36 17 26 25" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/>
    </svg>
  `
  return el
}

/** Project a [lng,lat] to pixel [x,y] on the map canvas — for SVG dash-line endpoints. */
function lngLatToPixel(map: mapboxgl.Map, lngLat: [number, number]): { x: number; y: number } {
  const point = map.project(new mapboxgl.LngLat(lngLat[0], lngLat[1]))
  return { x: point.x, y: point.y }
}

/** Create or reuse the fixed SVG overlay inside the map container (for the dash lines). */
function getOrCreateSVGOverlay(container: HTMLElement): SVGSVGElement {
  let svg = container.querySelector<SVGSVGElement>('[data-probe-lines]')
  if (svg === null) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('data-probe-lines', 'true')
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.pointerEvents = 'none'
    svg.style.zIndex = '5'
    container.appendChild(svg)
  }
  return svg
}

/** Remove the dash-line SVG overlay if present. */
function removeSVGOverlay(container: HTMLElement): void {
  const svg = container.querySelector('[data-probe-lines]')
  if (svg !== null) {
    svg.remove()
  }
}

/** Remove the probe @keyframes <style> from document.head (avoids stale-keyframe accumulation). */
function removeProbeKeyframes(): void {
  const existing = document.getElementById('probe-keyframes-rt')
  if (existing !== null) {
    existing.remove()
  }
}

/**
 * Draw (or redraw) the animated dash lines from contributing sensor positions to the probe pin.
 * Behaviour ported unchanged; the keyframe element id is namespaced (-rt) so it cannot collide with
 * other routes' keyframes if both are ever mounted. Side effect: injects a
 * <style id="probe-keyframes-rt"> into document.head.
 */
function drawDashLines(
  map: mapboxgl.Map,
  container: HTMLElement,
  sensors: Sensor[],
  probeLngLat: [number, number],
  lineColor: string,
  isRedraw: boolean,
): void {
  const svg = getOrCreateSVGOverlay(container)
  while (svg.firstChild !== null) {
    svg.removeChild(svg.firstChild)
  }

  const probePixel = lngLatToPixel(map, probeLngLat)

  sensors.slice(0, 3).forEach((sensor, index) => {
    const sensorPixel = lngLatToPixel(map, sensor.coordinates)
    const dx = probePixel.x - sensorPixel.x
    const dy = probePixel.y - sensorPixel.y
    const lineLength = Math.sqrt(dx * dx + dy * dy)

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', String(sensorPixel.x))
    line.setAttribute('y1', String(sensorPixel.y))
    line.setAttribute('x2', String(probePixel.x))
    line.setAttribute('y2', String(probePixel.y))
    line.setAttribute('stroke', lineColor)
    line.setAttribute('stroke-width', '1.5')
    line.setAttribute('stroke-opacity', '0.7')

    if (!isRedraw) {
      const drawDuration = 0.7
      const staggerDelay = index * 0.15
      line.style.strokeDasharray = `${lineLength}`
      line.style.strokeDashoffset = `${lineLength}`
      line.style.animation = `
        draw-in-rt-${index} ${drawDuration}s ease-out ${staggerDelay}s forwards,
        dash-travel-rt-${index} 1.8s linear ${staggerDelay + drawDuration}s infinite
      `
    } else {
      line.style.strokeDasharray = '8 8'
      line.style.strokeDashoffset = '0'
      line.style.animation = `dash-travel-redraw-rt 1.8s linear ${index * 0.1}s infinite`
    }

    svg.appendChild(line)
  })

  if (!isRedraw) {
    removeProbeKeyframes()
    const headStyle = document.createElement('style')
    headStyle.id = 'probe-keyframes-rt'
    headStyle.textContent = sensors
      .slice(0, 3)
      .map((sensor, index) => {
        const sensorPixel = lngLatToPixel(map, sensor.coordinates)
        const pinPixel = lngLatToPixel(map, probeLngLat)
        const dx = pinPixel.x - sensorPixel.x
        const dy = pinPixel.y - sensorPixel.y
        const lineLength = Math.sqrt(dx * dx + dy * dy)
        return `
          @keyframes draw-in-rt-${index} {
            from { stroke-dasharray: ${lineLength}; stroke-dashoffset: ${lineLength}; }
            to   { stroke-dasharray: ${lineLength}; stroke-dashoffset: 0; }
          }
          @keyframes dash-travel-rt-${index} {
            from { stroke-dasharray: 8 8; stroke-dashoffset: 16; }
            to   { stroke-dasharray: 8 8; stroke-dashoffset: 0; }
          }
        `
      })
      .join('')
    // Side effect: inject keyframes into document.head.
    document.head.appendChild(headStyle)
  } else {
    const existing = document.getElementById('probe-keyframes-rt')
    if (existing === null) {
      const headStyle = document.createElement('style')
      headStyle.id = 'probe-keyframes-rt'
      headStyle.textContent = `
        @keyframes dash-travel-redraw-rt {
          from { stroke-dashoffset: 16; }
          to   { stroke-dashoffset: 0; }
        }
      `
      document.head.appendChild(headStyle)
    }
  }
}

export const MapComponent = forwardRef<MapHandle, Props>(function MapComponent(
  {
    mapMode,
    stations,
    freshSensors,
    parameter,
    freshCount,
    cityCenter,
    cityZoom,
    cityBbox,
    onExitProbe,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapLoadedRef = useRef<boolean>(false)
  // Station markers currently on the map — cleared and rebuilt on data/parameter change.
  const markersRef = useRef<mapboxgl.Marker[]>([])
  // Single active popup (station or probe) + its React root, with the lifecycle guards.
  const activePopupRef = useRef<mapboxgl.Popup | null>(null)
  const popupRootRef = useRef<ReactDOM.Root | null>(null)
  const popupContainerRef = useRef<HTMLDivElement | null>(null)
  const probePinMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const probeStateRef = useRef<{
    lngLat: [number, number]
    sensors: Sensor[]
    lineColor: string
  } | null>(null)
  const rafPendingRef = useRef<boolean>(false)
  const rootUnmountedRef = useRef<boolean>(false)

  // A tick the map 'load' handler bumps so the marker-sync effect runs its first placement once
  // the map style is ready (markers cannot be placed before 'load').
  const [markersReady, setMarkersReady] = useState(0)

  // Refs mirroring props so the STABLE map click handler reads current values without being
  // recreated (the map + click handler are initialised once).
  const mapModeRef = useRef<MapMode>(mapMode)
  const onExitProbeRef = useRef<() => void>(onExitProbe)
  const stationsRef = useRef<Station[]>(stations)
  const freshSensorsRef = useRef<Sensor[]>(freshSensors)
  const parameterRef = useRef<ParameterKey>(parameter)
  const freshCountRef = useRef<number>(freshCount)

  useEffect(() => {
    mapModeRef.current = mapMode
  }, [mapMode])
  useEffect(() => {
    onExitProbeRef.current = onExitProbe
  }, [onExitProbe])
  useEffect(() => {
    stationsRef.current = stations
  }, [stations])
  useEffect(() => {
    freshSensorsRef.current = freshSensors
  }, [freshSensors])
  useEffect(() => {
    parameterRef.current = parameter
  }, [parameter])
  useEffect(() => {
    freshCountRef.current = freshCount
  }, [freshCount])

  // ── clearProbe ──────────────────────────────────────────────────────────────
  // Removes probe pin, dash lines, keyframes, and any open popup. Same double-unmount-guarded
  // React-root teardown. Does NOT change mode (callers do that separately).
  const clearProbe = useCallback((): void => {
    if (probePinMarkerRef.current !== null) {
      probePinMarkerRef.current.remove()
      probePinMarkerRef.current = null
    }
    if (containerRef.current !== null) {
      removeSVGOverlay(containerRef.current)
    }
    removeProbeKeyframes()
    probeStateRef.current = null

    if (activePopupRef.current !== null) {
      activePopupRef.current.remove()
      activePopupRef.current = null
    }
    if (popupRootRef.current !== null) {
      rootUnmountedRef.current = false
      // Defer unmount to avoid React "unmount during render" warning. The guard ensures the root
      // is unmounted at most once across this path and the popup 'close' handler.
      setTimeout(() => {
        if (!rootUnmountedRef.current) {
          rootUnmountedRef.current = true
          popupRootRef.current?.unmount()
          popupRootRef.current = null
        }
      }, 0)
    }
    popupContainerRef.current = null
  }, [])

  // ── openStationPopup ────────────────────────────────────────────────────────
  // Opens the provenance popup for a clicked station. Single-popup discipline.
  const openStationPopup = useCallback(
    (station: Station): void => {
      const map = mapRef.current
      if (map === null) {
        return
      }
      // Clear any existing probe/popup first (single active popup).
      clearProbe()

      const container = document.createElement('div')
      popupContainerRef.current = container
      const root = ReactDOM.createRoot(container)
      // Read the current parameter from the ref so the popup matches the active selection.
      root.render(
        <StationPopup
          station={station}
          parameter={parameterRef.current}
          onClose={() => {
            clearProbe()
          }}
        />,
      )

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        maxWidth: 'none',
        offset: 14,
        className: 'rtmon-popup',
      })
        .setLngLat(station.coordinates)
        .setDOMContent(container)
        .addTo(map)

      popup.on('close', () => {
        setTimeout(() => {
          if (!rootUnmountedRef.current) {
            rootUnmountedRef.current = true
            root.unmount()
          }
        }, 0)
      })

      activePopupRef.current = popup
      popupRootRef.current = root
      rootUnmountedRef.current = false
    },
    [clearProbe],
  )

  // ── showProbe ───────────────────────────────────────────────────────────────
  // Drops a probe pin at the clicked point and triangulates FRESH sensors only. Reads the
  // fresh-only sensor set + parameter + freshCount from refs. If triangulate() returns null (no
  // fresh sensors), nothing is shown — no fabricated number.
  const showProbe = useCallback(
    (lngLat: mapboxgl.LngLat): void => {
      const map = mapRef.current
      const container = containerRef.current
      if (map === null || container === null) {
        return
      }
      clearProbe()

      const clickedPoint: [number, number] = [lngLat.lng, lngLat.lat]
      const sensors = freshSensorsRef.current
      // triangulate() returns null for an empty (0-fresh) set — guard against NaN/false result.
      const result = triangulate(clickedPoint, sensors)
      if (result === null) {
        // No fresh sensors -> no value. The disabled toggle should have prevented entering probe
        // mode here; this is the belt-and-braces guard. Do nothing rather than show a number.
        return
      }

      // Dark-blue ink (#003574) reads on the light basemap (the dark route used white-on-dark).
      const lineColor = 'rgba(0, 53, 116, 0.75)'

      const pinEl = createProbePinElement()
      const probePinMarker = new mapboxgl.Marker({ element: pinEl, anchor: 'bottom' })
        .setLngLat(lngLat)
        .addTo(map)
      probePinMarkerRef.current = probePinMarker

      probeStateRef.current = {
        lngLat: clickedPoint,
        sensors: result.nearestSensors,
        lineColor,
      }
      drawDashLines(map, container, result.nearestSensors, clickedPoint, lineColor, false)

      const popupContainer = document.createElement('div')
      popupContainerRef.current = popupContainer

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: 'none',
        offset: [0, -44],
        className: 'rtmon-popup',
      })
        .setLngLat(lngLat)
        .setDOMContent(popupContainer)
        .addTo(map)

      const root = ReactDOM.createRoot(popupContainer)
      root.render(
        <ProbeResultPopup
          result={result}
          parameter={parameterRef.current}
          freshCount={freshCountRef.current}
          onClose={() => {
            clearProbe()
            onExitProbeRef.current()
          }}
        />,
      )

      activePopupRef.current = popup
      popupRootRef.current = root
      rootUnmountedRef.current = false

      popup.on('close', () => {
        setTimeout(() => {
          if (!rootUnmountedRef.current) {
            rootUnmountedRef.current = true
            root.unmount()
          }
        }, 0)
      })
    },
    [clearProbe],
  )

  // ── Map initialisation (once) ─────────────────────────────────────────────────
  // Creates the map framed on the active city, wires the click/move handlers. Marker placement is
  // handled by a SEPARATE effect so markers can re-render on data/parameter change without
  // re-creating the map.
  useEffect(() => {
    if (containerRef.current === null) {
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN ?? ''

    const map = new mapboxgl.Map({
      container: containerRef.current,
      // LIGHT basemap (the real-time monitoring component ships on light, not the dark hub style).
      style: 'mapbox://styles/mapbox/light-v11',
      // Initial framing comes from the active city's registry values (read once at init).
      center: cityCenter,
      zoom: cityZoom,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    mapRef.current = map

    map.on('load', () => {
      mapLoadedRef.current = true
      // Trigger the marker-sync effect's first run now that the style is ready.
      setMarkersReady((n) => n + 1)
      if (mapModeRef.current === 'probe') {
        map.getCanvas().style.cursor = 'crosshair'
      }
    })

    // Map click: only acts in probe mode (station-marker clicks stopPropagation). Reads mapModeRef
    // to avoid a stale closure.
    map.on('click', (e) => {
      if (mapModeRef.current === 'probe') {
        showProbe(e.lngLat)
      }
    })

    // Redraw dash lines on pan/zoom (throttled to one redraw per frame).
    map.on('move', () => {
      if (
        probeStateRef.current === null ||
        containerRef.current === null ||
        rafPendingRef.current
      ) {
        return
      }
      rafPendingRef.current = true
      requestAnimationFrame(() => {
        rafPendingRef.current = false
        if (probeStateRef.current === null || containerRef.current === null) {
          return
        }
        const { lngLat, sensors, lineColor } = probeStateRef.current
        drawDashLines(map, containerRef.current, sensors, lngLat, lineColor, true)
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      clearProbe()
      mapLoadedRef.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // map initialises once only; framing changes go through the fly/fit effect below

  // ── Marker sync ───────────────────────────────────────────────────────────────
  // Re-renders station markers whenever the station set or the active parameter changes, and on
  // first map load. Clears the previous markers first so no old-city markers persist. Each marker
  // gets a click handler opening the provenance popup; stopPropagation prevents the map click
  // (probe) firing.
  useEffect(() => {
    const map = mapRef.current
    if (map === null || !mapLoadedRef.current) {
      return
    }

    // Clear existing markers before placing the new set.
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    stations.forEach((station) => {
      const el = createStationMarkerElement(station, parameter)
      // Side effect: clicking a station marker opens its provenance popup and exits probe mode so
      // the page's mode state does not desync.
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onExitProbeRef.current()
        openStationPopup(station)
      })
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(station.coordinates)
        .addTo(map)
      markersRef.current.push(marker)
    })
    // markersReady is included so the first placement runs once the map 'load' fires.
  }, [stations, parameter, markersReady, openStationPopup])

  // ── City framing (fly/fit) ──────────────────────────────────────────────────
  // On city change, fit the map to the new city's bbox. Skipped until the map is loaded. Any open
  // probe is cleared so a stale pin does not hang over a different city.
  useEffect(() => {
    const map = mapRef.current
    if (map === null || !mapLoadedRef.current) {
      return
    }
    clearProbe()
    map.fitBounds(
      [
        [cityBbox[0], cityBbox[1]],
        [cityBbox[2], cityBbox[3]],
      ],
      { padding: 60, duration: 900, maxZoom: cityZoom + 1 },
    )
    // center/zoom are intentionally not deps: bbox uniquely identifies the city framing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityBbox, clearProbe])

  // ── Escape clears the probe ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        // In annotate mode, Escape belongs to AnnotationLayer; leaving the map frozen otherwise.
        if (mapModeRef.current === 'annotate') {
          return
        }
        clearProbe()
        onExitProbeRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [clearProbe])

  // ── Cursor per mode ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (map === null) {
      return
    }
    const canvas = map.getCanvas()
    canvas.style.cursor = mapMode === 'probe' ? 'crosshair' : ''
  }, [mapMode])

  // ── Imperative handle for the parent (AnnotationLayer adapter + popup clear) ─────
  useImperativeHandle(
    ref,
    () => ({
      getMap: () => mapRef.current,
      clearPopup: clearProbe,
    }),
    [clearProbe],
  )

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} data-slot="map-container" />
})
