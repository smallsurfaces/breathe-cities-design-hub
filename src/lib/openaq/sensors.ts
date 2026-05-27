/**
 * sensors.ts — Mock PM2.5 sensor data for Vienna
 *
 * Provides 14 mock sensors scattered across Vienna with realistic
 * coordinates and PM2.5 values. Used by the triangulation logic to
 * find the 3 nearest sensors to a clicked map point.
 *
 * PM2.5 values are varied to exercise the full AQI colour range
 * across the city — from clean outer districts to heavier traffic
 * corridors in the centre and near the ring road.
 */

/** The two sensor quality types. Reference grade uses triangular markers;
 *  low-cost sensor uses circular markers. */
export type SensorQuality = 'high' | 'low'

/** A single mock air quality sensor placed on the Vienna map. */
export type Sensor = {
  id: string
  /** Human-readable location label shown in the triangulation popup */
  name: string
  /** Mapbox [longitude, latitude] coordinate pair */
  coordinates: [number, number]
  quality: SensorQuality
  /** PM2.5 concentration in µg/m³ */
  pm25: number
}

export const SENSORS: Sensor[] = [
  // Inner city — 1st district, near Stephansplatz. High-traffic, moderate pollution.
  {
    id: 's01',
    name: 'Stephansplatz',
    coordinates: [16.3731, 48.2087],
    quality: 'high',
    pm25: 18.4,
  },
  // Prater green zone — typically lower PM2.5 due to park environment.
  {
    id: 's02',
    name: 'Prater',
    coordinates: [16.4150, 48.2165],
    quality: 'high',
    pm25: 7.2,
  },
  // Westbahnhof — busy transit hub, elevated levels.
  {
    id: 's03',
    name: 'Westbahnhof',
    coordinates: [16.3385, 48.1970],
    quality: 'low',
    pm25: 28.9,
  },
  // Brigittenau — residential north, moderate.
  {
    id: 's04',
    name: 'Brigittenau',
    coordinates: [16.3667, 48.2350],
    quality: 'low',
    pm25: 14.1,
  },
  // Favoriten — dense residential south, busier roads.
  {
    id: 's05',
    name: 'Favoriten',
    coordinates: [16.3750, 48.1720],
    quality: 'high',
    pm25: 38.6,
  },
  // Ottakring — western residential, moderate.
  {
    id: 's06',
    name: 'Ottakring',
    coordinates: [16.3100, 48.2150],
    quality: 'low',
    pm25: 21.3,
  },
  // Donaustadt — eastern outer district, lighter traffic.
  {
    id: 's07',
    name: 'Donaustadt',
    coordinates: [16.4680, 48.2280],
    quality: 'high',
    pm25: 9.8,
  },
  // Simmeringer Haide — industrial zone near waste treatment, higher pollution.
  {
    id: 's08',
    name: 'Simmering',
    coordinates: [16.4300, 48.1760],
    quality: 'low',
    pm25: 62.5,
  },
  // Kahlenberg — elevated green hillside, cleanest air in the dataset.
  {
    id: 's09',
    name: 'Kahlenberg',
    coordinates: [16.3350, 48.2700],
    quality: 'high',
    pm25: 4.3,
  },
  // Meidling — near Gürtel ring road, consistently elevated.
  {
    id: 's10',
    name: 'Meidling',
    coordinates: [16.3320, 48.1790],
    quality: 'low',
    pm25: 44.7,
  },
  // Floridsdorf — northern outer district, mixed residential/industrial.
  {
    id: 's11',
    name: 'Floridsdorf',
    coordinates: [16.4000, 48.2560],
    quality: 'high',
    pm25: 16.8,
  },
  // Landstrasse — 3rd district, near ring road and busy arterials.
  {
    id: 's12',
    name: 'Landstrasse',
    coordinates: [16.3950, 48.2020],
    quality: 'low',
    pm25: 32.1,
  },
  // Hernals — inner western district, mixed traffic.
  {
    id: 's13',
    name: 'Hernals',
    coordinates: [16.2960, 48.2280],
    quality: 'high',
    pm25: 19.5,
  },
  // Süd Autobahn junction — near motorway interchange, worst in dataset.
  {
    id: 's14',
    name: 'Süd Autobahn',
    coordinates: [16.3560, 48.1490],
    quality: 'low',
    pm25: 78.3,
  },
]
