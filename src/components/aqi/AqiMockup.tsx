import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Activity,
} from 'lucide-react'
import AqiMap from './AqiMap'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AqiMockupProps {
  typography: 'sans' | 'sans-mono'
}

interface PollutantCardData {
  name: string
  value: string
  unit: string
  progressPercent: number
  progressColor: string
}

interface StationRow {
  station: string
  district: string
  aqi: number
  status: 'Good' | 'Moderate' | 'Unhealthy'
}

const pollutants: PollutantCardData[] = [
  { name: 'PM2.5', value: '10.2', unit: 'µg/m³', progressPercent: 28, progressColor: '#03ab3d' },
  { name: 'PM10', value: '18.7', unit: 'µg/m³', progressPercent: 25, progressColor: '#03ab3d' },
  { name: 'NO₂', value: '28', unit: 'µg/m³', progressPercent: 35, progressColor: '#03ab3d' },
  { name: 'O₃', value: '52', unit: 'µg/m³', progressPercent: 55, progressColor: '#b8860b' },
  { name: 'CO', value: '0.3', unit: 'mg/m³', progressPercent: 15, progressColor: '#03ab3d' },
]

const stations: StationRow[] = [
  { station: 'Stephansplatz', district: '1st', aqi: 42, status: 'Good' },
  { station: 'Prater', district: '2nd', aqi: 55, status: 'Good' },
  { station: 'Mariahilf', district: '6th', aqi: 58, status: 'Good' },
  { station: 'Favoriten', district: '10th', aqi: 67, status: 'Moderate' },
  { station: 'Floridsdorf', district: '21st', aqi: 81, status: 'Unhealthy' },
  { station: 'Donaustadt', district: '22nd', aqi: 44, status: 'Good' },
]

const aqiScaleSegments = [
  { label: 'Good', color: '#03ab3d' },
  { label: 'Moderate', color: '#b8860b' },
  { label: 'Unhealthy Sensitive', color: '#f55200' },
  { label: 'Unhealthy', color: '#c0392b' },
  { label: 'Very Unhealthy', color: '#8e44ad' },
  { label: 'Hazardous', color: '#7b241c' },
]

const forecastBars = [
  { label: '00:00', value: 35 },
  { label: '04:00', value: 29 },
  { label: '08:00', value: 44 },
  { label: '12:00', value: 52 },
  { label: '16:00', value: 48 },
  { label: '20:00', value: 42 },
]

const maxForecastValue = 80

function statusBadgeStyle(status: StationRow['status']): React.CSSProperties {
  if (status === 'Good') {
    return { backgroundColor: '#03ab3d', color: 'white' }
  }
  if (status === 'Moderate') {
    return { backgroundColor: '#b8860b', color: 'white' }
  }
  return { backgroundColor: '#f55200', color: 'white' }
}

