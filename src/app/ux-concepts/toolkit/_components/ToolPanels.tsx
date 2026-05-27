/**
 * ToolPanels.tsx — Visual sketch components for each of the 8 toolkit capabilities (catalogue copy).
 *
 * Purpose
 *   The recognisable visual sketch of each capability (a map, gauge, chart, table, etc.) rendered
 *   with CSS shapes and BC tokens. Used as the PREVIEW inside each catalogue card on the toolkit
 *   landing. No SVG charting libraries — pure CSS/HTML shapes.
 *
 *   This is a COPY of jtbd-city-toolkit-v2/_components/ToolPanels.tsx (per the brief: reuse v2 by
 *   copying, do not edit it). The catalogue owns its own copy so it does not reach into another
 *   concept's internals. Behaviour and all functional colour are identical to the v2 panels; only
 *   this header differs. The shared aqi-palette (@/components/concept) is consumed read-only.
 *
 *   All functional colour stays intact: sensor scatter dots, gauge severity track and fill bar,
 *   source stacked bar, forecast blocks, advocacy trend bars and direction colour, alert pills,
 *   data table PM2.5 indicators, API snippet dark-blue/teal. None of this is decorative; it is the
 *   concept's core communication. Light mode only. No emoji.
 *
 * Key exports: MonitoringPanel, BenchmarkingPanel, SourceIdPanel,
 *   ForecastingPanel, HealthPanel, AdvocacyPanel, ActionPanel, OpenDataPanel
 * External dependencies: toolkit-data types, @/components/concept (aqi-palette imports)
 */

'use client'

import type {
  SensorDot,
  SourceSegment,
  ForecastDay,
  AlertCard,
  ActionCard,
  DataRow,
} from '@/data/toolkit-data'

// AQI helpers and AqiLevel type imported from the shared concept layer (read-only).
import {
  type AqiLevel,
  aqiIndicatorVar,
  aqiBgVar,
  aqiLabel,
  aqiLevelFromValue,
} from '@/components/concept'

/* ------------------------------------------------------------------ */
/*  Local helper: alert severity → border colour token                 */
/*  (maps green/amber/red vocabulary, no shared-layer counterpart)     */
/* ------------------------------------------------------------------ */

/** Maps alert severity to a border colour token. */
function alertBorderColor(severity: 'green' | 'amber' | 'red'): string {
  const map: Record<string, string> = {
    green: 'var(--bc-semantic-aqi-good-indicator)',
    amber: 'var(--bc-semantic-aqi-moderate-indicator)',
    red: 'var(--bc-semantic-aqi-unhealthy-indicator)',
  }
  return map[severity]
}

/* ------------------------------------------------------------------ */
/*  Tool 1: Real-time Monitoring — sensor map sketch                   */
/* ------------------------------------------------------------------ */

interface MonitoringPanelProps {
  sensors: SensorDot[]
  stationCount: number
}

