import { Card, CardContent } from "@/components/ui/card";

export const SENSOR_DATA = [
  {
    city: "London",
    shapeKey: "london",
    flag: "\u{1F1EC}\u{1F1E7}",
    totalSensors: 122,
    referenceCount: 18,
    lowCostCount: 104,
    ownership: [
      { label: "City gov", pct: 12 },
      { label: "Academic", pct: 28 },
      { label: "Community", pct: 25 },
      { label: "Breathe London", pct: 35 },
    ],
    dots: [
      { x: 18, y: 12, ref: true }, { x: 45, y: 8, ref: false }, { x: 72, y: 15, ref: false },
      { x: 30, y: 28, ref: false }, { x: 55, y: 22, ref: true }, { x: 82, y: 30, ref: false },
      { x: 12, y: 42, ref: false }, { x: 38, y: 38, ref: false }, { x: 60, y: 35, ref: false },
      { x: 88, y: 18, ref: false }, { x: 25, y: 55, ref: true }, { x: 50, y: 48, ref: false },
      { x: 70, y: 52, ref: false }, { x: 15, y: 68, ref: false }, { x: 42, y: 62, ref: true },
      { x: 65, y: 58, ref: false }, { x: 85, y: 45, ref: false }, { x: 20, y: 78, ref: false },
      { x: 48, y: 75, ref: false }, { x: 75, y: 70, ref: true }, { x: 8, y: 85, ref: false },
      { x: 35, y: 82, ref: false }, { x: 58, y: 88, ref: false }, { x: 90, y: 60, ref: false },
      { x: 32, y: 18, ref: false }, { x: 62, y: 25, ref: false }, { x: 78, y: 42, ref: false },
      { x: 22, y: 48, ref: true }, { x: 52, y: 55, ref: false }, { x: 40, y: 45, ref: false },
      { x: 68, y: 68, ref: false }, { x: 28, y: 72, ref: false }, { x: 55, y: 32, ref: true },
      { x: 80, y: 75, ref: false }, { x: 15, y: 35, ref: false }, { x: 45, y: 90, ref: false },
      { x: 92, y: 50, ref: false }, { x: 10, y: 58, ref: true }, { x: 38, y: 30, ref: false },
      { x: 65, y: 80, ref: false },
    ],
  },
  {
    city: "Nairobi",
    shapeKey: "nairobi",
    flag: "\u{1F1F0}\u{1F1EA}",
    totalSensors: 24,
    referenceCount: 3,
    lowCostCount: 21,
    ownership: [
      { label: "National gov", pct: 8 },
      { label: "UNEP/Intl", pct: 17 },
      { label: "Community/AirQo", pct: 54 },
      { label: "Academic", pct: 21 },
    ],
    dots: [
      { x: 30, y: 20, ref: true }, { x: 55, y: 35, ref: false }, { x: 75, y: 15, ref: false },
      { x: 20, y: 50, ref: false }, { x: 45, y: 55, ref: true }, { x: 70, y: 45, ref: false },
      { x: 35, y: 70, ref: false }, { x: 60, y: 65, ref: false }, { x: 85, y: 30, ref: false },
      { x: 15, y: 80, ref: false }, { x: 50, y: 78, ref: false }, { x: 80, y: 60, ref: false },
      { x: 25, y: 38, ref: false }, { x: 65, y: 82, ref: false }, { x: 40, y: 42, ref: false },
      { x: 90, y: 72, ref: false }, { x: 12, y: 25, ref: false }, { x: 55, y: 18, ref: true },
      { x: 72, y: 88, ref: false }, { x: 42, y: 85, ref: false },
    ],
  },
  {
    city: "Accra",
    shapeKey: "accra",
    flag: "\u{1F1EC}\u{1F1ED}",
    totalSensors: 14,
    referenceCount: 2,
    lowCostCount: 12,
    ownership: [
      { label: "US Embassy", pct: 14 },
      { label: "National gov", pct: 7 },
      { label: "Community/AirQo", pct: 79 },
    ],
    dots: [
      { x: 48, y: 40, ref: true }, { x: 30, y: 60, ref: true }, { x: 70, y: 25, ref: false },
      { x: 20, y: 30, ref: false }, { x: 55, y: 70, ref: false }, { x: 80, y: 50, ref: false },
      { x: 40, y: 85, ref: false }, { x: 65, y: 55, ref: false }, { x: 15, y: 75, ref: false },
      { x: 85, y: 80, ref: false }, { x: 35, y: 15, ref: false }, { x: 60, y: 90, ref: false },
      { x: 50, y: 50, ref: false }, { x: 75, y: 70, ref: false },
    ],
  },
];

