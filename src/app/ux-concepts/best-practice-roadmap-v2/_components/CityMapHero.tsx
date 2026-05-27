/**
 * CityMapHero.tsx — Mapbox map with ownership-colored sensors, legend, and click popups
 *
 * Purpose:
 *   Renders a Mapbox map showing OpenAQ sensor locations for a given city, colored
 *   by sensor owner. Used as the hero visual on each city detail page in the Best
 *   Practice Roadmap concept. Features:
 *     - Ownership-colored circle markers (deterministic palette, top 6 + "Other")
 *     - Click-to-popup with station details (name, owner, type, parameters, dates)
 *     - Legend below the map showing ownership spread with counts
 *     - Grey mask outside the city bbox
 *
 * Key exports: CityMapHero (named)
 * External dependencies: mapbox-gl, @/lib/openaq/cities (getCity), /api/locations route
 *
 * Data flow:
 *   1. On mount, fetches /api/locations?city={slug} (single bbox call, no per-station /latest)
 *   2. Initializes Mapbox with light-v11 style, city center/zoom from registry
 *   3. Adds a grey mask layer (world polygon with city bbox hole)
 *   4. Computes owner->color mapping from the location data
 *   5. Plots locations as a GeoJSON circle layer with data-driven ownerColor
 *   6. Attaches click handler for popups and cursor changes
 *   7. Renders a legend section below the map
 *
 * CSS: This project uses HEX CSS variables (e.g. --foreground: #003574).
 *   Never use hsl(var(--foreground)). For opacity, use color-mix() or
 *   Tailwind's text-foreground/50 pattern.
 */

'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { getCity } from '@/lib/openaq/cities'
import type { LocationMeta } from '@/lib/openaq/types'

import 'mapbox-gl/dist/mapbox-gl.css'

/** Mapbox token from the Next.js public env var (NEXT_PUBLIC_ prefix -> available client-side). */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/**
 * Deterministic palette for owner coloring. Dark enough to read on a light-v11 basemap.
 * Owners are sorted by station count descending; the top 6 get a unique color.
 */
const OWNER_PALETTE = [
  '#003574', // BC blue (primary)
  '#0071c7', // lighter blue
  '#7c3aed', // purple
  '#0d9488', // teal
  '#d97706', // amber
  '#dc2626', // red
  '#059669', // green
  '#6366f1', // indigo
]

/** Grey color for the "Other" bucket when more than 6 unique owners exist. */
const OTHER_COLOR = '#9ca3af'

/** Maximum number of distinct owners before grouping the rest as "Other". */
const MAX_DISTINCT_OWNERS = 6

/** Props for CityMapHero. */
type CityMapHeroProps = {
  /** City slug matching both the roadmap data and the OpenAQ city registry. */
  citySlug: string
}

/** Computed owner entry for the legend and color mapping. */
type OwnerCount = {
  owner: string
  count: number
  color: string
}

/**
 * Expand a bbox by a percentage in each direction so users can pan slightly
 * but not leave the city area entirely. Returns a LngLatBoundsLike.
 */
function expandBbox(
  bbox: [number, number, number, number],
  expandFraction: number,
): [[number, number], [number, number]] {
  const lonSpan = bbox[2] - bbox[0]
  const latSpan = bbox[3] - bbox[1]
  const lonPad = lonSpan * expandFraction
  const latPad = latSpan * expandFraction
  return [
    [bbox[0] - lonPad, bbox[1] - latPad],
    [bbox[2] + lonPad, bbox[3] + latPad],
  ]
}

/**
 * Build a GeoJSON Polygon with an outer ring covering the world and an inner
 * ring (hole) cut out for the city bbox. The hole makes the city area
 * transparent while the rest of the world is masked.
 */
function buildMaskGeoJSON(bbox: [number, number, number, number]): GeoJSON.Feature<GeoJSON.Polygon> {
  const [minLon, minLat, maxLon, maxLat] = bbox
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        // Outer ring: world (clockwise)
        [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
        // Inner ring: city bbox hole (counterclockwise)
        [
          [minLon, minLat],
          [minLon, maxLat],
          [maxLon, maxLat],
          [maxLon, minLat],
          [minLon, minLat],
        ],
      ],
    },
  }
}

/**
 * Compute owner counts sorted by count descending, with color assignments.
 * If more than MAX_DISTINCT_OWNERS unique owners, the tail is grouped as "Other".
 */