export function MonitoringPanel({ sensors, stationCount }: MonitoringPanelProps) {
  /* Show a capped number of dots for rendering performance. */
  const visibleDots = sensors.slice(0, 80)

  return (
    <div className="flex flex-col gap-3">
      {/* Map rectangle */}
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{
          aspectRatio: '16 / 10',
          backgroundColor: 'var(--bc-color-light-grey)',
          border: '1px solid var(--bc-color-steel)',
        }}
      >
        {/* Grid lines to suggest a map */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--bc-semantic-map-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--bc-semantic-map-grid) 1px, transparent 1px)',
            backgroundSize: '20% 20%',
          }}
        />

        {/* Road-like lines */}
        <div
          className="absolute"
          style={{
            top: '35%',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: 'var(--bc-semantic-map-road)',
          }}
        />
        <div
          className="absolute"
          style={{
            top: '65%',
            left: '10%',
            right: '15%',
            height: '2px',
            backgroundColor: 'var(--bc-semantic-map-road)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: '40%',
            top: '0',
            bottom: '0',
            width: '2px',
            backgroundColor: 'var(--bc-semantic-map-road)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: '70%',
            top: '10%',
            bottom: '20%',
            width: '2px',
            backgroundColor: 'var(--bc-semantic-map-road)',
          }}
        />

        {/* Sensor dots — functional colour: green/amber/red encodes AQI severity. */}
        {visibleDots.map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: '10px',
              height: '10px',
              backgroundColor: aqiIndicatorVar(dot.level),
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 4px ${aqiIndicatorVar(dot.level)}`,
            }}
          />
        ))}

        {/* Station count overlay */}
        <div
          className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: 'var(--bc-semantic-map-overlay)',
            color: 'var(--bc-semantic-text)',
          }}
        >
          {stationCount} stations
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-3 text-[11px]"
        style={{ color: 'var(--bc-semantic-muted)' }}
      >
        {(['good', 'moderate', 'unhealthy', 'very-unhealthy'] as AqiLevel[]).map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: aqiIndicatorVar(level) }}
            />
            {aqiLabel(level)}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 2: Standards Benchmarking — horizontal gauge                  */
/* ------------------------------------------------------------------ */

interface BenchmarkingPanelProps {
  currentAqi: number
  whoGuideline: number
  nationalStandard: number
  nationalStandardLabel: string
}

export function BenchmarkingPanel({
  currentAqi,
  whoGuideline,
  nationalStandard,
  nationalStandardLabel,
}: BenchmarkingPanelProps) {
  /* Scale: 0–150 range for the gauge. */
  const maxScale = 150
  const currentPct = Math.min((currentAqi / maxScale) * 100, 100)
  const whoPct = Math.min((whoGuideline / maxScale) * 100, 100)
  const nationalPct = Math.min((nationalStandard / maxScale) * 100, 100)
  const currentLevel = aqiLevelFromValue(currentAqi)

  return (
    <div className="flex flex-col gap-4">
      {/* Current reading — functional colour: AQI indicator for the current severity. */}
      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl font-bold"
          style={{ color: aqiIndicatorVar(currentLevel) }}
        >
          {currentAqi}
        </span>
        <span className="text-sm" style={{ color: 'var(--bc-semantic-muted)' }}>
          PM2.5 (ug/m3)
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative w-full">
        {/* Background gradient severity track — functional data-viz gradient (not decorative). */}
        <div
          className="h-5 w-full overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(to right, var(--bc-semantic-aqi-good-indicator) 0%, var(--bc-semantic-aqi-moderate-indicator) 33%, var(--bc-semantic-aqi-unhealthy-indicator) 66%, var(--bc-semantic-aqi-very-unhealthy-indicator) 100%)`,
            opacity: 0.25,
          }}
        />

        {/* Fill bar — functional colour: current AQI level. */}
        <div
          className="absolute left-0 top-0 h-5 rounded-full transition-all duration-500"
          style={{
            width: `${currentPct}%`,
            backgroundColor: aqiIndicatorVar(currentLevel),
            opacity: 0.8,
          }}
        />

        {/* WHO guideline marker */}
        <div
          className="absolute top-0 h-5"
          style={{
            left: `${whoPct}%`,
            width: '2px',
            backgroundColor: 'var(--bc-semantic-text)',
            opacity: 0.6,
          }}
          title={`WHO guideline: ${whoGuideline}`}
        >
          <div
            className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium"
            style={{ color: 'var(--bc-semantic-text)' }}
          >
            WHO: {whoGuideline}
          </div>
        </div>

        {/* National standard marker */}
        <div
          className="absolute top-0 h-5"
          style={{
            left: `${nationalPct}%`,
            width: '2px',
            borderLeft: '2px dashed var(--bc-semantic-muted)',
          }}
          title={`${nationalStandardLabel}: ${nationalStandard}`}
        >
          <div
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium"
            style={{ color: 'var(--bc-semantic-muted)' }}
          >
            National: {nationalStandard}
          </div>
        </div>
      </div>

      {/* Labels */}
      <div
        className="mt-3 flex items-center justify-between text-[11px]"
        style={{ color: 'var(--bc-semantic-muted)' }}
      >
        <span>0</span>
        <span>
          {nationalStandardLabel}: {nationalStandard} ug/m3
        </span>
        <span>{maxScale}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 3: Source Identification — horizontal stacked bar             */
/* ------------------------------------------------------------------ */

