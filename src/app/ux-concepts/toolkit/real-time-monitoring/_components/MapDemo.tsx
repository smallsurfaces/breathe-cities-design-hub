/**
 * MapDemo.tsx — the contained live-demo block for the real-time monitoring component page.
 *
 * Purpose:
 *   The interactive map demo, extracted from the old full-viewport page so it can be EMBEDDED as a
 *   bordered block inside the restructured component page (intro → this demo → adoption steps).
 *   It owns exactly what the increment-1 page owned — the active city + parameter selection, the
 *   data hook, the fresh-only sensor set for the probe, the default/probe modes, and the five
 *   interaction patterns (city selector, parameter selector, probe, network states, provenance) —
 *   but it is sized to a BOUNDED height (not the viewport) and it requests SNAPSHOT data by default
 *   (the committed data strategy), surfacing an honest "Snapshot · data as of <date>" label so the
 *   frozen timestamps never read as live-fresh.
 *
 *   Layout: the overlays are positioned ABSOLUTE within this component's relative container, so they
 *   anchor to the map block (not the viewport) and stay inside the bordered surface.
 *
 * Key exports: MapDemo (default)
 * External dependencies: react, @/lib/openaq/cities (registry), @/lib/openaq/adapter
 *   (toLegacySensors), @/lib/openaq/{useStations,aqiParameters} (read-only), and the
 *   co-located _components.
 */

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CITIES, getCity } from '@/lib/openaq/cities'
import { toLegacySensors } from '@/lib/openaq/adapter'
import { useStations } from '@/lib/openaq/useStations'
import { PARAMETER_META, type ParameterKey } from '@/lib/openaq/aqiParameters'
import { MapComponent } from './MapComponent'
import type { MapHandle, MapMode } from './MapComponent'
import { CitySelector } from './CitySelector'
import { ParameterSelector } from './ParameterSelector'
import { HeaderReadout } from './HeaderReadout'
import { Legend } from './Legend'
import { ProbeToggle } from './ProbeToggle'
import { NetworkStateOverlay } from './NetworkStateOverlay'
import { MapAttribution } from './MapAttribution'
import { SnapshotLabel } from './SnapshotLabel'

/**
 * Curated example cities for the selector (ordered) — a single-row set led by good-coverage picks.
 * All four have a committed snapshot (see src/data/snapshots/rt-monitoring). Coverage at capture:
 * Accra ~16/21 and Bangkok ~23/30 are strong; Paris ~6/14 decent; London ~3/27 is the sparse case
 * (so the "N of M live" honesty + empty-stale handling stay visible against frozen data).
 */
const EXAMPLE_CITY_SLUGS = ['accra', 'bangkok', 'paris', 'london'] as const
/** Default city slug on first load — Accra (a good-coverage pick). */
const DEFAULT_CITY_SLUG = 'accra'
/** Default parameter on first load — PM2.5. */
const DEFAULT_PARAMETER: ParameterKey = 'pm25'