function computeOwnerCounts(locations: LocationMeta[]): OwnerCount[] {
  // Count stations per displayLabel (the better of owner vs provider)
  const counts = new Map<string, number>()
  for (const loc of locations) {
    counts.set(loc.displayLabel, (counts.get(loc.displayLabel) ?? 0) + 1)
  }

  // Sort by count descending
  const sorted = Array.from(counts.entries())
    .map(([owner, count]) => ({ owner, count }))
    .sort((a, b) => b.count - a.count)

  // Assign colors: top MAX_DISTINCT_OWNERS get palette colors, rest grouped as "Other"
  const result: OwnerCount[] = []
  let otherCount = 0

  for (let i = 0; i < sorted.length; i++) {
    if (i < MAX_DISTINCT_OWNERS) {
      result.push({
        owner: sorted[i].owner,
        count: sorted[i].count,
        color: OWNER_PALETTE[i % OWNER_PALETTE.length],
      })
    } else {
      otherCount += sorted[i].count
    }
  }

  if (otherCount > 0) {
    result.push({ owner: 'Other', count: otherCount, color: OTHER_COLOR })
  }

  return result
}

/**
 * Build a Map<string, string> from owner name to hex color. Owners beyond the
 * top MAX_DISTINCT_OWNERS all map to OTHER_COLOR.
 */
function buildOwnerColorMap(ownerCounts: OwnerCount[]): Map<string, string> {
  const colorMap = new Map<string, string>()
  for (const entry of ownerCounts) {
    if (entry.owner === 'Other') {
      // "Other" is a synthetic bucket — individual owner names map to OTHER_COLOR below
      continue
    }
    colorMap.set(entry.owner, entry.color)
  }
  return colorMap
}

/**
 * Convert LocationMeta[] to a GeoJSON FeatureCollection with full properties for
 * the circle layer (ownerColor for data-driven paint) and the click popup.
 */
function locationsToGeoJSON(
  locations: LocationMeta[],
  ownerColorMap: Map<string, string>,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      properties: {
        id: loc.id,
        name: loc.name,
        locality: loc.locality ?? '',
        owner: loc.owner,
        provider: loc.provider,
        displayLabel: loc.displayLabel,
        isMonitor: loc.isMonitor,
        instruments: loc.instruments.join(', '),
        parameters: loc.parameters.join(', '),
        datetimeFirst: loc.datetimeFirst ?? '',
        datetimeLast: loc.datetimeLast ?? '',
        ownerColor: ownerColorMap.get(loc.displayLabel) ?? OTHER_COLOR,
      },
      geometry: {
        type: 'Point',
        coordinates: loc.coordinates,
      },
    })),
  }
}

/**
 * Build the HTML string for a station popup. Uses inline styles (not React)
 * for simplicity in Mapbox popups.
 */
function buildPopupHTML(properties: Record<string, unknown>): string {
  const name = String(properties.name ?? '')
  const locality = String(properties.locality ?? '')
  const owner = String(properties.owner ?? '')
  const provider = String(properties.provider ?? '')
  const isMonitor = Boolean(properties.isMonitor)
  const parameters = String(properties.parameters ?? '')
  const instruments = String(properties.instruments ?? '')
  const datetimeFirst = String(properties.datetimeFirst ?? '')
  const datetimeLast = String(properties.datetimeLast ?? '')
  const id = Number(properties.id ?? 0)

  const formatDate = (iso: string): string => {
    if (iso === '') return 'Unknown'
    const d = new Date(iso)
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : 'Unknown'
  }

  const instrumentRow = instruments.length > 0
    ? `<span style="color: #64748b;">Instrument</span><span>${instruments}</span>`
    : ''

  return `<div style="font-family: system-ui; font-size: 13px; max-width: 260px; line-height: 1.4;">
  <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${name}</div>
  <div style="color: #64748b; margin-bottom: 8px;">${locality}</div>
  <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px;">
    <span style="color: #64748b;">Owner</span>
    <span>${owner}</span>
    <span style="color: #64748b;">Provider</span>
    <span>${provider}</span>
    <span style="color: #64748b;">Type</span>
    <span>${isMonitor ? 'Reference-grade monitor' : 'Low-cost sensor'}</span>
    <span style="color: #64748b;">Measures</span>
    <span>${parameters}</span>
    ${instrumentRow}
    <span style="color: #64748b;">Active since</span>
    <span>${formatDate(datetimeFirst)}</span>
    <span style="color: #64748b;">Last data</span>
    <span>${formatDate(datetimeLast)}</span>
  </div>
  <a href="https://explore.openaq.org/locations/${id}"
     target="_blank" rel="noopener noreferrer"
     style="display: inline-block; margin-top: 8px; font-size: 11px; color: #0071c7; text-decoration: none;">
    View on OpenAQ &#x2197;
  </a>
</div>`
}