export default function AqiMockup({ typography }: AqiMockupProps) {
  const bodyFont =
    typography === 'sans-mono'
      ? 'var(--bc-font-family-mono)'
      : 'var(--bc-font-family-sans)'

  const headingFont = 'var(--bc-font-family-sans)'

  return (
    <div
      style={{
        fontFamily: bodyFont,
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        minWidth: '320px',
      }}
    >
      {/* Nav bar */}
      <nav
        style={{
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1.125rem', fontFamily: headingFont }}>
          Breathe Cities
        </span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Cities', 'Rankings', 'Health', 'API'].map((link) => (
            <span
              key={link}
              style={{
                fontSize: '0.875rem',
                opacity: 0.85,
                cursor: 'pointer',
                fontFamily: bodyFont,
              }}
            >
              {link}
            </span>
          ))}
        </div>
      </nav>

      {/* Hero section */}
      <section
        style={{
          padding: '40px 24px',
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: '0.75rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '8px',
            fontFamily: bodyFont,
          }}
        >
          Europe / Austria / Vienna
        </div>

        {/* City name */}
        <h1
          style={{
            margin: '0 0 4px 0',
            fontSize: '4rem',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            fontFamily: headingFont,
            lineHeight: 1.05,
          }}
        >
          Vienna
        </h1>
        <div
          style={{
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '24px',
            fontFamily: bodyFont,
          }}
        >
          Austria
        </div>

        {/* AQI display row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '6rem',
              fontWeight: 700,
              lineHeight: 1,
              color: 'hsl(var(--foreground))',
              fontFamily: headingFont,
            }}
          >
            42
          </span>
          <span
            style={{
              backgroundColor: '#03ab3d',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Good
          </span>
        </div>

        {/* AQI scale bar */}
        <div style={{ marginBottom: '8px', position: 'relative' }}>
          {/* Triangle marker above Good segment */}
          <div
            style={{
              display: 'flex',
              marginBottom: '2px',
            }}
          >
            {aqiScaleSegments.map((seg, i) => (
              <div key={seg.label} style={{ flex: 1 }}>
                {i === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: '#03ab3d',
                      lineHeight: 1,
                    }}
                  >
                    ▼
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {aqiScaleSegments.map((seg) => (
              <div
                key={seg.label}
                style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: seg.color,
                }}
              />
            ))}
          </div>
        </div>

        {/* Main pollutant */}
        <div
          style={{
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '4px',
            fontFamily: bodyFont,
          }}
        >
          Main pollutant: PM2.5
        </div>

        {/* Updated */}
        <div
          style={{
            fontSize: '0.75rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '16px',
            fontFamily: bodyFont,
          }}
        >
          Updated 5 minutes ago
        </div>

        {/* Weather strip */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Thermometer size={14} />
            14°C
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Droplets size={14} />
            62%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wind size={14} />
            12 km/h
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={14} />
            10 km
          </span>
        </div>
      </section>

      {/* Health card */}
      <div style={{ margin: '0 24px 24px' }}>
        <div
          style={{
            backgroundColor: '#c2eecf',
            color: '#027029',
            padding: '16px',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            <CheckCircle size={16} />
            Air quality is Good
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Air quality is satisfactory. Enjoy your usual outdoor activities.
          </div>
        </div>
      </div>

      {/* Pollutant cards row */}
      <section style={{ padding: '0 24px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
          }}
          className="grid-cols-2 sm:grid-cols-5"
        >
          {pollutants.map((p) => (
            <Card key={p.name}>
              <CardContent style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase' as const,
                    color: 'hsl(var(--muted-foreground))',
                    fontFamily: 'monospace',
                    letterSpacing: '0.06em',
                    marginBottom: '4px',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: bodyFont,
                    color: 'hsl(var(--foreground))',
                    lineHeight: 1.1,
                  }}
                >
                  {p.value}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--muted-foreground))',
                    marginBottom: '8px',
                  }}
                >
                  {p.unit}
                </div>
                <div
                  style={{
                    height: '4px',
                    backgroundColor: 'hsl(var(--muted))',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${p.progressPercent}%`,
                      backgroundColor: p.progressColor,
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Map section */}
      <section style={{ padding: '0 24px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'hsl(var(--foreground))',
              fontFamily: headingFont,
            }}
          >
            Air Quality Map — Vienna
          </h3>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'hsl(var(--muted-foreground))',
              fontFamily: bodyFont,
            }}
          >
            42 monitoring stations · Updated 5 min ago
          </span>
        </div>
        <AqiMap />
      </section>

      {/* Forecast tabs */}
      <section style={{ padding: '0 24px 24px' }}>
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="3day">3 Day</TabsTrigger>
            <TabsTrigger value="7day">7 Day</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '100px',
                padding: '16px 0 0',
              }}
            >
              {forecastBars.map((bar) => (
                <div
                  key={bar.label}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '40px',
                      height: `${Math.round((bar.value / maxForecastValue) * 80)}px`,
                      backgroundColor: '#03ab3d',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: bodyFont,
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {bar.label}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="3day">
            <div
              style={{
                padding: '16px 0',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: bodyFont,
              }}
            >
              3-day forecast data unavailable in demo.
            </div>
          </TabsContent>
          <TabsContent value="7day">
            <div
              style={{
                padding: '16px 0',
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: bodyFont,
              }}
            >
              7-day forecast data unavailable in demo.
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Nearby stations */}
      <section style={{ padding: '0 24px 24px' }}>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
            fontFamily: headingFont,
          }}
        >
          Nearby Stations
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station</TableHead>
              <TableHead>District</TableHead>
              <TableHead>AQI</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((row) => (
              <TableRow key={row.station}>
                <TableCell style={{ fontFamily: bodyFont }}>{row.station}</TableCell>
                <TableCell style={{ fontFamily: bodyFont }}>{row.district}</TableCell>
                <TableCell style={{ fontFamily: bodyFont, fontWeight: 600 }}>{row.aqi}</TableCell>
                <TableCell>
                  <span
                    style={{
                      ...statusBadgeStyle(row.status),
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-block',
                    }}
                  >
                    {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'hsl(var(--muted))',
          padding: '16px 24px',
          borderTop: '1px solid hsl(var(--border))',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'hsl(var(--muted-foreground))',
          fontFamily: bodyFont,
        }}
      >
        © 2025 Breathe Cities · Data for 7,000+ cities worldwide
      </footer>
    </div>
  )
}
