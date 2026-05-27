/**
 * toolkit-data.ts -- Static illustrative data for the JTBD City Toolkit dashboard
 *
 * Purpose: Per-city data powering all 8 tool panels in the toolkit concept.
 * Each city has a different profile — active/dim panels, sensor counts,
 * source breakdowns, AQI values, forecasts, alerts, actions, and data samples.
 * All data is illustrative (not live) to support the v0 sketch.
 *
 * Key exports: CITIES, TOOL_LABELS, type CityData, type ToolId
 * External dependencies: none
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Identifiers for the 8 tool panels */
export type ToolId =
  | "monitoring"
  | "benchmarking"
  | "sourceId"
  | "forecasting"
  | "health"
  | "advocacy"
  | "action"
  | "openData";

/** AQI severity level — maps to BC semantic AQI tokens */
export type AqiLevel =
  | "good"
  | "moderate"
  | "unhealthy"
  | "very-unhealthy"
  | "hazardous"
  | "extreme";

/** A single sensor dot for the monitoring map sketch */
export interface SensorDot {
  x: number; // 0-100 percentage position within map rectangle
  y: number;
  level: AqiLevel;
}

/** Source breakdown segment for the donut/bar chart */
export interface SourceSegment {
  label: string;
  percent: number;
  /** CSS custom property name for the segment colour */
  color: string;
}

/** A single day in the 14-day forecast timeline */
export interface ForecastDay {
  label: string; // e.g. "Mon", "Tue"
  level: AqiLevel;
  isFuture: boolean;
}

/** A health/education alert card */
export interface AlertCard {
  severity: "green" | "amber" | "red";
  text: string;
}

/** An action item card */
export interface ActionCard {
  text: string;
  /** Simple text label for the icon placeholder */
  iconLabel: string;
}

/** A row in the open data table */
export interface DataRow {
  station: string;
  pm25: number;
  timestamp: string;
}

/** Per-tool status: active, partial, or dim */
export type ToolStatus = "active" | "partial" | "dim";

/** The reason shown when a panel is dim or partial */
export type DimReason = string;

/** Complete data for one city across all 8 tools */
export interface CityData {
  slug: string;
  name: string;
  country: string;
  stationCount: number;
  stationTypes: string;
  densityMessage: string;

  /** Per-tool status and dim reasons */
  toolStatus: Record<ToolId, ToolStatus>;
  dimReasons: Partial<Record<ToolId, DimReason>>;

  /** Tool 1: Monitoring — sensor dots on the map sketch */
  sensors: SensorDot[];

  /** Tool 2: Benchmarking — gauge values */
  currentAqi: number;
  whoGuideline: number;
  nationalStandard: number;
  nationalStandardLabel: string;

  /** Tool 3: Source ID — breakdown segments */
  sources: SourceSegment[];

  /** Tool 4: Forecasting — 14-day timeline */
  forecast: ForecastDay[];

  /** Tool 5: Health — alert cards */
  alerts: AlertCard[];

  /** Tool 6: Advocacy — trend narrative */
  trendYears: number;
  trendDirection: "improving" | "stable" | "worsening";
  trendStat: string;
  /** 6 values representing the trend line (normalised 0-100) */
  trendLine: number[];

  /** Tool 7: Action — action cards */
  actions: ActionCard[];

  /** Tool 8: Open Data — table rows and API endpoint */
  dataRows: DataRow[];
  apiEndpoint: string;
}

/* ------------------------------------------------------------------ */
/*  Tool labels                                                        */
/* ------------------------------------------------------------------ */

/** Human-readable labels for each tool panel */
export const TOOL_LABELS: Record<ToolId, string> = {
  monitoring: "Real-time Monitoring",
  benchmarking: "Standards Benchmarking",
  sourceId: "Source Identification",
  forecasting: "Forecasting",
  health: "Health & Education",
  advocacy: "Advocacy & Storytelling",
  action: "Action & Behaviour Change",
  openData: "Open Data Access",
};

/* ------------------------------------------------------------------ */
/*  Helper: generate semi-random sensor dots                           */
/* ------------------------------------------------------------------ */

function generateSensors(count: number, bias: AqiLevel): SensorDot[] {
  const dots: SensorDot[] = [];
  const levels: AqiLevel[] = ["good", "moderate", "unhealthy", "very-unhealthy"];
  // Use deterministic pseudo-positions based on index
  for (let i = 0; i < count; i++) {
    const x = ((i * 37 + 13) % 90) + 5;
    const y = ((i * 53 + 7) % 85) + 7;
    // Bias toward the specified level
    let level: AqiLevel;
    if (i % 4 === 0) {
      level = bias;
    } else if (i % 4 === 1) {
      level = levels[(levels.indexOf(bias) + 1) % levels.length];
    } else if (i % 4 === 2) {
      level = bias;
    } else {
      level = levels[Math.abs(levels.indexOf(bias) - 1)];
    }
    dots.push({ x, y, level });
  }
  return dots;
}

