/**
 * PracticeCardView.tsx — v2 copy. Internal links updated to /ux-concepts/best-practice-roadmap-v2/
 * routes so this concept is self-contained. All chart sub-components (monochrome SVG/CSS) kept
 * exactly as-is per the build brief — they use var(--foreground) tokens, not decorative hex.
 *
 * Key exports: PracticeCardView, PracticeCardTile
 * External dependencies: next/link, shadcn (Card, Badge, Separator), @/data/roadmap-data,
 *   ./StageBadge (v2 BC-token tinted version)
 */
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type PracticeCard,
  type CityExample,
  getDomainById,
  getCityBySlug,
  getPracticeById,
} from "@/data/roadmap-data";
import { StageBadge } from "./StageBadge";

interface PracticeCardViewProps {
  practice: PracticeCard;
  linkCities?: boolean;
  anchorId?: string;
}

function DeltaBar({ data }: { data: any }) {
  const max = Math.max(data.before, data.after);
  const beforePct = (data.before / max) * 100;
  const afterPct = (data.after / max) * 100;

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">{data.label}</div>
      <div className="space-y-1.5">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">Before</div>
          <div className="h-5 w-full rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded bg-foreground/20"
              style={{ width: `${beforePct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {data.before} {data.unit}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">After</div>
          <div className="h-5 w-full rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded bg-foreground/60"
              style={{ width: `${afterPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-muted-foreground">
              {data.after} {data.unit}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {data.change}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupedBar({ data }: { data: any }) {
  const isSourceBreakdown = data.metrics.every(
    (m: any) => m.before === 0
  );
  const max = isSourceBreakdown
    ? Math.max(...data.metrics.map((m: any) => m.after))
    : Math.max(
        ...data.metrics.flatMap((m: any) => [m.before, m.after])
      );

  return (
    <div className="space-y-2">
      {data.metrics.map((m: any, i: number) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className="text-sm font-semibold text-foreground">
              {m.change}
            </span>
          </div>
          {isSourceBreakdown ? (
            <div className="h-4 w-full rounded bg-muted overflow-hidden">
              <div
                className="h-full rounded bg-foreground/60"
                style={{ width: `${(m.after / max) * 100}%` }}
              />
            </div>
          ) : (
            <div className="flex gap-1 h-4">
              <div
                className="h-full rounded bg-foreground/20"
                style={{ width: `${(m.before / max) * 50}%` }}
              />
              <div
                className="h-full rounded bg-foreground/60"
                style={{ width: `${(m.after / max) * 50}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Sparkline({ data }: { data: any }) {
  const values: number[] = data.values;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 240;
  const h = 60;
  const pad = 2;

  const points = values.map((v: number, i: number) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaPath = `M${points[0]} ${points.join(" L")} L${pad + ((values.length - 1) / (values.length - 1)) * (w - pad * 2)},${h} L${pad},${h} Z`;

  return (
    <div className="space-y-1">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height: 80 }}
        preserveAspectRatio="none"
      >
        <path d={areaPath} fill="currentColor" className="text-foreground/10" />
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/60"
        />
      </svg>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {data.label} &middot; {data.years}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {data.change}
        </span>
      </div>
    </div>
  );
}

function DoubleRing({ data }: { data: any }) {
  // data: { type: "doubleRing", label: "...", before: 4, after: 20, unit: "stations", change: "+400%" }
  const beforePct = Math.round((data.before / data.after) * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-muted-foreground">{data.label}</div>
      <div className="relative" style={{ width: 120, height: 120 }}>
        {/* Outer ring — after */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(color-mix(in srgb, var(--foreground) 50%, transparent) 100%, transparent 100%)`,
            mask: 'radial-gradient(circle, transparent 38px, black 39px, black 58px, transparent 59px)',
            WebkitMask: 'radial-gradient(circle, transparent 38px, black 39px, black 58px, transparent 59px)',
          }}
        />
        {/* Inner ring — before */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(color-mix(in srgb, var(--foreground) 25%, transparent) ${beforePct}%, transparent ${beforePct}%)`,
            mask: 'radial-gradient(circle, transparent 18px, black 19px, black 36px, transparent 37px)',
            WebkitMask: 'radial-gradient(circle, transparent 18px, black 19px, black 36px, transparent 37px)',
          }}
        />
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-foreground">{data.after}</div>
          <div className="text-[10px] text-muted-foreground">{data.unit}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--foreground) 25%, transparent)' }} />
          Before ({data.before})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--foreground) 50%, transparent)' }} />
          After ({data.after})
        </span>
      </div>
    </div>
  );
}

function CoverageRing({ data }: { data: any }) {
  const pct = data.value;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 80, height: 80 }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              color-mix(in srgb, var(--foreground) 50%, transparent) 0% ${pct}%,
              var(--muted) ${pct}% 100%
            )`,
          }}
        />
        <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
          <span className="text-lg font-semibold text-foreground">
            {pct}{data.unit}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{data.label}</span>
      {data.sublabel && (
        <div className="text-xs font-semibold text-foreground">{data.sublabel}</div>
      )}
    </div>
  );
}

function SourceDonut({ data, cityFlag }: { data: any; cityFlag?: string }) {
  const segments: { label: string; icon: string; value: number }[] = data.segments;
  const opacities = [0.6, 0.4, 0.25, 0.15];

  let cumulativePct = 0;
  const stops = segments.map((seg, i) => {
    const start = cumulativePct;
    cumulativePct += seg.value;
    return `color-mix(in srgb, var(--foreground) ${Math.round((opacities[i] ?? 0.1) * 100)}%, transparent) ${start}% ${cumulativePct}%`;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex items-center justify-center"
        style={{ width: 100, height: 100 }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(${stops.join(", ")})` }}
        />
        <div className="absolute inset-5 rounded-full bg-background flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">{cityFlag ?? ""}</span>
        </div>
      </div>
      <div className="grid gap-1 w-full">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: `color-mix(in srgb, var(--foreground) ${Math.round((opacities[i] ?? 0.1) * 100)}%, transparent)` }}
            />
            {seg.icon && <span>{seg.icon}</span>}
            <span className="text-muted-foreground flex-1 truncate">{seg.label}</span>
            <span className="font-semibold text-foreground">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PolicyTimeline({ data }: { data: any }) {
  const w = 320;
  const h = 180;
  const padL = 32;
  const padR = 12;
  const padT = 20;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const yearRange = data.endYear - data.startYear;
  const toX = (year: number) => padL + ((year - data.startYear) / yearRange) * chartW;

  const yMin = 40;
  const yMax = 105;
  const toY = (val: number) => padT + ((yMax - val) / (yMax - yMin)) * chartH;

  const curvePoints: { year: number; value: number }[] = data.curve;
  const polyPoints = curvePoints.map((p: { year: number; value: number }) => `${toX(p.year)},${toY(p.value)}`).join(" ");

  const firstPt = curvePoints[0];
  const lastPt = curvePoints[curvePoints.length - 1];
  const areaPath = `M${toX(firstPt.year)},${toY(firstPt.value)} ${curvePoints.map((p: { year: number; value: number }) => `L${toX(p.year)},${toY(p.value)}`).join(" ")} L${toX(lastPt.year)},${toY(yMin)} L${toX(firstPt.year)},${toY(yMin)} Z`;

  const targetValue = 100 - data.targetPct;
  const targetY = toY(targetValue);

  const exceeded = data.currentPct >= data.targetPct;

  const policies: { num: number; year: number; label: string }[] = data.policies;

  const getCurveValueAtYear = (year: number): number => {
    const exact = curvePoints.find((p: { year: number; value: number }) => p.year === year);
    if (exact) return exact.value;
    let before = curvePoints[0];
    let after = curvePoints[curvePoints.length - 1];
    for (let i = 0; i < curvePoints.length - 1; i++) {
      if (curvePoints[i].year <= year && curvePoints[i + 1].year >= year) {
        before = curvePoints[i];
        after = curvePoints[i + 1];
        break;
      }
    }
    const t = (year - before.year) / (after.year - before.year);
    return before.value + t * (after.value - before.value);
  };

  const markerR = 9;

  const xAxisYears = [data.startYear, data.endYear];
  const midYear = Math.round((data.startYear + data.endYear) / 2);
  if (midYear !== data.startYear && midYear !== data.endYear) {
    xAxisYears.splice(1, 0, midYear);
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        {data.metric} {data.unit}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 180 }} preserveAspectRatio="xMidYMid meet">
        <line
          x1={padL} y1={targetY} x2={w - padR} y2={targetY}
          stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"
          className="text-foreground/30"
        />
        <text
          x={w - padR} y={targetY - 4}
          textAnchor="end"
          className="text-foreground/40"
          style={{ fontSize: 8 }}
          fill="currentColor"
        >
          2030 target
        </text>

        <path d={areaPath} fill="currentColor" className="text-foreground/10" />
        <polyline
          points={polyPoints}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/60"
        />

        {policies.map((p: { num: number; year: number; label: string }) => {
          const curveVal = getCurveValueAtYear(p.year);
          const cx = toX(p.year);
          const cy = toY(curveVal);
          const markerCy = cy - markerR - 4;
          return (
            <g key={p.num}>
              <line
                x1={cx} y1={cy} x2={cx} y2={markerCy + markerR}
                stroke="currentColor" strokeWidth="1"
                className="text-foreground/30"
              />
              <circle
                cx={cx} cy={markerCy} r={markerR}
                fill="currentColor"
                className="text-foreground/70"
              />
              <text
                x={cx} y={markerCy + 3.5}
                textAnchor="middle"
                fill="white"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {p.num}
              </text>
            </g>
          );
        })}

        <line
          x1={padL} y1={h - padB} x2={w - padR} y2={h - padB}
          stroke="currentColor" strokeWidth="1"
          className="text-foreground/15"
        />
        {xAxisYears.map((yr: number) => (
          <g key={yr}>
            <line
              x1={toX(yr)} y1={h - padB} x2={toX(yr)} y2={h - padB + 4}
              stroke="currentColor" strokeWidth="1"
              className="text-foreground/20"
            />
            <text
              x={toX(yr)} y={h - padB + 14}
              textAnchor="middle"
              className="text-muted-foreground"
              style={{ fontSize: 9 }}
              fill="currentColor"
            >
              {yr}
            </text>
          </g>
        ))}

        <line
          x1={padL} y1={padT} x2={padL} y2={h - padB}
          stroke="currentColor" strokeWidth="1"
          className="text-foreground/15"
        />
      </svg>

      <div className="grid gap-0.5">
        {policies.map((p: { num: number; year: number; label: string }) => (
          <div key={p.num} className="text-xs text-muted-foreground">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-foreground/70 text-background text-[9px] font-bold mr-1.5 align-middle">
              {p.num}
            </span>
            {p.label} ({p.year})
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground pt-1">
        {exceeded ? (
          <span className="font-semibold text-foreground">
            Current: -{data.currentPct}% · Target: -{data.targetPct}% by 2030 · Target exceeded
          </span>
        ) : (
          <span>
            Current: -{data.currentPct}% · Target: -{data.targetPct}% by 2030
          </span>
        )}
      </div>
    </div>
  );
}

function PhaseIndicator({ data }: { data: any }) {
  const filled = data.phase === "building" ? 1 : data.phase === "established" ? 2 : 3;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-4 h-4 rounded-full border-2 border-foreground/40 ${
              step <= filled ? "bg-foreground/50" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{data.label}</span>
    </div>
  );
}

function FuelMixShift({ data }: { data: any }) {
  const segments = data.segments;
  const opacities = [0.6, 0.4, 0.25, 0.15];

  const renderBar = (label: string, getPct: (seg: any) => number) => (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex h-8 w-full rounded overflow-hidden">
        {segments.map((seg: any, i: number) => (
          <div
            key={i}
            className="h-full first:rounded-l last:rounded-r"
            style={{
              width: `${getPct(seg)}%`,
              background: `color-mix(in srgb, var(--foreground) ${Math.round((opacities[i] ?? 0.1) * 100)}%, transparent)`,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="text-base font-bold text-foreground">{data.headline}</div>
      <div className="space-y-2">
        {renderBar(data.beforeLabel, (seg: any) => seg.beforePct)}
        {renderBar(data.afterLabel, (seg: any) => seg.afterPct)}
      </div>
      <div className="grid gap-1 w-full">
        {segments.map((seg: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: `color-mix(in srgb, var(--foreground) ${Math.round((opacities[i] ?? 0.1) * 100)}%, transparent)` }}
            />
            <span className="text-muted-foreground flex-1 truncate">{seg.label}</span>
            <span className="font-semibold text-foreground">
              {seg.beforePct}% → {seg.afterPct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GreenCorridor({ data }: { data: any }) {
  const w = 240;
  const h = 160;

  const cityOutline = "M120,8 L210,45 L200,120 L40,120 L30,45 Z";

  const roads = [
    "M120,8 L120,120",
    "M210,45 L40,120",
    "M30,45 L200,120",
    "M70,25 L170,115",
    "M170,25 L70,115",
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground">{data.headline}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 160 }}>
        <path d={cityOutline} fill="currentColor" opacity={0.05} stroke="color-mix(in srgb, var(--foreground) 15%, transparent)" strokeWidth="1" />

        {roads.map((d, i) => (
          <path key={`green-${i}`} d={d} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-foreground/25" />
        ))}

        {roads.map((d, i) => (
          <path key={`road-${i}`} d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="text-foreground/30" />
        ))}
      </svg>
      <div className="text-xs text-muted-foreground">
        {data.label} · <span className="font-semibold text-foreground">{data.reduction}</span>
      </div>
    </div>
  );
}

function GreenCoverMap({ data }: { data: any }) {
  const cellSize = 7;
  const gap = 2;

  const cityMaps: Record<string, {
    cols: number; rows: number; riverCol: number;
    mask: number[][]; beforeGreen: number[]; newGreen: number[];
  }> = {
    warsaw: {
      cols: 12, rows: 14, riverCol: 6,
      mask: [
        [0,0,0,0,1,1,0,1,0,0,0,0],
        [0,0,0,1,1,1,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,1,1,1,0,0],
        [0,0,1,1,1,1,0,1,1,1,0,0],
        [0,1,1,1,1,1,0,1,1,1,0,0],
        [0,1,1,1,1,1,0,1,1,1,1,0],
        [0,1,1,1,1,1,0,1,1,1,1,0],
        [1,1,1,1,1,1,0,1,1,1,1,0],
        [1,1,1,1,1,1,0,0,1,1,1,1],
        [1,1,1,1,1,1,0,0,1,1,1,1],
        [0,1,1,1,1,1,0,1,1,1,1,0],
        [0,1,1,1,1,0,0,1,1,1,0,0],
        [0,0,1,1,1,0,1,1,1,0,0,0],
        [0,0,0,1,1,0,1,1,0,0,0,0],
      ],
      beforeGreen: [2*12+3, 3*12+8, 4*12+2, 5*12+4, 5*12+10, 7*12+1, 7*12+5, 7*12+9, 8*12+3, 9*12+8, 10*12+2, 10*12+9, 11*12+4, 12*12+7, 13*12+4],
      newGreen: [1*12+4, 2*12+8, 3*12+3, 3*12+10, 4*12+4, 4*12+9, 5*12+2, 6*12+4, 6*12+8, 6*12+10, 7*12+3, 8*12+5, 8*12+10, 9*12+1, 9*12+4, 9*12+10, 10*12+4, 10*12+7, 11*12+2, 11*12+8, 12*12+3, 12*12+9],
    },
    paris: {
      cols: 12, rows: 10, riverCol: -1,
      mask: [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,1,1,0,0,0,0,0],
      ],
      beforeGreen: [1*12+4, 2*12+2, 2*12+9, 3*12+5, 3*12+10, 4*12+1, 4*12+7, 5*12+3, 5*12+9, 6*12+5, 7*12+2, 7*12+8, 8*12+5],
      newGreen: [1*12+7, 2*12+5, 2*12+7, 3*12+2, 3*12+8, 4*12+4, 4*12+9, 4*12+11, 5*12+1, 5*12+6, 5*12+11, 6*12+2, 6*12+8, 6*12+10, 7*12+4, 7*12+6, 8*12+3, 8*12+7],
    },
  };

  const config = cityMaps[data.city] ?? cityMaps.warsaw;
  const { cols, rows, riverCol, mask, beforeGreen, newGreen: newGreenRaw } = config;

  const validCells: number[] = [];
  mask.forEach((row, r) => row.forEach((v, c) => {
    if (v === 1) validCells.push(r * cols + c);
  }));

  const validBefore = beforeGreen.filter(i => validCells.includes(i));
  const validNew = newGreenRaw.filter(i => validCells.includes(i));
  const afterGreen = [...new Set([...validBefore, ...validNew])];

  const renderGrid = (greenCells: number[], highlightNew?: number[]) => {
    return mask.flatMap((row, r) =>
      row.map((v, c) => {
        if (v === 0) return null;
        const idx = r * cols + c;
        const isNew = highlightNew?.includes(idx) ?? false;
        const isGreen = greenCells.includes(idx);
        return (
          <rect
            key={idx}
            x={c * (cellSize + gap)}
            y={r * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill="currentColor"
            className={isNew ? "text-foreground/50" : isGreen ? "text-foreground/35" : "text-foreground/8"}
          />
        );
      })
    );
  };

  const gridW = cols * (cellSize + gap) - gap;
  const gridH = rows * (cellSize + gap) - gap;
  const panelGap = 24;
  const totalW = gridW * 2 + panelGap;

  const renderRiver = (offsetX: number) => {
    if (riverCol >= 0) {
      const rx = riverCol * (cellSize + gap) + cellSize / 2;
      return <line x1={offsetX + rx} y1={0} x2={offsetX + rx} y2={gridH} stroke="currentColor" strokeWidth={1.5} className="text-foreground/10" />;
    }
    if (data.city === "paris") {
      const seineD = `M${offsetX + gridW * 0.7},${gridH * 0.15} Q${offsetX + gridW * 0.55},${gridH * 0.4} ${offsetX + gridW * 0.45},${gridH * 0.55} Q${offsetX + gridW * 0.35},${gridH * 0.7} ${offsetX + gridW * 0.25},${gridH * 0.85}`;
      return <path d={seineD} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground/10" />;
    }
    return null;
  };

  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-foreground">{data.headline}</div>
      <svg viewBox={`0 0 ${totalW} ${gridH + 18}`} className="w-full" style={{ height: 160 }}>
        <g>
          {renderRiver(0)}
          {renderGrid(validBefore)}
        </g>
        <g transform={`translate(${gridW + panelGap}, 0)`}>
          {renderRiver(0)}
          {renderGrid(afterGreen, validNew)}
        </g>
        <text x={gridW / 2} y={gridH + 12} textAnchor="middle" fill="currentColor" className="text-muted-foreground" style={{ fontSize: 9 }}>
          {data.beforeLabel} · {data.beforePct}%
        </text>
        <text x={gridW + panelGap + gridW / 2} y={gridH + 12} textAnchor="middle" fill="currentColor" className="text-muted-foreground" style={{ fontSize: 9 }}>
          {data.afterLabel} · {data.afterPct}%
        </text>
      </svg>
      <div className="flex items-center justify-end">
        <span className="text-sm font-semibold text-foreground">{data.change}</span>
      </div>
    </div>
  );
}

function TreePlanting({ data }: { data: any }) {
  const total = data.existing + data.added;

  const Tree = ({ muted }: { muted: boolean }) => (
    <svg width="16" height="20" viewBox="0 0 16 20" className={muted ? "text-foreground/15" : "text-foreground/60"}>
      <polygon points="8,2 14,12 2,12" fill="currentColor" />
      <rect x="6.5" y="12" width="3" height="6" rx="0.5" fill="currentColor" />
    </svg>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <Tree key={i} muted={i < data.existing} />
        ))}
      </div>
      <div className="text-sm font-semibold text-foreground">{data.headline}</div>
    </div>
  );
}

function ReachFunnel({ data }: { data: any }) {
  // data shape: { type: "reachFunnel", headline: "2.1M citizens reached", steps: [
  //   { label: "Campaign reach", value: "2.1M", pct: 100 },
  //   { label: "Actively engaged", value: "340K", pct: 16 },
  //   { label: "Behaviour change", value: "85K", pct: 4 },
  // ]}
  const steps: { label: string; value: string; pct: number }[] = data.steps;
  const barOpacities = [60, 40, 25];

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground">{data.headline}</div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-muted-foreground">{step.label}</span>
              <span className="text-xs font-semibold text-foreground">{step.value}</span>
            </div>
            <div className="h-5 w-full rounded bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${step.pct}%`,
                  background: `color-mix(in srgb, var(--foreground) ${barOpacities[i] ?? 20}%, transparent)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityNetwork({ data }: { data: any }) {
  // data shape: { type: "communityNetwork", total: 30, reached: 12, headline: "1.8M engaged in community monitoring", unit: "x 100K" }
  const total = data.total;
  const reached = data.reached;

  const Person = ({ active }: { active: boolean }) => (
    <svg width="14" height="18" viewBox="0 0 14 18" style={{ opacity: active ? 0.7 : 0.15 }}>
      <circle cx="7" cy="4" r="3" fill="currentColor" className="text-foreground" />
      <path d="M1,16 C1,11 4,9 7,9 C10,9 13,11 13,16" fill="currentColor" className="text-foreground" />
    </svg>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <Person key={i} active={i < reached} />
        ))}
      </div>
      <div className="text-sm font-semibold text-foreground">{data.headline}</div>
    </div>
  );
}

function AwarenessTimeline({ data }: { data: any }) {
  // data shape: { type: "awarenessTimeline", metric: "Population aware", startYear: 2007, endYear: 2025,
  //   currentPct: 68,
  //   curve: [{ year: 2007, value: 5 }, { year: 2010, value: 12 }, ...{ year: 2025, value: 68 }],
  //   campaigns: [{ num: 1, year: 2007, label: "Airparif public dashboard" }, ...],
  // }
  const w = 320;
  const h = 180;
  const padL = 32;
  const padR = 12;
  const padT = 20;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const yearRange = data.endYear - data.startYear;
  const toX = (year: number) => padL + ((year - data.startYear) / yearRange) * chartW;

  // Y axis: 0% at bottom, 100% at top
  const toY = (val: number) => padT + ((100 - val) / 100) * chartH;

  const curvePoints: { year: number; value: number }[] = data.curve;
  const polyPoints = curvePoints.map((p: { year: number; value: number }) => `${toX(p.year)},${toY(p.value)}`).join(" ");

  const firstPt = curvePoints[0];
  const lastPt = curvePoints[curvePoints.length - 1];
  const areaPath = `M${toX(firstPt.year)},${toY(firstPt.value)} ${curvePoints.map((p: { year: number; value: number }) => `L${toX(p.year)},${toY(p.value)}`).join(" ")} L${toX(lastPt.year)},${toY(0)} L${toX(firstPt.year)},${toY(0)} Z`;

  const campaigns: { num: number; year: number; label: string }[] = data.campaigns;

  const getCurveValueAtYear = (year: number): number => {
    const exact = curvePoints.find((p: { year: number; value: number }) => p.year === year);
    if (exact) return exact.value;
    let before = curvePoints[0];
    let after = curvePoints[curvePoints.length - 1];
    for (let i = 0; i < curvePoints.length - 1; i++) {
      if (curvePoints[i].year <= year && curvePoints[i + 1].year >= year) {
        before = curvePoints[i];
        after = curvePoints[i + 1];
        break;
      }
    }
    const t = (year - before.year) / (after.year - before.year);
    return before.value + t * (after.value - before.value);
  };

  const markerR = 9;

  const xAxisYears = [data.startYear, data.endYear];
  const midYear = Math.round((data.startYear + data.endYear) / 2);
  if (midYear !== data.startYear && midYear !== data.endYear) {
    xAxisYears.splice(1, 0, midYear);
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">{data.metric}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 180 }} preserveAspectRatio="xMidYMid meet">
        {/* Area fill under curve */}
        <path d={areaPath} fill="currentColor" className="text-foreground/10" />
        {/* Curve line */}
        <polyline points={polyPoints} fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/60" />

        {/* Campaign markers on the curve */}
        {campaigns.map((c: { num: number; year: number; label: string }) => {
          const curveVal = getCurveValueAtYear(c.year);
          const cx = toX(c.year);
          const cy = toY(curveVal);
          const markerCy = cy - markerR - 4;
          return (
            <g key={c.num}>
              <line x1={cx} y1={cy} x2={cx} y2={markerCy + markerR} stroke="currentColor" strokeWidth="1" className="text-foreground/30" />
              <circle cx={cx} cy={markerCy} r={markerR} fill="currentColor" className="text-foreground/70" />
              <text x={cx} y={markerCy + 3.5} textAnchor="middle" fill="white" style={{ fontSize: 10, fontWeight: 700 }}>{c.num}</text>
            </g>
          );
        })}

        {/* X axis */}
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="currentColor" strokeWidth="1" className="text-foreground/15" />
        {xAxisYears.map((yr: number) => (
          <g key={yr}>
            <line x1={toX(yr)} y1={h - padB} x2={toX(yr)} y2={h - padB + 4} stroke="currentColor" strokeWidth="1" className="text-foreground/20" />
            <text x={toX(yr)} y={h - padB + 14} textAnchor="middle" className="text-muted-foreground" style={{ fontSize: 9 }} fill="currentColor">{yr}</text>
          </g>
        ))}

        {/* Y axis */}
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="currentColor" strokeWidth="1" className="text-foreground/15" />

        {/* Current % label at end of curve */}
        <text x={toX(lastPt.year) + 2} y={toY(lastPt.value) - 6} textAnchor="start" fill="currentColor" className="text-foreground/60" style={{ fontSize: 10, fontWeight: 700 }}>{data.currentPct}%</text>
      </svg>

      {/* Campaign legend */}
      <div className="grid gap-0.5">
        {campaigns.map((c: { num: number; year: number; label: string }) => (
          <div key={c.num} className="text-xs text-muted-foreground">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5 align-middle" style={{ background: 'color-mix(in srgb, var(--foreground) 70%, transparent)', color: 'white' }}>{c.num}</span>
            {c.label} ({c.year})
          </div>
        ))}
      </div>

      <div className="text-xs font-semibold text-foreground pt-1">
        {data.currentPct}% population now AQ-aware
      </div>
    </div>
  );
}

function GovernanceStaircase({ data }: { data: any }) {
  // data shape: {
  //   type: "governanceStaircase",
  //   steps: [
  //     { year: 2015, layer: "Municipal AQ office", result: "First monitoring network" },
  //     { year: 2017, layer: "National clean air act", result: "Enforcement powers granted" },
  //     { year: 2019, layer: "Regional coordination", result: "Cross-boundary standards" },
  //     { year: 2022, layer: "Community framework", result: "Citizen reporting +340%" },
  //   ]
  // }
  const steps: { year: number; layer: string; result: string }[] = data.steps;
  const count = steps.length;

  const w = 320;
  const h = 180;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const stepW = chartW / count;
  const stepH = chartH / count;

  // Build staircase path — steps going up from bottom-left to top-right
  let pathD = `M${padL},${h - padB}`;
  steps.forEach((_, i) => {
    const x = padL + i * stepW;
    const y = h - padB - (i + 1) * stepH;
    pathD += ` L${x},${y} L${x + stepW},${y}`;
  });
  // Close the area back down to baseline
  pathD += ` L${padL + chartW},${h - padB} Z`;

  // Staircase outline (just the steps, no bottom close)
  let outlineD = `M${padL},${h - padB}`;
  steps.forEach((_, i) => {
    const x = padL + i * stepW;
    const y = h - padB - (i + 1) * stepH;
    outlineD += ` L${x},${y} L${x + stepW},${y}`;
  });

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 180 }} preserveAspectRatio="xMidYMid meet">
        {/* Area fill */}
        <path d={pathD} fill="currentColor" className="text-foreground/8" />
        {/* Staircase outline */}
        <path d={outlineD} fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/40" />

        {/* Step labels */}
        {steps.map((step, i) => {
          const x = padL + i * stepW + stepW / 2;
          const y = h - padB - (i + 1) * stepH;
          return (
            <g key={i}>
              {/* Numbered circle at the step corner */}
              <circle
                cx={padL + i * stepW + 2}
                cy={y}
                r={8}
                fill="currentColor"
                className="text-foreground/70"
              />
              <text
                x={padL + i * stepW + 2}
                y={y + 3.5}
                textAnchor="middle"
                fill="white"
                style={{ fontSize: 9, fontWeight: 700 }}
              >
                {i + 1}
              </text>

              {/* Year below the step */}
              <text
                x={padL + i * stepW + stepW / 2}
                y={h - padB + 14}
                textAnchor="middle"
                fill="currentColor"
                className="text-muted-foreground"
                style={{ fontSize: 8 }}
              >
                {step.year}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="currentColor" strokeWidth="1" className="text-foreground/15" />
      </svg>

      {/* Result legend below */}
      <div className="grid gap-0.5">
        {steps.map((step, i) => (
          <div key={i} className="text-xs text-muted-foreground">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5 align-middle"
              style={{ background: 'color-mix(in srgb, var(--foreground) 70%, transparent)', color: 'white' }}
            >
              {i + 1}
            </span>
            {step.layer} — <span className="text-foreground font-medium">{step.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** FundingProgression — horizontal step flow showing how domain achievements built the case for investment */
function FundingProgression({ data }: { data: any }) {
  // data: { type: "fundingProgression", steps: [{ pillar: "Seeing", label: "...", year: 2013 }, ...], outcome: "..." }
  const PILLAR_COLORS: Record<string, string> = {
    "Seeing": "color-mix(in srgb, var(--foreground) 60%, transparent)",
    "Understanding": "color-mix(in srgb, var(--foreground) 45%, transparent)",
    "Acting": "color-mix(in srgb, var(--foreground) 30%, transparent)",
  };

  const steps: { pillar: string; label: string; year: number }[] = data.steps;

  return (
    <div className="space-y-3">
      {/* Horizontal step flow */}
      <div className="flex items-stretch gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 flex flex-col">
            <div
              className="h-2 rounded-full mb-2"
              style={{ background: PILLAR_COLORS[step.pillar] ?? 'color-mix(in srgb, var(--foreground) 20%, transparent)' }}
            />
            <div className="text-[10px] font-semibold text-foreground">{step.pillar}</div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.label}</div>
            <div className="text-[10px] text-muted-foreground mt-auto pt-1">{step.year}</div>
          </div>
        ))}
        {/* Final "funding" step */}
        <div className="flex-1 flex flex-col">
          <div
            className="h-2 rounded-full mb-2"
            style={{ background: 'color-mix(in srgb, var(--foreground) 15%, transparent)' }}
          />
          <div className="text-[10px] font-semibold text-foreground">→ Funding</div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">Investment follows results</div>
        </div>
      </div>

      {/* Outcome line */}
      <div className="text-xs text-muted-foreground border-t pt-2" style={{ borderColor: 'color-mix(in srgb, var(--foreground) 10%, transparent)' }}>
        {data.outcome}
      </div>
    </div>
  );
}

/** OutcomeHighlight — big outcome number with label and context line for outcome-focused cards */
function OutcomeHighlight({ data }: { data: any }) {
  // data: { type: "outcomeHighlight", value: "700", label: "...", context: "..." }
  return (
    <div className="flex flex-col items-center text-center gap-1.5 py-4">
      <div className="text-3xl font-bold text-foreground">{data.value}</div>
      <div className="text-sm text-muted-foreground max-w-[200px]">{data.label}</div>
      {data.context && (
        <div className="text-[10px] text-muted-foreground mt-1 max-w-[220px]">{data.context}</div>
      )}
    </div>
  );
}

function InvestmentROI({ data }: { data: any }) {
  // data shape: {
  //   type: "investmentROI",
  //   investment: "€1.2B",
  //   investmentLabel: "Total AQ investment 2015–2024",
  //   allocations: [
  //     { label: "Transport & LEZ infrastructure", pct: 45 },
  //     { label: "Monitoring network", pct: 20 },
  //     { label: "Green infrastructure", pct: 25 },
  //     { label: "Awareness & engagement", pct: 10 },
  //   ],
  //   result: "-42% PM2.5",
  //   resultLabel: "Measurable air quality improvement",
  // }
  const allocations: { label: string; pct: number }[] = data.allocations;
  const opacities = [60, 45, 30, 18];

  return (
    <div className="space-y-3">
      {/* Investment amount — big number */}
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{data.investment}</div>
        <div className="text-xs text-muted-foreground">{data.investmentLabel}</div>
      </div>

      {/* Down arrow */}
      <div className="flex justify-center">
        <svg width="16" height="20" viewBox="0 0 16 20">
          <path d="M8,0 L8,14 M2,10 L8,16 L14,10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/30" />
        </svg>
      </div>

      {/* Allocation bar + legend */}
      <div className="space-y-1.5">
        <div className="flex h-5 w-full rounded overflow-hidden">
          {allocations.map((a, i) => (
            <div
              key={i}
              className="h-full"
              style={{
                width: `${a.pct}%`,
                background: `color-mix(in srgb, var(--foreground) ${opacities[i] ?? 15}%, transparent)`,
              }}
            />
          ))}
        </div>
        <div className="grid gap-0.5">
          {allocations.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: `color-mix(in srgb, var(--foreground) ${opacities[i] ?? 15}%, transparent)` }}
              />
              <span className="text-muted-foreground flex-1 truncate">{a.label}</span>
              <span className="font-semibold text-foreground">{a.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Down arrow */}
      <div className="flex justify-center">
        <svg width="16" height="20" viewBox="0 0 16 20">
          <path d="M8,0 L8,14 M2,10 L8,16 L14,10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/30" />
        </svg>
      </div>

      {/* Result — bold outcome */}
      <div className="text-center rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--foreground) 8%, transparent)' }}>
        <div className="text-xl font-bold text-foreground">{data.result}</div>
        <div className="text-xs text-muted-foreground">{data.resultLabel}</div>
      </div>
    </div>
  );
}

/**
 * ChartViz — shared chart dispatcher. Routes a chartData blob to the matching
 * visualisation component based on its `type` field. Exported so sibling components
 * in this folder (PracticeCardHero) can reuse the same chart catalogue without
 * duplicating the switch.
 */
export function ChartViz({ data, cityFlag }: { data: any; cityFlag?: string }) {
  if (!data) return null;
  switch (data.type) {
    case "deltaBar":
      return <DeltaBar data={data} />;
    case "groupedBar":
      return <GroupedBar data={data} />;
    case "sourceDonut":
      return <SourceDonut data={data} cityFlag={cityFlag} />;
    case "sparkline":
      return <Sparkline data={data} />;
    case "doubleRing":
      return <DoubleRing data={data} />;
    case "coverageRing":
      return <CoverageRing data={data} />;
    case "policyTimeline":
      return <PolicyTimeline data={data} />;
    case "fuelMixShift":
      return <FuelMixShift data={data} />;
    case "phase":
      return <PhaseIndicator data={data} />;
    case "greenCorridor":
      return <GreenCorridor data={data} />;
    case "greenCoverMap":
      return <GreenCoverMap data={data} />;
    case "treePlanting":
      return <TreePlanting data={data} />;
    case "reachFunnel":
      return <ReachFunnel data={data} />;
    case "communityNetwork":
      return <CommunityNetwork data={data} />;
    case "awarenessTimeline":
      return <AwarenessTimeline data={data} />;
    case "governanceStaircase":
      return <GovernanceStaircase data={data} />;
    case "fundingProgression":
      return <FundingProgression data={data} />;
    case "investmentROI":
      return <InvestmentROI data={data} />;
    case "outcomeHighlight":
      return <OutcomeHighlight data={data} />;
    default:
      return null;
  }
}

function CityExampleRow({
  example,
  linkCities,
}: {
  example: CityExample;
  linkCities: boolean;
}) {
  const city = getCityBySlug(example.citySlug);
  if (!city) return null;

  const cityLabel = (
    <span className="font-medium text-foreground">
      {city.flag} {city.name}
    </span>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {linkCities ? (
          <Link
            href={`/ux-concepts/best-practice-roadmap-v2/city/${city.slug}`}
            className="underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-foreground"
          >
            {cityLabel}
          </Link>
        ) : (
          cityLabel
        )}
        <span className="text-muted-foreground">&middot;</span>
        <span className="text-xs text-muted-foreground">{city.populationLabel}</span>
      </div>

      {example.chartData && (
        <div className="rounded-lg bg-muted/30 p-4">
          <ChartViz data={example.chartData} cityFlag={city.flag} />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {example.interventionName}
        {example.introducedYear !== "ongoing" && `, introduced ${example.introducedYear}`}
        {example.introducedYear === "ongoing" && ", ongoing"}
      </p>
    </div>
  );
}

export function PracticeCardView({
  practice,
  // wireframe-lock-2026-05-26 client-share build: city/[slug] detail route was
  // removed (depends on the live OpenAQ map). Default flipped to false so the
  // city-name renders as an inert label. Inert path was already coded in
  // CityExampleRow (see below). No new copy, no new visual treatment.
  linkCities = false,
  anchorId,
}: PracticeCardViewProps) {
  const domain = getDomainById(practice.domainId);

  return (
    <Card id={anchorId} className="scroll-mt-16">
      <CardHeader>
        <CardTitle className="text-base">{practice.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          {domain && (
            <Link
              href={`/ux-concepts/best-practice-roadmap-v2/domain/${domain.slug}`}
              className="hover:underline"
            >
              <Badge variant="outline" className="text-xs">
                {domain.shortName}
              </Badge>
            </Link>
          )}
          {domain && <StageBadge stage={domain.stage} />}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{practice.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {practice.totalPopulationImpacted} people impacted
          </span>
          <span>&middot;</span>
          <span>
            {practice.cityCount} {practice.cityCount === 1 ? "city" : "cities"}
          </span>
        </div>

        <Separator />

        <div className="space-y-5">
          {practice.cityExamples.map((example) => (
            <CityExampleRow
              key={example.citySlug}
              example={example}
              linkCities={linkCities}
            />
          ))}
        </div>

        {practice.relatedPracticeIds.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Related:</span>
              {practice.relatedPracticeIds.map((relId) => {
                const related = getPracticeById(relId);
                if (!related) return null;
                const relDomain = getDomainById(related.domainId);
                return (
                  <Link
                    key={relId}
                    href={`/ux-concepts/best-practice-roadmap-v2/domain/${relDomain?.slug ?? ""}`}
                    className="underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-foreground text-foreground"
                  >
                    {related.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * PracticeCardTileProps — props for the compact tile used on homepage and domain pages.
 * layout: "vertical" stacks city info above chart (domain pages),
 *         "horizontal" places info left and chart right (homepage).
 */
interface PracticeCardTileProps {
  practice: PracticeCard;
  example: CityExample;
  linkCity?: boolean;
  showDomainTag?: boolean;
  layout?: "horizontal" | "vertical";
}

/**
 * PracticeCardTile — compact card showing one city example for a practice.
 * Content order: city flag+name+country, population, intervention+year, chart viz.
 * Two layout modes controlled by the layout prop.
 */
export function PracticeCardTile({
  practice,
  example,
  // wireframe-lock-2026-05-26 client-share build: city/[slug] detail route was
  // removed. Default flipped to false; the inert-label path (line ~1370) was
  // already coded into the tile.
  linkCity = false,
  showDomainTag = false,
  layout = "vertical",
}: PracticeCardTileProps) {
  const city = getCityBySlug(example.citySlug);
  const domain = getDomainById(practice.domainId);
  if (!city) return null;

  /* City info block — context-dependent content.
   * showDomainTag=true (city pages): domain tag linking to domain page, intervention+year.
   * showDomainTag=false (default, homepage/domain pages): city flag+name+country, population,
   *   intervention+year. linkCity controls whether the city name is a clickable link. */
  const cityInfoBlock = showDomainTag ? (
    <div className="space-y-1">
      {/* Domain tag linking to domain page */}
      {domain && (
        <Link href={`/ux-concepts/best-practice-roadmap-v2/domain/${domain.slug}`}>
          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            {domain.shortName}
          </Badge>
        </Link>
      )}

      <div className="pt-1">
        <div className="text-sm text-foreground">
          {example.interventionName}
        </div>
        <div className="text-xs text-muted-foreground">
          {example.introducedYear !== "ongoing"
            ? `Introduced ${example.introducedYear}`
            : "Ongoing"}
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-1">
      {linkCity ? (
        <Link
          href={`/ux-concepts/best-practice-roadmap-v2/city/${city.slug}`}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {city.flag} {city.name}, {city.country}
        </Link>
      ) : (
        <span className="text-sm font-semibold text-foreground">
          {city.flag} {city.name}, {city.country}
        </span>
      )}

      <div className="text-xs text-muted-foreground">
        {city.populationLabel} population
      </div>

      <div className="pt-1">
        <div className="text-sm text-foreground">
          {example.interventionName}
        </div>
        <div className="text-xs text-muted-foreground">
          {example.introducedYear !== "ongoing"
            ? `Introduced ${example.introducedYear}`
            : "Ongoing"}
        </div>
      </div>
    </div>
  );

  /* Chart viz block — shared between both layouts */
  const chartBlock = example.chartData ? (
    <div className="rounded-lg bg-muted/30 p-3" style={{ minHeight: 140 }}>
      <ChartViz data={example.chartData} cityFlag={city.flag} />
    </div>
  ) : null;

  if (layout === "horizontal") {
    return (
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col sm:flex-row h-full gap-4 pt-5">
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {cityInfoBlock}
          </div>
          {chartBlock && (
            <div className="sm:w-[280px] flex-shrink-0">
              {chartBlock}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  /* Vertical layout (default) — city info on top, chart below */
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col h-full gap-3 pt-5">
        {cityInfoBlock}
        {chartBlock}
      </CardContent>
    </Card>
  );
}