export default function MapDemo(): React.ReactElement {
  const mapHandleRef = useRef<MapHandle>(null)

  // ── Selection state ──────────────────────────────────────────────────────────
  const [citySlug, setCitySlug] = useState<string>(DEFAULT_CITY_SLUG)
  const [parameter, setParameter] = useState<ParameterKey>(DEFAULT_PARAMETER)

  // ── Mode state (default / probe) ───────────────────────────────────────────────
  const [mapMode, setMapMode] = useState<MapMode>('default')

  // ── Data ───────────────────────────────────────────────────────────────────────
  // SNAPSHOT by default (committed data strategy). The user-facing go-live toggle is deferred; the
  // live path stays reachable via the route's ?source=live (the capture mechanism + future toggle).
  const { status, stations, freshCount, totalCount, servedSource, capturedAt, retry } = useStations(
    citySlug,
    parameter,
    'snapshot',
  )

  // Fresh-only legacy sensor set for triangulation (probe excludes stale). The SAME set whose size
  // is freshCount.
  const freshSensors = useMemo(
    () => toLegacySensors(stations, parameter, true),
    [stations, parameter],
  )

  // Active city framing from the registry (never hardcoded). Falls back to the first registered city.
  const city = getCity(citySlug) ?? CITIES[0]

  // ── Mode transitions ───────────────────────────────────────────────────────────
  const exitProbeMode = useCallback((): void => {
    setMapMode('default')
  }, [])

  /** Toggle probe mode. Guarded so it can never turn on when there are zero fresh sensors. */
  const handleProbeToggle = useCallback((): void => {
    setMapMode((current) => {
      if (current === 'probe') {
        mapHandleRef.current?.clearPopup()
        return 'default'
      }
      if (freshCount === 0) {
        return current
      }
      return 'probe'
    })
  }, [freshCount])

  // If the active selection drops to zero fresh sensors while probe mode is on, leave probe mode so
  // the map is not stuck in a mode whose toggle is now disabled.
  useEffect(() => {
    if (mapMode === 'probe' && freshCount === 0) {
      mapHandleRef.current?.clearPopup()
      setMapMode('default')
    }
  }, [mapMode, freshCount])

  // ── Selection handlers ─────────────────────────────────────────────────────────
  const handleSelectCity = useCallback((slug: string): void => {
    mapHandleRef.current?.clearPopup()
    setCitySlug(slug)
  }, [])

  const handleSelectParameter = useCallback((next: ParameterKey): void => {
    // Defensive: never accept an unavailable parameter (the selector already gates NO2).
    if (!PARAMETER_META[next].available) {
      return
    }
    mapHandleRef.current?.clearPopup()
    setParameter(next)
  }, [])

  // Probe is available only when there is at least one fresh sensor.
  const probeAvailable = freshCount > 0

  return (
    <>
      {/*
       * Scoped styles: popup chrome reset so the StationPopup / ProbeResultPopup panels render with
       * their own rounded surfaces (Mapbox's default popup container is stripped).
       */}
      <style>{`
        .rtmon-popup .mapboxgl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .rtmon-popup .mapboxgl-popup-tip { display: none !important; }
      `}</style>

      {/*
       * Map region — a BOUNDED block (not the viewport). Sized with clamp so it stays a contained
       * demo on large screens and never collapses on small ones. The overlays anchor to this
       * relative container.
       */}
      <div
        style={{
          position: 'relative',
          height: 'clamp(440px, 68vh, 680px)',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <MapComponent
          ref={mapHandleRef}
          mapMode={mapMode}
          stations={stations}
          freshSensors={freshSensors}
          parameter={parameter}
          freshCount={freshCount}
          cityCenter={city.center}
          cityZoom={city.zoom}
          cityBbox={city.bbox}
          onExitProbe={exitProbeMode}
        />

        {/* Pattern 1 readout (top-left) — N of M live / 0 of M / no sensors / loading. */}
        <HeaderReadout
          cityName={city.name}
          parameter={parameter}
          status={status}
          freshCount={freshCount}
          totalCount={totalCount}
        />

        {/* Pattern 1 city selector (top-centre) — curated example cities (single row). */}
        <CitySelector
          activeSlug={citySlug}
          onSelect={handleSelectCity}
          slugs={EXAMPLE_CITY_SLUGS}
        />

        {/* Pattern 2 parameter selector (below city selector); NO2 disabled. */}
        <ParameterSelector active={parameter} onSelect={handleSelectParameter} />

        {/* Pattern 3 probe toggle ("Check air quality"); disabled/explained at 0 fresh. */}
        <ProbeToggle
          isActive={mapMode === 'probe'}
          isAvailable={probeAvailable}
          onToggle={handleProbeToggle}
        />

        {/* Pattern 2 legend (bottom-left) — parameter-aware. */}
        <Legend parameter={parameter} mapMode={mapMode} />

        {/* Honest data-source label (top-right) — "Snapshot · data as of <date>" when frozen. */}
        <SnapshotLabel servedSource={servedSource} capturedAt={capturedAt} />

        {/* Pattern 4 network-state overlay (bottom-centre) — empty / empty-stale / error+retry. */}
        <NetworkStateOverlay
          status={status}
          cityName={city.name}
          parameter={parameter}
          onRetry={retry}
        />

        {/* Pattern 5b persistent map-level credit (bottom-right) — visible in ALL states. */}
        <MapAttribution />
      </div>
    </>
  )
}