export function CityMapHero({ citySlug }: CityMapHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [locations, setLocations] = useState<LocationMeta[]>([])
  const [fetchError, setFetchError] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const city = getCity(citySlug)

  // Derive owner counts and color map from locations
  const ownerCounts = useMemo(() => computeOwnerCounts(locations), [locations])
  const ownerColorMap = useMemo(() => buildOwnerColorMap(ownerCounts), [ownerCounts])

  // Side effect: fetch locations from the API route
  useEffect(() => {
    let cancelled = false

    async function fetchLocations() {
      try {
        const res = await fetch(`/api/locations?city=${citySlug}`)
        if (!res.ok) {
          if (!cancelled) {
            setFetchError(true)
            setLocations([])
            setDataLoaded(true)
          }
          return
        }
        const data: LocationMeta[] = await res.json()
        if (!cancelled) {
          setLocations(data)
          setFetchError(false)
          setDataLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setFetchError(true)
          setLocations([])
          setDataLoaded(true)
        }
      }
    }

    fetchLocations()
    return () => { cancelled = true }
  }, [citySlug])

  // Side effect: initialize Mapbox map
  useEffect(() => {
    if (containerRef.current === null || city === undefined) {
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN ?? ''

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: city.center,
      zoom: city.zoom,
      maxBounds: expandBbox(city.bbox, 0.2),
      attributionControl: false,
      scrollZoom: false,
    })

    // Side effect: add compact attribution control (bottom-right)
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    // Side effect: add navigation control (bottom-right)
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    mapRef.current = map

    map.on('load', () => {
      setMapLoaded(true)

      // Side effect: add the grey mask layer outside the city bbox
      map.addSource('city-mask', {
        type: 'geojson',
        data: buildMaskGeoJSON(city.bbox),
      })
      map.addLayer({
        id: 'city-mask-fill',
        type: 'fill',
        source: 'city-mask',
        paint: {
          'fill-color': '#e5e7eb',
          'fill-opacity': 0.7,
        },
      })
    })

    return () => {
      // Cleanup: remove popup ref and map instance
      if (popupRef.current !== null) {
        popupRef.current.remove()
        popupRef.current = null
      }
      mapRef.current = null
      map.remove()
    }
    // city object identity is stable for a given slug within a page render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug])

  // Side effect: when both map and data are ready, add the circle layer + click handlers
  useEffect(() => {
    const map = mapRef.current
    if (!mapLoaded || !dataLoaded || map === null || locations.length === 0) {
      return
    }

    const geojson = locationsToGeoJSON(locations, ownerColorMap)
    const existingSource = map.getSource('stations') as mapboxgl.GeoJSONSource | undefined

    if (existingSource !== undefined) {
      existingSource.setData(geojson)
      return
    }

    // Side effect: add GeoJSON source
    map.addSource('stations', {
      type: 'geojson',
      data: geojson,
    })

    // Side effect: add circle layer with data-driven ownerColor paint
    map.addLayer({
      id: 'stations-circle',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-radius': 6,
        'circle-color': ['get', 'ownerColor'],
        'circle-opacity': 0.75,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
      },
    })

    // Side effect: click handler for popups on the circle layer
    map.on('click', 'stations-circle', (e) => {
      const feature = e.features?.[0]
      if (feature === undefined || feature.geometry.type !== 'Point') {
        return
      }

      const coords = feature.geometry.coordinates.slice() as [number, number]
      const props = feature.properties ?? {}

      // Close any existing popup before opening a new one
      if (popupRef.current !== null) {
        popupRef.current.remove()
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px',
        offset: 12,
      })
        .setLngLat(coords)
        .setHTML(buildPopupHTML(props))
        .addTo(map)

      popupRef.current = popup
    })

    // Side effect: cursor change on hover over circle layer
    map.on('mouseenter', 'stations-circle', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'stations-circle', () => {
      map.getCanvas().style.cursor = ''
    })
  }, [mapLoaded, dataLoaded, locations, ownerColorMap])

  // If no city in the registry, render a fallback
  if (city === undefined) {
    return (
      <div className="h-[280px] sm:h-[360px] lg:h-[400px] w-full rounded-xl overflow-hidden relative bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Map not available for this city</p>
      </div>
    )
  }

  const locationCount = locations.length

  return (
    <div>
      {/* Map container wrapper */}
      <div className="h-[280px] sm:h-[360px] lg:h-[400px] w-full rounded-xl overflow-hidden relative">
        {/* Loading skeleton — visible until map tiles render */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse z-10" />
        )}

        {/* Map container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Station count badge */}
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm text-xs text-foreground px-2 py-1 rounded-full border z-20">
          {!dataLoaded
            ? 'Loading...'
            : fetchError
              ? 'No sensor data'
              : locationCount === 0
                ? 'No sensors found'
                : `${locationCount} sensor${locationCount === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* Legend — ownership spread */}
      {ownerCounts.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sensor Ownership
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {ownerCounts.map(({ owner, count, color }) => (
              <div key={owner} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-muted-foreground">{owner}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
