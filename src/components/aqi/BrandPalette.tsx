const paletteData: Array<{ name: string; swatches: string[] }> = [
  { name: 'BC Blue',    swatches: ['#cce3f5', '#66b2e8', '#0071c7', '#004d8a', '#002847'] },
  { name: 'Dark Blue',  swatches: ['#ccd6e8', '#668ab5', '#003574', '#002350', '#00122a'] },
  { name: 'Light Blue', swatches: ['#d1f2fc', '#74d9f6', '#23bced', '#0f83a6', '#08435a'] },
  { name: 'Teal',       swatches: ['#d3f5ef', '#7de0d0', '#2bcdb0', '#1a7d6c', '#0d4038'] },
  { name: 'Tangerine',  swatches: ['#fdd5c2', '#fa9b70', '#f55200', '#a33700', '#521c00'] },
  { name: 'Green',      swatches: ['#c2eecf', '#60cf85', '#03ab3d', '#027029', '#013814'] },
]

const rowLabels: string[] = ['Tint 90', 'Tint 70', 'Base', 'Shade 70', 'Shade 90']

export default function BrandPalette() {
  return (
    <section>
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: 'hsl(var(--foreground))',
        }}
      >
        Brand Palette
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
        }}
      >
        {paletteData.map((col) => (
          <div key={col.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'hsl(var(--foreground))',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {col.name}
            </div>

            {col.swatches.map((hex, rowIndex) => (
              <div key={hex}>
                <div
                  style={{
                    height: '48px',
                    width: '100%',
                    backgroundColor: hex,
                    borderRadius: '6px',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <div
                  style={{
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    color: 'hsl(var(--foreground))',
                    marginTop: '2px',
                    lineHeight: 1.2,
                  }}
                >
                  <span style={{ opacity: 0.6 }}>{rowLabels[rowIndex]}</span>
                  <br />
                  {hex}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
