interface SwatchItem {
  label: string
  hex: string
  darkText?: boolean
}

interface DirectionHeaderProps {
  directionName: string
  mode: 'light' | 'dark'
  fontLabel: string
  fontFamily: string
  monoFamily?: string
  swatches: Array<SwatchItem>
}

export default function DirectionHeader({
  directionName,
  mode,
  fontLabel,
  fontFamily,
  monoFamily,
  swatches,
}: DirectionHeaderProps) {
  return (
    <div
      style={{
        width: '100%',
        padding: '24px',
        backgroundColor: 'hsl(var(--muted))',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Row 1: direction name + mode badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
          }}
        >
          {directionName}
        </h2>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {mode === 'light' ? 'Light Mode' : 'Dark Mode'}
        </span>
      </div>

      {/* Row 2: font specimen box */}
      <div
        style={{
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          borderRadius: 'var(--radius)',
          backgroundColor: 'hsl(var(--card))',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            color: 'hsl(var(--muted-foreground))',
            letterSpacing: '0.08em',
          }}
        >
          {fontLabel}
        </div>
        <div
          style={{
            fontSize: '2.5rem',
            fontFamily: fontFamily,
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            lineHeight: 1.1,
          }}
        >
          Air Quality Index
        </div>
        <div
          style={{
            fontSize: '1rem',
            fontFamily: fontFamily,
            fontWeight: 400,
            color: 'hsl(var(--foreground))',
          }}
        >
          Real-time monitoring for Vienna
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            fontFamily: monoFamily !== undefined ? monoFamily : fontFamily,
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          PM2.5 · NO₂ · O₃ · CO
        </div>
      </div>

      {/* Row 3: swatches */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {swatches.map((swatch) => (
          <div
            key={swatch.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: swatch.hex,
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: '11px',
                color: swatch.darkText === true
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--muted-foreground))',
                lineHeight: 1.3,
              }}
            >
              {swatch.label}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.2,
              }}
            >
              {swatch.hex}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