/* ------------------------------------------------------------------ */
/*  Helper: generate a 14-day forecast                                 */
/* ------------------------------------------------------------------ */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateForecast(pattern: AqiLevel[]): ForecastDay[] {
  const days: ForecastDay[] = [];
  for (let i = 0; i < 14; i++) {
    days.push({
      label: DAY_LABELS[i % 7],
      level: pattern[i % pattern.length],
      isFuture: i >= 7,
    });
  }
  return days;
}

/* ------------------------------------------------------------------ */
/*  City data                                                          */
/* ------------------------------------------------------------------ */

export const CITIES: CityData[] = [
  /* ---- London ---- */
  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    stationCount: 200,
    stationTypes: "reference-grade + low-cost (Breathe London)",
    densityMessage: "Dense monitoring network enables all toolkit capabilities",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "active",
      forecasting: "active",
      health: "active",
      advocacy: "active",
      action: "active",
      openData: "active",
    },
    dimReasons: {},
    sensors: generateSensors(60, "good"),
    currentAqi: 32,
    whoGuideline: 15,
    nationalStandard: 25,
    nationalStandardLabel: "UK annual limit",
    sources: [
      { label: "Transport", percent: 50, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 12, color: "var(--bc-color-steel)" },
      { label: "Residential", percent: 15, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 13, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["good", "good", "moderate", "good", "good", "moderate", "good", "good", "moderate", "good", "good", "good", "moderate", "good"]),
    alerts: [
      { severity: "green", text: "3,500+ schools enrolled in daily AQ alerts" },
      { severity: "amber", text: "Sensitive groups: limit prolonged outdoor activity today" },
      { severity: "green", text: "Air quality is generally good across the network" },
    ],
    trendYears: 5,
    trendDirection: "improving",
    trendStat: "NO2 reduced 21% since ULEZ launch",
    trendLine: [80, 72, 60, 50, 42, 38],
    actions: [
      { text: "Clean air walking route available", iconLabel: "Route" },
      { text: "Switch from diesel -- see impact calculator", iconLabel: "Switch" },
      { text: "Car-free day: next Sunday", iconLabel: "Calendar" },
    ],
    dataRows: [
      { station: "Marylebone Road", pm25: 28, timestamp: "2026-05-23 09:00" },
      { station: "Brixton", pm25: 14, timestamp: "2026-05-23 09:00" },
      { station: "Tower Hamlets", pm25: 22, timestamp: "2026-05-23 09:00" },
      { station: "Kensington", pm25: 11, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "api.breathelondon.org/v1/stations",
  },

  /* ---- Paris ---- */
  {
    slug: "paris",
    name: "Paris",
    country: "France",
    stationCount: 70,
    stationTypes: "reference-grade (Airparif) + mobile sensing (Pollutrack)",
    densityMessage: "Strong statutory network with mobile sensing layer",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "partial",
      forecasting: "active",
      health: "active",
      advocacy: "active",
      action: "active",
      openData: "dim",
    },
    dimReasons: {
      sourceId: "Requires granular source apportionment study",
      openData: "Requires open data API infrastructure",
    },
    sensors: generateSensors(35, "moderate"),
    currentAqi: 38,
    whoGuideline: 15,
    nationalStandard: 25,
    nationalStandardLabel: "EU annual limit",
    sources: [
      { label: "Transport", percent: 40, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 15, color: "var(--bc-color-steel)" },
      { label: "Residential", percent: 18, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 15, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 12, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["moderate", "good", "good", "moderate", "moderate", "good", "good", "moderate", "good", "moderate", "good", "good", "moderate", "good"]),
    alerts: [
      { severity: "amber", text: "Circulation differenciee may activate tomorrow" },
      { severity: "green", text: "School air quality notifications active via Airparif" },
    ],
    trendYears: 5,
    trendDirection: "improving",
    trendStat: "NO2 near major roads fell ~30% (2012-2022)",
    trendLine: [85, 75, 65, 55, 50, 45],
    actions: [
      { text: "ZFE: check your vehicle eligibility", iconLabel: "Check" },
      { text: "Paris Respire car-free zones open today", iconLabel: "Route" },
      { text: "Journee sans voiture: annual car-free day", iconLabel: "Calendar" },
    ],
    dataRows: [
      { station: "Champs-Elysees", pm25: 35, timestamp: "2026-05-23 09:00" },
      { station: "Place de la Nation", pm25: 22, timestamp: "2026-05-23 09:00" },
      { station: "Gennevilliers", pm25: 18, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "data-airparif.opendata.arcgis.com/api",
  },

  /* ---- Bogota ---- */
  {
    slug: "bogota",
    name: "Bogota",
    country: "Colombia",
    stationCount: 20,
    stationTypes: "reference-grade (RMCAB)",
    densityMessage: "Established reference network with forecast capability",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "dim",
      forecasting: "active",
      health: "active",
      advocacy: "active",
      action: "active",
      openData: "partial",
    },
    dimReasons: {
      sourceId: "Requires detailed source apportionment study",
      openData: "Partial -- limited open API access",
    },
    sensors: generateSensors(20, "moderate"),
    currentAqi: 52,
    whoGuideline: 15,
    nationalStandard: 37,
    nationalStandardLabel: "Colombia annual limit",
    sources: [
      { label: "Transport", percent: 35, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 20, color: "var(--bc-color-steel)" },
      { label: "Residential", percent: 15, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 20, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["moderate", "moderate", "unhealthy", "moderate", "good", "moderate", "moderate", "moderate", "unhealthy", "moderate", "moderate", "good", "moderate", "moderate"]),
    alerts: [
      { severity: "amber", text: "Contingencia Ambiental protocols may activate" },
      { severity: "green", text: "Ciclovia routes open this Sunday -- reduced exposure" },
    ],
    trendYears: 5,
    trendDirection: "improving",
    trendStat: "24% reduction in air pollution 2018-2024",
    trendLine: [90, 80, 72, 65, 55, 48],
    actions: [
      { text: "Ciclovia: 550km+ of cycle routes every Sunday", iconLabel: "Route" },
      { text: "TransMilenio BRT -- lower-emission commute", iconLabel: "Transit" },
      { text: "ZUMA clean air zone: check your neighbourhood", iconLabel: "Map" },
    ],
    dataRows: [
      { station: "Kennedy", pm25: 48, timestamp: "2026-05-23 09:00" },
      { station: "Las Ferias", pm25: 35, timestamp: "2026-05-23 09:00" },
      { station: "Usaquen", pm25: 22, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "oab.ambientebogota.gov.co/api",
  },

  /* ---- Warsaw ---- */
  {
    slug: "warsaw",
    name: "Warsaw",
    country: "Poland",
    stationCount: 164,
    stationTypes: "reference-grade (GIOS) + Airly low-cost sensors",
    densityMessage: "Europe's largest urban AQ sensor deployment (Airly)",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "dim",
      forecasting: "partial",
      health: "active",
      advocacy: "active",
      action: "active",
      openData: "partial",
    },
    dimReasons: {
      sourceId: "Requires city-level source apportionment study",
      forecasting: "Partial -- national forecasting only, no city-specific model",
      openData: "Partial -- data via Airly platform, no unified open API",
    },
    sensors: generateSensors(50, "moderate"),
    currentAqi: 45,
    whoGuideline: 15,
    nationalStandard: 25,
    nationalStandardLabel: "EU annual limit",
    sources: [
      { label: "Heating", percent: 45, color: "var(--bc-color-amber)" },
      { label: "Transport", percent: 25, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 15, color: "var(--bc-color-steel)" },
      { label: "Dust/natural", percent: 10, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 5, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["moderate", "moderate", "good", "moderate", "unhealthy", "moderate", "good", "moderate", "good", "moderate", "moderate", "good", "moderate", "good"]),
    alerts: [
      { severity: "amber", text: "Smog alert active -- heating season advisory" },
      { severity: "green", text: "Warsaw 19115 app notifications enabled" },
    ],
    trendYears: 5,
    trendDirection: "improving",
    trendStat: "National coal ban + boiler subsidies: 20% reduction in premature deaths",
    trendLine: [95, 85, 70, 60, 50, 42],
    actions: [
      { text: "Check your boiler eligibility for replacement subsidy", iconLabel: "Check" },
      { text: "LEZ: verify your vehicle access to centre", iconLabel: "Zone" },
      { text: "Polish Smog Alert -- report local violations", iconLabel: "Report" },
    ],
    dataRows: [
      { station: "Komunikacyjna", pm25: 42, timestamp: "2026-05-23 09:00" },
      { station: "Krucza", pm25: 28, timestamp: "2026-05-23 09:00" },
      { station: "Ursynow", pm25: 19, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "airly.org/api/v2/measurements",
  },

  /* ---- Bangkok ---- */
  {
    slug: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    stationCount: 68,
    stationTypes: "reference-grade (PCD/BMA)",
    densityMessage: "Dense government network with real-time public dashboard",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "active",
      forecasting: "dim",
      health: "active",
      advocacy: "dim",
      action: "active",
      openData: "partial",
    },
    dimReasons: {
      forecasting: "Requires city-specific forecast model",
      advocacy: "Requires sustained multi-year trend data",
      openData: "Partial -- data via BMA dashboard, no unified open API",
    },
    sensors: generateSensors(34, "unhealthy"),
    currentAqi: 78,
    whoGuideline: 15,
    nationalStandard: 37,
    nationalStandardLabel: "Thailand annual limit",
    sources: [
      { label: "Transport", percent: 30, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 25, color: "var(--bc-color-steel)" },
      { label: "Agri burning", percent: 20, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 15, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["unhealthy", "moderate", "moderate", "unhealthy", "moderate", "unhealthy", "moderate", "unhealthy", "moderate", "unhealthy", "moderate", "moderate", "unhealthy", "moderate"]),
    alerts: [
      { severity: "red", text: "PM2.5 control zone declaration in effect" },
      { severity: "amber", text: "Sensitive groups should avoid outdoor exercise" },
    ],
    trendYears: 3,
    trendDirection: "stable",
    trendStat: "Emissions inventory completed 2024 -- baseline established",
    trendLine: [75, 78, 80, 72, 75, 73],
    actions: [
      { text: "Bangkok E-Bus: 2,350+ electric buses on 124 routes", iconLabel: "Transit" },
      { text: "LEZ pilot zone -- check truck route restrictions", iconLabel: "Zone" },
      { text: "Euro 5 standards now in effect for new vehicles", iconLabel: "Check" },
    ],
    dataRows: [
      { station: "Din Daeng", pm25: 72, timestamp: "2026-05-23 09:00" },
      { station: "Thonburi", pm25: 58, timestamp: "2026-05-23 09:00" },
      { station: "Bang Khen", pm25: 45, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "pcd.go.th/api/v1/stations",
  },

  /* ---- Mexico City ---- */
  {
    slug: "mexico-city",
    name: "Mexico City",
    country: "Mexico",
    stationCount: 40,
    stationTypes: "reference-grade (SIMAT/RAMA)",
    densityMessage: "One of the oldest and most comprehensive networks in Latin America",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "dim",
      forecasting: "partial",
      health: "active",
      advocacy: "dim",
      action: "active",
      openData: "partial",
    },
    dimReasons: {
      sourceId: "Requires updated source apportionment study",
      forecasting: "Partial -- episode forecasting only (Contingencia Ambiental)",
      advocacy: "Requires sustained multi-year trend narrative",
      openData: "Partial -- RAMA data available but no unified API",
    },
    sensors: generateSensors(25, "moderate"),
    currentAqi: 65,
    whoGuideline: 15,
    nationalStandard: 45,
    nationalStandardLabel: "Mexico annual limit",
    sources: [
      { label: "Transport", percent: 35, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 25, color: "var(--bc-color-steel)" },
      { label: "Residential", percent: 10, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 20, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["moderate", "unhealthy", "moderate", "moderate", "good", "moderate", "unhealthy", "moderate", "moderate", "unhealthy", "moderate", "good", "moderate", "moderate"]),
    alerts: [
      { severity: "red", text: "Contingencia Ambiental: Phase I may activate" },
      { severity: "amber", text: "Hoy No Circula restrictions in effect today" },
    ],
    trendYears: 5,
    trendDirection: "stable",
    trendStat: "Lead, SO2, CO dramatically reduced over 30 years",
    trendLine: [70, 68, 65, 62, 63, 60],
    actions: [
      { text: "Hoy No Circula: check if your plate is restricted today", iconLabel: "Check" },
      { text: "Ecobici: 480+ bike-share stations available", iconLabel: "Route" },
      { text: "Verificacion Vehicular: book your emissions test", iconLabel: "Calendar" },
    ],
    dataRows: [
      { station: "Pedregal", pm25: 55, timestamp: "2026-05-23 09:00" },
      { station: "Tlalnepantla", pm25: 68, timestamp: "2026-05-23 09:00" },
      { station: "Merced", pm25: 42, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "aire.cdmx.gob.mx/api/v1",
  },

  /* ---- Brussels ---- */
  {
    slug: "brussels",
    name: "Brussels",
    country: "Belgium",
    stationCount: 18,
    stationTypes: "reference-grade (IRCEL-CELINE) + citizen science",
    densityMessage: "Reference network augmented by citizen science campaigns",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "dim",
      forecasting: "active",
      health: "active",
      advocacy: "partial",
      action: "partial",
      openData: "dim",
    },
    dimReasons: {
      sourceId: "Requires detailed source apportionment study",
      advocacy: "Partial -- citizen science stories available",
      action: "Partial -- limited behavioural interventions",
      openData: "Requires open data API infrastructure",
    },
    sensors: generateSensors(15, "good"),
    currentAqi: 28,
    whoGuideline: 15,
    nationalStandard: 25,
    nationalStandardLabel: "EU annual limit",
    sources: [
      { label: "Transport", percent: 40, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 15, color: "var(--bc-color-steel)" },
      { label: "Residential", percent: 20, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 15, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["good", "good", "moderate", "good", "good", "good", "moderate", "good", "good", "moderate", "good", "good", "good", "moderate"]),
    alerts: [
      { severity: "green", text: "BelAir app: real-time data and 48-hour forecast" },
      { severity: "green", text: "School streets programme active in your zone" },
    ],
    trendYears: 4,
    trendDirection: "improving",
    trendStat: "CurieuzenAir: 3,000 simultaneous NO2 measurements mapped",
    trendLine: [55, 48, 42, 38, 35, 30],
    actions: [
      { text: "Good Move: car-free zones expanding", iconLabel: "Route" },
      { text: "LEZ: check your diesel vehicle eligibility", iconLabel: "Check" },
    ],
    dataRows: [
      { station: "Arts-Loi", pm25: 24, timestamp: "2026-05-23 09:00" },
      { station: "Uccle", pm25: 16, timestamp: "2026-05-23 09:00" },
      { station: "Molenbeek", pm25: 30, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "geo.irceline.be/sos/api/v1",
  },

  /* ---- Milan ---- */
  {
    slug: "milan",
    name: "Milan",
    country: "Italy",
    stationCount: 15,
    stationTypes: "reference-grade (ARPA Lombardia)",
    densityMessage: "Regional reference stations covering the Po Valley",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "dim",
      forecasting: "dim",
      health: "dim",
      advocacy: "dim",
      action: "active",
      openData: "dim",
    },
    dimReasons: {
      sourceId: "Requires city-specific source apportionment study",
      forecasting: "Requires city-specific forecast model",
      health: "Requires health alert integration",
      advocacy: "Requires sustained multi-year trend narrative",
      openData: "Requires open data API infrastructure",
    },
    sensors: generateSensors(12, "moderate"),
    currentAqi: 55,
    whoGuideline: 15,
    nationalStandard: 25,
    nationalStandardLabel: "EU annual limit",
    sources: [
      { label: "Transport", percent: 35, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 25, color: "var(--bc-color-steel)" },
      { label: "Heating", percent: 25, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 10, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 5, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["moderate", "moderate", "unhealthy", "moderate", "moderate", "good", "moderate", "moderate", "moderate", "unhealthy", "moderate", "good", "moderate", "moderate"]),
    alerts: [
      { severity: "amber", text: "Po Valley inversion conditions expected" },
    ],
    trendYears: 3,
    trendDirection: "stable",
    trendStat: "Area C congestion charge: black carbon -30%",
    trendLine: [60, 58, 55, 52, 53, 50],
    actions: [
      { text: "Area B (LEZ): check if your diesel is eligible", iconLabel: "Zone" },
      { text: "Area C congestion charge zone active", iconLabel: "Check" },
      { text: "Strade Aperte: 35km new cycle lanes open", iconLabel: "Route" },
    ],
    dataRows: [
      { station: "Citta Studi", pm25: 48, timestamp: "2026-05-23 09:00" },
      { station: "Senato", pm25: 35, timestamp: "2026-05-23 09:00" },
      { station: "Marche", pm25: 52, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "arpalombardia.it/api/v1/aria",
  },

  /* ---- Sofia ---- */
  {
    slug: "sofia",
    name: "Sofia",
    country: "Bulgaria",
    stationCount: 862,
    stationTypes: "citizen sensors (AirSofia.info) + 5 reference (MOEW)",
    densityMessage: "Highest density of citizen AQ sensors in Europe (862 locations)",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "active",
      forecasting: "dim",
      health: "dim",
      advocacy: "partial",
      action: "active",
      openData: "dim",
    },
    dimReasons: {
      forecasting: "Requires city-specific forecast model",
      health: "Requires health alert integration",
      advocacy: "Partial -- citizen data stories available but limited trend",
      openData: "Requires open data API infrastructure",
    },
    sensors: generateSensors(80, "unhealthy"),
    currentAqi: 85,
    whoGuideline: 15,
    nationalStandard: 25,
    nationalStandardLabel: "EU annual limit",
    sources: [
      { label: "Heating", percent: 56, color: "var(--bc-color-amber)" },
      { label: "Transport", percent: 11, color: "var(--bc-color-blue)" },
      { label: "Dust/natural", percent: 21, color: "var(--bc-color-tangerine)" },
      { label: "Industry", percent: 7, color: "var(--bc-color-steel)" },
      { label: "Other", percent: 5, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["unhealthy", "unhealthy", "moderate", "unhealthy", "very-unhealthy", "unhealthy", "moderate", "unhealthy", "moderate", "unhealthy", "unhealthy", "moderate", "unhealthy", "moderate"]),
    alerts: [
      { severity: "red", text: "PM10 exceeding EU norms -- heating season peak" },
    ],
    trendYears: 3,
    trendDirection: "stable",
    trendStat: "862 citizen sensors exposed EU norm exceedances",
    trendLine: [90, 88, 85, 82, 83, 80],
    actions: [
      { text: "Heating LEZ: solid-fuel stove ban in effect", iconLabel: "Zone" },
      { text: "Free appliance replacement: check eligibility", iconLabel: "Check" },
      { text: "Transport LEZ: Euro 2 vehicles now banned from centre", iconLabel: "Zone" },
    ],
    dataRows: [
      { station: "Orlov Most", pm25: 78, timestamp: "2026-05-23 09:00" },
      { station: "Druzhba", pm25: 92, timestamp: "2026-05-23 09:00" },
      { station: "Hipodruma", pm25: 65, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "airsofia.info/api/v1/data",
  },

  /* ---- Rio de Janeiro ---- */
  {
    slug: "rio",
    name: "Rio de Janeiro",
    country: "Brazil",
    stationCount: 17,
    stationTypes: "reference-grade (MonitorAr) + Kunak sensors",
    densityMessage: "Sparse monitoring for a city of 6.7M -- coverage is thin",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "active",
      forecasting: "dim",
      health: "dim",
      advocacy: "dim",
      action: "active",
      openData: "dim",
    },
    dimReasons: {
      forecasting: "Requires city-specific forecast model",
      health: "Requires health alert integration",
      advocacy: "Requires sustained multi-year trend data",
      openData: "Requires open data API infrastructure",
    },
    sensors: generateSensors(12, "moderate"),
    currentAqi: 48,
    whoGuideline: 15,
    nationalStandard: 40,
    nationalStandardLabel: "Brazil annual limit (CONAMA)",
    sources: [
      { label: "Transport", percent: 40, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 20, color: "var(--bc-color-steel)" },
      { label: "Dust/natural", percent: 15, color: "var(--bc-color-tangerine)" },
      { label: "Port/marine", percent: 15, color: "var(--bc-color-light-blue)" },
      { label: "Other", percent: 10, color: "var(--bc-color-amber)" },
    ],
    forecast: generateForecast(["moderate", "good", "moderate", "moderate", "good", "moderate", "good", "moderate", "good", "moderate", "moderate", "good", "moderate", "good"]),
    alerts: [
      { severity: "amber", text: "PM2.5 monitoring limited to 1 station" },
    ],
    trendYears: 2,
    trendDirection: "stable",
    trendStat: "EDF Air Tracker: first source attribution model deployed",
    trendLine: [50, 48, 50, 47, 48, 46],
    actions: [
      { text: "Low Emission District: Centro pilot area", iconLabel: "Zone" },
      { text: "Cycling network: 450km of lanes", iconLabel: "Route" },
      { text: "TransCarioca BRT -- lower-emission commute", iconLabel: "Transit" },
    ],
    dataRows: [
      { station: "Centro", pm25: 42, timestamp: "2026-05-23 09:00" },
      { station: "Copacabana", pm25: 28, timestamp: "2026-05-23 09:00" },
      { station: "Bangu", pm25: 55, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "monitorar.rio.rj.gov.br/api/v1",
  },

  /* ---- Jakarta ---- */
  {
    slug: "jakarta",
    name: "Jakarta",
    country: "Indonesia",
    stationCount: 12,
    stationTypes: "ISPU government + IQAir/PurpleAir community",
    densityMessage: "Sparse and fragmented monitoring for a metro of 34M",
    toolStatus: {
      monitoring: "active",
      benchmarking: "active",
      sourceId: "dim",
      forecasting: "dim",
      health: "dim",
      advocacy: "dim",
      action: "dim",
      openData: "dim",
    },
    dimReasons: {
      sourceId: "Requires source apportionment study",
      forecasting: "Requires forecast model",
      health: "Requires health alert infrastructure",
      advocacy: "Requires sustained trend data and campaigning",
      action: "Requires coordinated behavioural programmes",
      openData: "Requires unified open data API",
    },
    sensors: generateSensors(8, "unhealthy"),
    currentAqi: 115,
    whoGuideline: 15,
    nationalStandard: 55,
    nationalStandardLabel: "Indonesia annual limit (ISPU)",
    sources: [
      { label: "Transport", percent: 35, color: "var(--bc-color-blue)" },
      { label: "Industry", percent: 30, color: "var(--bc-color-steel)" },
      { label: "Residential", percent: 15, color: "var(--bc-color-amber)" },
      { label: "Dust/natural", percent: 10, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["unhealthy", "unhealthy", "very-unhealthy", "unhealthy", "moderate", "unhealthy", "unhealthy", "unhealthy", "very-unhealthy", "unhealthy", "moderate", "unhealthy", "unhealthy", "moderate"]),
    alerts: [
      { severity: "red", text: "AQI frequently exceeds safe levels" },
    ],
    trendYears: 1,
    trendDirection: "stable",
    trendStat: "2021 citizen lawsuit: court ordered monitoring improvements",
    trendLine: [110, 115, 108, 112, 118, 115],
    actions: [
      { text: "Odd-even vehicle restrictions on major corridors", iconLabel: "Zone" },
    ],
    dataRows: [
      { station: "US Embassy", pm25: 95, timestamp: "2026-05-23 09:00" },
      { station: "Kelapa Gading", pm25: 108, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "ispu.menlhk.go.id/api",
  },

  /* ---- Johannesburg ---- */
  {
    slug: "johannesburg",
    name: "Johannesburg",
    country: "South Africa",
    stationCount: 6,
    stationTypes: "reference-grade (SAAQIS/municipal)",
    densityMessage: "Limited municipal stations -- data coverage is thin",
    toolStatus: {
      monitoring: "active",
      benchmarking: "partial",
      sourceId: "dim",
      forecasting: "dim",
      health: "dim",
      advocacy: "dim",
      action: "dim",
      openData: "dim",
    },
    dimReasons: {
      benchmarking: "Partial -- limited continuous PM2.5 data",
      sourceId: "Requires source apportionment study",
      forecasting: "Requires forecast model",
      health: "Requires health alert infrastructure",
      advocacy: "Requires sustained trend data",
      action: "Requires coordinated behavioural programmes",
      openData: "Requires unified open data API",
    },
    sensors: generateSensors(5, "moderate"),
    currentAqi: 62,
    whoGuideline: 15,
    nationalStandard: 40,
    nationalStandardLabel: "SA annual limit (NAAQS)",
    sources: [
      { label: "Industry", percent: 35, color: "var(--bc-color-steel)" },
      { label: "Domestic burning", percent: 30, color: "var(--bc-color-amber)" },
      { label: "Transport", percent: 20, color: "var(--bc-color-blue)" },
      { label: "Dust/natural", percent: 10, color: "var(--bc-color-tangerine)" },
      { label: "Other", percent: 5, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["moderate", "moderate", "unhealthy", "moderate", "moderate", "moderate", "good", "moderate", "unhealthy", "moderate", "moderate", "good", "moderate", "moderate"]),
    alerts: [
      { severity: "amber", text: "Winter domestic burning season advisory" },
    ],
    trendYears: 2,
    trendDirection: "stable",
    trendStat: "Highveld Priority Area plan targets emission reductions",
    trendLine: [65, 62, 60, 63, 60, 58],
    actions: [
      { text: "Vuthela project: clean fuel access programme", iconLabel: "Check" },
    ],
    dataRows: [
      { station: "Newtown", pm25: 55, timestamp: "2026-05-23 09:00" },
      { station: "Alexandra", pm25: 68, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "saaqis.environment.gov.za/api",
  },

  /* ---- Accra ---- */
  {
    slug: "accra",
    name: "Accra",
    country: "Ghana",
    stationCount: 8,
    stationTypes: "AirQo low-cost + EPA reference + US Embassy",
    densityMessage: "Sparse sensor coverage -- the starting point for toolkit deployment",
    toolStatus: {
      monitoring: "active",
      benchmarking: "dim",
      sourceId: "dim",
      forecasting: "dim",
      health: "dim",
      advocacy: "dim",
      action: "dim",
      openData: "dim",
    },
    dimReasons: {
      benchmarking: "Requires continuous reference-grade PM2.5 data",
      sourceId: "Requires source apportionment study",
      forecasting: "Requires forecast model",
      health: "Requires health alert infrastructure",
      advocacy: "Requires sustained trend data",
      action: "Requires coordinated behavioural programmes",
      openData: "Requires unified open data API",
    },
    sensors: generateSensors(6, "unhealthy"),
    currentAqi: 95,
    whoGuideline: 15,
    nationalStandard: 35,
    nationalStandardLabel: "Ghana EPA annual guideline",
    sources: [
      { label: "Cooking/biomass", percent: 35, color: "var(--bc-color-amber)" },
      { label: "Waste burning", percent: 25, color: "var(--bc-color-tangerine)" },
      { label: "Transport", percent: 20, color: "var(--bc-color-blue)" },
      { label: "Dust/natural", percent: 15, color: "var(--bc-color-steel)" },
      { label: "Other", percent: 5, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["unhealthy", "unhealthy", "very-unhealthy", "unhealthy", "moderate", "unhealthy", "unhealthy", "unhealthy", "very-unhealthy", "unhealthy", "unhealthy", "moderate", "unhealthy", "unhealthy"]),
    alerts: [
      { severity: "red", text: "No active health alert system" },
    ],
    trendYears: 1,
    trendDirection: "stable",
    trendStat: "Clean Air Accra partnership establishing first emissions inventory",
    trendLine: [95, 92, 98, 90, 93, 95],
    actions: [
      { text: "No coordinated action programme yet", iconLabel: "Info" },
    ],
    dataRows: [
      { station: "US Embassy", pm25: 88, timestamp: "2026-05-23 09:00" },
      { station: "AirQo Legon", pm25: 72, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "api.airqo.net/v2/data",
  },

  /* ---- Nairobi ---- */
  {
    slug: "nairobi",
    name: "Nairobi",
    country: "Kenya",
    stationCount: 7,
    stationTypes: "AirQo + UNEP + US Embassy + sensors.AFRICA",
    densityMessage: "Sparse coverage -- monitoring is the first priority",
    toolStatus: {
      monitoring: "active",
      benchmarking: "dim",
      sourceId: "dim",
      forecasting: "dim",
      health: "dim",
      advocacy: "dim",
      action: "dim",
      openData: "dim",
    },
    dimReasons: {
      benchmarking: "Requires continuous reference-grade PM2.5 data",
      sourceId: "Requires source apportionment study",
      forecasting: "Requires forecast model",
      health: "Requires health alert infrastructure",
      advocacy: "Requires sustained trend data",
      action: "Requires coordinated behavioural programmes",
      openData: "Requires unified open data API",
    },
    sensors: generateSensors(5, "unhealthy"),
    currentAqi: 88,
    whoGuideline: 15,
    nationalStandard: 35,
    nationalStandardLabel: "Kenya NEMA annual guideline",
    sources: [
      { label: "Transport", percent: 30, color: "var(--bc-color-blue)" },
      { label: "Cooking/biomass", percent: 30, color: "var(--bc-color-amber)" },
      { label: "Waste burning", percent: 15, color: "var(--bc-color-tangerine)" },
      { label: "Industry", percent: 15, color: "var(--bc-color-steel)" },
      { label: "Other", percent: 10, color: "var(--bc-color-light-blue)" },
    ],
    forecast: generateForecast(["unhealthy", "moderate", "unhealthy", "unhealthy", "moderate", "unhealthy", "unhealthy", "unhealthy", "moderate", "unhealthy", "unhealthy", "moderate", "unhealthy", "moderate"]),
    alerts: [
      { severity: "red", text: "No active health alert system" },
    ],
    trendYears: 1,
    trendDirection: "stable",
    trendStat: "National AQ Action Plan published -- implementation early stage",
    trendLine: [85, 88, 82, 90, 85, 88],
    actions: [
      { text: "No coordinated action programme yet", iconLabel: "Info" },
    ],
    dataRows: [
      { station: "US Embassy", pm25: 82, timestamp: "2026-05-23 09:00" },
      { station: "UNEP Campus", pm25: 55, timestamp: "2026-05-23 09:00" },
    ],
    apiEndpoint: "sensors.africa/api/v2/data",
  },
];