const CITY_SHAPES: Record<string, string> = {
  // London: wider E-W blob following rough M25 ring, slight Thames indent on south
  london: "M50,5 C65,3 80,10 88,20 C95,30 97,45 92,55 C88,65 82,72 75,78 C68,84 58,88 50,90 C42,88 32,84 25,78 C18,72 12,65 8,55 C3,45 5,30 12,20 C20,10 35,3 50,5 Z",
  // Nairobi: compact oval, slightly wider N-S
  nairobi: "M50,8 C68,8 82,22 85,40 C88,55 82,70 72,80 C62,88 42,90 32,82 C22,74 15,60 14,45 C13,28 25,12 42,8 C45,7 48,8 50,8 Z",
  // Accra: coastal city — flat bottom (coast), rounded top
  accra: "M15,85 C12,70 10,55 15,40 C20,28 30,18 42,12 C52,8 62,8 72,14 C82,20 88,32 90,45 C92,58 90,72 88,85 L15,85 Z",
};

const OWNERSHIP_SHADES = [
  "bg-foreground/60",
  "bg-foreground/40",
  "bg-foreground/25",
  "bg-foreground/15",
];

function DotMap({ dots, cityShape, shapeId, height = 180 }: { dots: { x: number; y: number; ref: boolean }[]; cityShape: string; shapeId: string; height?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full"
      style={{ height }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id={`crosshatch-${shapeId}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8L8 0" stroke="currentColor" strokeWidth="0.3" className="text-foreground/8" />
        </pattern>
        <clipPath id={`city-clip-${shapeId}`}>
          <path d={cityShape} />
        </clipPath>
      </defs>
      <g clipPath={`url(#city-clip-${shapeId})`}>
        <path d={cityShape} fill="currentColor" className="text-foreground/5" />
        <path d={cityShape} fill={`url(#crosshatch-${shapeId})`} />
        {dots.map((dot, i) =>
          dot.ref ? (
            <circle key={i} cx={dot.x} cy={dot.y} r={2.8} fill="currentColor" className="text-foreground/70" />
          ) : (
            <circle key={i} cx={dot.x} cy={dot.y} r={2.2} fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/40" />
          )
        )}
      </g>
    </svg>
  );
}

function OwnershipBar({ segments }: { segments: { label: string; pct: number }[] }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {segments.map((seg, i) => (
        <div
          key={i}
          className={OWNERSHIP_SHADES[i] ?? "bg-foreground/10"}
          style={{ width: `${seg.pct}%` }}
        />
      ))}
    </div>
  );
}

/**
 * CitySensorMap — full-width sensor map for a single city's detail page.
 * Renders the dot map at a larger height (320px) with ownership bar and legends.
 * Returns null if the city has no sensor data.
 */
export function CitySensorMap({ citySlug }: { citySlug: string }) {
  const cityData = SENSOR_DATA.find(
    (c) => c.city.toLowerCase() === citySlug || c.shapeKey === citySlug
  );
  if (!cityData) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-foreground">
            {cityData.flag} {cityData.city}
          </p>
          <p className="text-sm text-muted-foreground">
            {cityData.totalSensors} sensors — {cityData.referenceCount} reference, {cityData.lowCostCount} low-cost
          </p>
        </div>
      </div>

      <DotMap
        dots={cityData.dots}
        cityShape={CITY_SHAPES[cityData.shapeKey]}
        shapeId={cityData.shapeKey}
        height={320}
      />

      <OwnershipBar segments={cityData.ownership} />

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-foreground/70" />
          Reference
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-foreground/40" />
          Low-cost
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {cityData.ownership.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-4 rounded-sm ${OWNERSHIP_SHADES[i] ?? "bg-foreground/10"}`}
            />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SensorLandscape() {
  return (
    <>
      {SENSOR_DATA.map((city) => (
        <Card key={city.city} className="flex flex-col h-full">
          <CardContent className="flex flex-col h-full gap-3 pt-5">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {city.flag} {city.city}
              </p>
              <p className="text-xs text-muted-foreground">
                {city.totalSensors} sensors
              </p>
            </div>

            <DotMap
              dots={city.dots}
              cityShape={CITY_SHAPES[city.shapeKey]}
              shapeId={city.shapeKey}
            />

            <OwnershipBar segments={city.ownership} />

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-foreground/70" />
                Ref
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-foreground/40" />
                Low-cost
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {city.ownership.map((seg, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-3 rounded-sm ${OWNERSHIP_SHADES[i] ?? "bg-foreground/10"}`}
                  />
                  {seg.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
