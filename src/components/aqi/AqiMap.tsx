import { Compass } from 'lucide-react'

interface MarkerDatum {
  aqi: number
  left: string
  top: string
}

function markerColour(aqi: number): string {
  if (aqi <= 50) return '#03ab3d'
  if (aqi <= 70) return '#b8860b'
  return '#f55200'
}

const markers: MarkerDatum[] = [
  { aqi: 42, left: '40%', top: '50%' },
  { aqi: 38, left: '25%', top: '30%' },
  { aqi: 55, left: '50%', top: '45%' },
  { aqi: 61, left: '65%', top: '55%' },
  { aqi: 58, left: '48%', top: '70%' },
  { aqi: 81, left: '75%', top: '25%' },
  { aqi: 67, left: '72%', top: '68%' },
  { aqi: 44, left: '45%', top: '20%' },
]

export default function AqiMap() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '380px',
        overflow: 'hidden',
        borderRadius: 'var(--radius)',
        border: '1px solid hsl(var(--border))',
        backgroundColor: '#f0f4f8',
        backgroundImage: [
          'repeating-linear-gradient(0deg, rgba(148,163,184,0.2) 0px, rgba(148,163,184,0.2) 1px, transparent 1px, transparent 40px)',
          'repeating-linear-gradient(90deg, rgba(148,163,184,0.2) 0px, rgba(148,163,184,0.2) 1px, transparent 1px, transparent 40px)',
        ].join(', '),
      }}
    >
      {/* Green zone radial overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle 200px at 40% 50%, rgba(3,171,61,0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Amber zone radial overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle 150px at 75% 25%, rgba(184,134,11,0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* SVG road overlay */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <ellipse
          cx="45%"
          cy="50%"
          rx="12%"
          ry="8%"
          fill="none"
          stroke="rgba(148,163,184,0.5)"
          strokeWidth={2}
        />
        <line
          x1="20%"
          y1="50%"
          x2="80%"
          y2="50%"
          stroke="rgba(148,163,184,0.5)"
          strokeWidth={2}
        />
        <line
          x1="45%"
          y1="15%"
          x2="50%"
          y2="85%"
          stroke="rgba(148,163,184,0.5)"
          strokeWidth={2}
        />
      </svg>

      {/* AQI markers */}
      {markers.map((m) => (
        <div
          key={`${m.left}-${m.top}`}
          style={{
            position: 'absolute',
            left: m.left,
            top: m.top,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: markerColour(m.aqi),
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {m.aqi}
        </div>
      ))}

      {/* Compass */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <Compass size={20} color="#64748b" />
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#64748b',
            lineHeight: 1,
          }}
        >
          N
        </span>
      </div>

      {/* Legend strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.85)',
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#03ab3d',
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'hsl(var(--foreground))' }}>Good</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#b8860b',
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'hsl(var(--foreground))' }}>Moderate</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#f55200',
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'hsl(var(--foreground))' }}>Unhealthy</span>
        </div>
      </div>
    </div>
  )
}