interface SourceIdPanelProps {
  sources: SourceSegment[]
}

export function SourceIdPanel({ sources }: SourceIdPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Stacked bar — seg.color is source-category functional colour from toolkit-data. */}
      <div className="flex h-10 w-full overflow-hidden rounded-lg">
        {sources.map((seg) => (
          <div
            key={seg.label}
            className="flex items-center justify-center text-[10px] font-medium transition-all"
            style={{
              width: `${seg.percent}%`,
              backgroundColor: seg.color,
              color: 'var(--bc-color-white)',
              minWidth: seg.percent > 8 ? undefined : '0',
            }}
          >
            {seg.percent >= 12 ? `${seg.percent}%` : ''}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {sources.map((seg) => (
          <span
            key={seg.label}
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: 'var(--bc-semantic-text)' }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label} ({seg.percent}%)
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 4: Forecasting — 14-day timeline                              */
/* ------------------------------------------------------------------ */

interface ForecastingPanelProps {
  forecast: ForecastDay[]
}

export function ForecastingPanel({ forecast }: ForecastingPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Section labels */}
      <div
        className="flex items-center justify-between text-[10px] font-medium"
        style={{ color: 'var(--bc-semantic-muted)' }}
      >
        <span>Past 7 days</span>
        <span>Next 7 days</span>
      </div>

      {/* Timeline blocks — functional colour: AQI level per forecast day. */}
      <div className="flex gap-0.5">
        {forecast.map((day, i) => {
          const isToday = i === 7
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              {/* Day block */}
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: '32px',
                  backgroundColor: aqiIndicatorVar(day.level),
                  opacity: day.isFuture ? 0.5 : 0.85,
                  border: isToday ? '2px solid var(--bc-semantic-text)' : 'none',
                }}
              />
              {/* Day label */}
              <span
                className="text-[9px]"
                style={{
                  color: isToday ? 'var(--bc-semantic-text)' : 'var(--bc-semantic-muted)',
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {isToday ? 'Now' : day.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Today marker legend */}
      <div
        className="flex items-center gap-3 text-[10px]"
        style={{ color: 'var(--bc-semantic-muted)' }}
      >
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ backgroundColor: 'var(--bc-semantic-muted)', opacity: 0.85 }}
          />
          Actual
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ backgroundColor: 'var(--bc-semantic-muted)', opacity: 0.4 }}
          />
          Forecast
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 5: Health & Education — alert cards                           */
/* ------------------------------------------------------------------ */

interface HealthPanelProps {
  alerts: AlertCard[]
}

export function HealthPanel({ alerts }: HealthPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Alert cards — functional colour: severity traffic-light (green/amber/red). */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="rounded-lg px-3 py-2.5 text-sm"
          style={{
            borderLeft: `4px solid ${alertBorderColor(alert.severity)}`,
            backgroundColor:
              alert.severity === 'green'
                ? aqiBgVar('good')
                : alert.severity === 'amber'
                  ? aqiBgVar('moderate')
                  : aqiBgVar('unhealthy'),
            color: 'var(--bc-semantic-text)',
          }}
        >
          {alert.text}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 6: Advocacy & Storytelling — trend chart + stat               */
/* ------------------------------------------------------------------ */

interface AdvocacyPanelProps {
  trendLine: number[]
  trendStat: string
  trendDirection: 'improving' | 'stable' | 'worsening'
}

export function AdvocacyPanel({ trendLine, trendStat, trendDirection }: AdvocacyPanelProps) {
  /* Draw the trend as a simple CSS area chart using positioned divs. */
  const maxVal = Math.max(...trendLine)
  const chartHeight = 80

  /* Direction colour — functional: good=improving, moderate=stable, unhealthy=worsening. */
  const dirColor =
    trendDirection === 'improving'
      ? 'var(--bc-semantic-aqi-good-indicator)'
      : trendDirection === 'worsening'
        ? 'var(--bc-semantic-aqi-unhealthy-indicator)'
        : 'var(--bc-semantic-aqi-moderate-indicator)'

  return (
    <div className="flex flex-col gap-3">
      {/* Mini area chart */}
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{
          height: `${chartHeight + 16}px`,
          backgroundColor: 'var(--bc-color-light-grey)',
          border: '1px solid var(--bc-color-steel)',
        }}
      >
        {/* Bars representing trend points — functional colour: direction. */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-around px-2"
          style={{ height: `${chartHeight}px` }}
        >
          {trendLine.map((val, i) => {
            const barHeight = Math.max((val / maxVal) * chartHeight * 0.85, 4)
            return (
              <div
                key={i}
                className="mx-0.5 flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: dirColor,
                  opacity: 0.4 + (i / trendLine.length) * 0.5,
                }}
              />
            )
          })}
        </div>

        {/* Trend label overlay */}
        <div
          className="absolute right-2 top-2 rounded-md px-2 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: 'var(--bc-semantic-map-overlay)',
            color: dirColor,
          }}
        >
          {trendDirection === 'improving' && 'Improving'}
          {trendDirection === 'stable' && 'Stable'}
          {trendDirection === 'worsening' && 'Worsening'}
        </div>
      </div>

      {/* Stat line */}
      <p className="text-sm font-medium" style={{ color: 'var(--bc-semantic-text)' }}>
        {trendStat}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 7: Action & Behaviour Change — action cards                   */
/* ------------------------------------------------------------------ */

interface ActionPanelProps {
  actions: ActionCard[]
}

export function ActionPanel({ actions }: ActionPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {actions.map((action, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
          style={{
            backgroundColor: 'var(--bc-color-light-grey)',
            border: '1px solid var(--bc-color-steel)',
            color: 'var(--bc-semantic-text)',
          }}
        >
          {/* Icon placeholder — light-teal/dark-blue is functional brand pairing, not decorative. */}
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold"
            style={{
              backgroundColor: 'var(--bc-color-light-teal)',
              color: 'var(--bc-color-dark-blue)',
            }}
          >
            {action.iconLabel.slice(0, 2)}
          </span>
          <span className="text-sm">{action.text}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tool 8: Open Data Access — table + download + API snippet          */
/* ------------------------------------------------------------------ */

interface OpenDataPanelProps {
  dataRows: DataRow[]
  apiEndpoint: string
}

export function OpenDataPanel({ dataRows, apiEndpoint }: OpenDataPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Mini data table */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: 'var(--bc-color-steel)' }}
      >
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ backgroundColor: 'var(--bc-color-light-grey)' }}>
              <th
                className="px-2 py-1.5 text-left font-semibold"
                style={{ color: 'var(--bc-semantic-text)' }}
              >
                Station
              </th>
              <th
                className="px-2 py-1.5 text-right font-semibold"
                style={{ color: 'var(--bc-semantic-text)' }}
              >
                PM2.5
              </th>
              <th
                className="px-2 py-1.5 text-right font-semibold"
                style={{ color: 'var(--bc-semantic-text)' }}
              >
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => {
              /* PM2.5 colour is functional — maps the reading to AQI severity. */
              const level = aqiLevelFromValue(row.pm25)
              return (
                <tr
                  key={i}
                  className="border-t"
                  style={{ borderColor: 'var(--bc-color-steel)' }}
                >
                  <td className="px-2 py-1.5" style={{ color: 'var(--bc-semantic-text)' }}>
                    {row.station}
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium">
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ color: aqiIndicatorVar(level) }}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: aqiIndicatorVar(level) }}
                      />
                      {row.pm25}
                    </span>
                  </td>
                  <td
                    className="px-2 py-1.5 text-right"
                    style={{ color: 'var(--bc-semantic-muted)' }}
                  >
                    {row.timestamp}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* API endpoint snippet — dark-blue/teal is the canonical code-block pairing. */}
      <div
        className="overflow-x-auto rounded-md px-3 py-2 font-mono text-[11px]"
        style={{
          backgroundColor: 'var(--bc-color-dark-blue)',
          color: 'var(--bc-color-light-teal)',
        }}
      >
        GET https://{apiEndpoint}
      </div>

      {/* Download button */}
      <span
        className="inline-flex w-fit items-center rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: 'var(--bc-semantic-brand)',
          color: 'var(--bc-color-white)',
          cursor: 'default',
        }}
      >
        Download CSV
      </span>
    </div>
  )
}
