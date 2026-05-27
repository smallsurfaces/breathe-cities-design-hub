// AQI colour helper
function aqiColour(value: number): string {
  if (value <= 50) return '#03ab3d'
  if (value <= 100) return '#b8860b'
  return '#f55200'
}

// ---------------------------------------------------------------------------
// AqiAreaChart
// ---------------------------------------------------------------------------

const areaDataValues: number[] = [35, 29, 26, 38, 52, 58, 61, 55, 48, 44, 42, 38]
const areaDataX: number[] = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550]
const xLabels: string[] = [
  '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
  '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
]
const gridValues: number[] = [25, 50, 75, 100]

function mapY(value: number): number {
  return 180 - (value / 100) * 160 + 10
}

function buildAreaPath(
  xs: number[],
  ys: number[],
  bottomY: number,
): string {
  if (xs.length === 0) return ''

  let d = `M ${xs[0]} ${ys[0]}`

  for (let i = 1; i < xs.length; i++) {
    const midX = (xs[i - 1] + xs[i]) / 2
    d += ` C ${midX} ${ys[i - 1]}, ${midX} ${ys[i]}, ${xs[i]} ${ys[i]}`
  }

  // Close to bottom-right then bottom-left
  d += ` L 600 ${bottomY} L ${xs[0]} ${bottomY} Z`
  return d
}

function buildLinePath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return ''

  let d = `M ${xs[0]} ${ys[0]}`

  for (let i = 1; i < xs.length; i++) {
    const midX = (xs[i - 1] + xs[i]) / 2
    d += ` C ${midX} ${ys[i - 1]}, ${midX} ${ys[i]}, ${xs[i]} ${ys[i]}`
  }

  return d
}

export function AqiAreaChart() {
  const ys = areaDataValues.map(mapY)
  const fillPath = buildAreaPath(areaDataX, ys, 190)
  const strokePath = buildLinePath(areaDataX, ys)

  return (
    <svg viewBox="0 0 600 200" width="100%" height="200">
      {/* Horizontal gridlines */}
      {gridValues.map((v) => {
        const gy = mapY(v)
        return (
          <line
            key={v}
            x1={0}
            y1={gy}
            x2={600}
            y2={gy}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
        )
      })}

      {/* Fill area */}
      <path
        d={fillPath}
        fill="hsl(var(--primary))"
        fillOpacity={0.15}
        stroke="none"
      />

      {/* Stroke line */}
      <path
        d={strokePath}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {/* Dots */}
      {areaDataX.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={ys[i]}
          r={4}
          fill={aqiColour(areaDataValues[i])}
        />
      ))}

      {/* X axis labels */}
      {areaDataX.map((x, i) => (
        <text
          key={i}
          x={x}
          y={198}
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
        >
          {xLabels[i]}
        </text>
      ))}

      {/* Y axis labels */}
      {[0, 25, 50, 75, 100].map((v) => (
        <text
          key={v}
          x={2}
          y={mapY(v) + 4}
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
        >
          {v}
        </text>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// PollutantPieChart
// ---------------------------------------------------------------------------

interface PieSegment {
  label: string
  percent: number
  colour: string
}

const pieSegments: PieSegment[] = [
  { label: 'PM2.5', percent: 35, colour: '#0071c7' },
  { label: 'PM10',  percent: 25, colour: '#23bced' },
  { label: 'NO2',   percent: 20, colour: '#2bcdb0' },
  { label: 'O3',    percent: 12, colour: '#f55200' },
  { label: 'CO',    percent:  8, colour: '#003574' },
]

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, startDeg)
  const end = polarToCartesian(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

export function PollutantPieChart() {
  let cumulative = 0

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={200} height={200}>
        {pieSegments.map((seg) => {
          const startDeg = (cumulative / 100) * 360
          cumulative += seg.percent
          const endDeg = (cumulative / 100) * 360
          const d = buildArcPath(100, 100, 75, startDeg, endDeg)
          return (
            <path
              key={seg.label}
              d={d}
              fill={seg.colour}
              stroke="white"
              strokeWidth={1}
            />
          )
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        {pieSegments.map((seg) => (
          <div
            key={seg.label}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: seg.colour,
                borderRadius: '2px',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'hsl(var(--foreground))',
              }}
            >
              {seg.label} {seg.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WeeklyBarChart
// ---------------------------------------------------------------------------

interface BarDatum {
  day: string
  value: number
}

const weeklyData: BarDatum[] = [
  { day: 'Mon', value: 44 },
  { day: 'Tue', value: 51 },
  { day: 'Wed', value: 38 },
  { day: 'Thu', value: 62 },
  { day: 'Fri', value: 55 },
  { day: 'Sat', value: 48 },
  { day: 'Sun', value: 42 },
]

const barXPositions: number[] = [30, 90, 150, 210, 270, 330, 390]
const barWidth = 40
const chartBottom = 180
const moderateDashY = chartBottom - (50 / 100) * 160

export function WeeklyBarChart() {
  return (
    <svg viewBox="0 0 420 200" width="100%" height="200">
      {/* Y axis labels */}
      {[0, 50, 100].map((v) => {
        const y = chartBottom - (v / 100) * 160
        return (
          <text
            key={v}
            x={2}
            y={y + 4}
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            {v}
          </text>
        )
      })}

      {/* Bars */}
      {weeklyData.map((d, i) => {
        const barHeight = (d.value / 100) * 160
        const barY = chartBottom - barHeight
        return (
          <rect
            key={d.day}
            x={barXPositions[i] - barWidth / 2}
            y={barY}
            width={barWidth}
            height={barHeight}
            fill={aqiColour(d.value)}
            rx={3}
          />
        )
      })}

      {/* Dashed moderate line */}
      <line
        x1={0}
        y1={moderateDashY}
        x2={405}
        y2={moderateDashY}
        stroke="#b8860b"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text
        x={407}
        y={moderateDashY + 4}
        fontSize={9}
        fill="#b8860b"
      >
        Moderate
      </text>

      {/* Day labels */}
      {weeklyData.map((d, i) => (
        <text
          key={d.day}
          x={barXPositions[i]}
          y={198}
          fontSize={10}
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
        >
          {d.day}
        </text>
      ))}
    </svg>
  )
}
