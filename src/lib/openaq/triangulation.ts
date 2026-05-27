/**
 * triangulation.ts — PM2.5 triangulation from nearest sensors
 *
 * Given a clicked map coordinate and the full sensor array, finds the
 * 3 nearest sensors using the Haversine formula for great-circle distance,
 * then returns their average PM2.5 value and the sensors used.
 *
 * Haversine is used rather than flat Euclidean distance because Vienna
 * spans ~20km — at this scale the earth's curvature is negligible but
 * Haversine is the correct approach and incurs no meaningful performance cost.
 */

import type { Sensor } from './sensors'

/** Result of a triangulation operation. */
export type TriangulationResult = {
  /** Average PM2.5 of the 3 nearest sensors, rounded to 1 decimal place */
  averagePM25: number
  /** The 3 sensors that contributed to the average, in distance order */
  nearestSensors: Sensor[]
  /** The clicked coordinate that triggered the triangulation */
  clickedPoint: [number, number]
}

/**
 * Calculates the Haversine great-circle distance between two [lng, lat] points.
 * Returns distance in kilometres.
 *
 * Why Haversine: flat Euclidean distance in degree-space is inaccurate because
 * a degree of longitude at 48°N is ~74km, while a degree of latitude is ~111km.
 * Haversine corrects for this without needing a full projection library.
 */
function haversineDistanceKm(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Finds the 3 nearest sensors to a clicked point and returns their
 * average PM2.5 value.
 *
 * Returns null when sensors is empty — callers must handle null to avoid
 * NaN flowing into getAQICategory() and producing a false alarm result.
 *
 * @param clickedPoint - [longitude, latitude] of the map click
 * @param sensors - Full sensor array to search
 * @returns TriangulationResult with the average, the 3 sensors, and the clicked point,
 *          or null if sensors array is empty
 */
export function triangulate(
  clickedPoint: [number, number],
  sensors: Sensor[],
): TriangulationResult | null {
  // Guard: cannot triangulate without at least one sensor. Returning null
  // prevents NaN from reaching getAQICategory() which would produce
  // a false "Very Unhealthy / Hazardous" result — a critical alarm failure.
  if (sensors.length < 1) return null

  // Sort all sensors by distance to the clicked point ascending
  const sorted = [...sensors].sort(
    (a, b) =>
      haversineDistanceKm(clickedPoint, a.coordinates) -
      haversineDistanceKm(clickedPoint, b.coordinates),
  )

  const nearestSensors = sorted.slice(0, 3)

  // Simple arithmetic mean — equal-weight average of the 3 nearest readings
  const sum = nearestSensors.reduce((acc, s) => acc + s.pm25, 0)
  const averagePM25 = Math.round((sum / nearestSensors.length) * 10) / 10

  return { averagePM25, nearestSensors, clickedPoint }
}
