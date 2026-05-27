/**
 * roadmap-data.ts
 *
 * Purpose: Central data source for the Best Practice Roadmap wireframe prototype.
 * Contains all mock data for cities, domains, practice cards, and the coverage matrix.
 * All roadmap pages import from this single file — no data is inlined in components.
 *
 * Key exports: CITIES, DOMAINS, COVERAGE_MATRIX, PRACTICE_CARDS, helper lookup functions.
 * External dependencies: none — pure data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One of the three stages every domain belongs to */
export type Stage = "Seeing" | "Understanding" | "Acting" | "Enabling";

/** Outcome measurement status of a city's contribution to a practice */
export type OutcomeState = "measured" | "baseline-established" | "baseline-building";

/** Whether the work was a BC partnership or the city's own achievement */
export type ProvenanceBadge = "BC Partnership" | "City Achievement";

/** A Breathe Cities member city */
export interface City {
  slug: string;
  name: string;
  country: string;
  flag: string;
  populationMillions: number;
  populationLabel: string;
  region: string;
}

/** A domain in the roadmap (the 11 thematic areas) */
export interface Domain {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  stage: Stage;
  description: string;
}

/** A city's contribution to a specific practice */
export interface CityExample {
  citySlug: string;
  provenance: ProvenanceBadge;
  interventionName: string;
  introducedYear: number | string;
  outcomeState: OutcomeState;
  outcomeBefore?: string;
  outcomeAfter?: string;
  outcomeChange?: string;
  outcomeNote?: string;
  link?: string;
  chartData?: any;
}

/** A practice card — the atomic content unit */
export interface PracticeCard {
  id: string;
  name: string;
  domainId: number;
  description: string;
  totalPopulationImpacted: string;
  cityCount: number;
  cityExamples: CityExample[];
  relatedPracticeIds: string[];
}

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

export const CITIES: City[] = [
  { slug: "paris", name: "Paris", country: "France", flag: "FR", populationMillions: 12.2, populationLabel: "12.2M", region: "Europe" },
  { slug: "london", name: "London", country: "United Kingdom", flag: "GB", populationMillions: 9.0, populationLabel: "9.0M", region: "Europe" },
  { slug: "mexico-city", name: "Mexico City", country: "Mexico", flag: "MX", populationMillions: 21.8, populationLabel: "21.8M", region: "Latin America" },
  { slug: "milan", name: "Milan", country: "Italy", flag: "IT", populationMillions: 1.4, populationLabel: "1.4M", region: "Europe" },
  { slug: "brussels", name: "Brussels", country: "Belgium", flag: "BE", populationMillions: 1.2, populationLabel: "1.2M", region: "Europe" },
  { slug: "jakarta", name: "Jakarta", country: "Indonesia", flag: "ID", populationMillions: 10.6, populationLabel: "10.6M", region: "Asia" },
  { slug: "johannesburg", name: "Johannesburg", country: "South Africa", flag: "ZA", populationMillions: 6.0, populationLabel: "6.0M", region: "Africa" },
  { slug: "accra", name: "Accra", country: "Ghana", flag: "GH", populationMillions: 5.4, populationLabel: "5.4M", region: "Africa" },
  { slug: "nairobi", name: "Nairobi", country: "Kenya", flag: "KE", populationMillions: 4.4, populationLabel: "4.4M", region: "Africa" },
  { slug: "bangkok", name: "Bangkok", country: "Thailand", flag: "TH", populationMillions: 10.7, populationLabel: "10.7M", region: "Asia" },
  { slug: "bogota", name: "Bogota", country: "Colombia", flag: "CO", populationMillions: 7.9, populationLabel: "7.9M", region: "Latin America" },
  { slug: "rio-de-janeiro", name: "Rio de Janeiro", country: "Brazil", flag: "BR", populationMillions: 6.7, populationLabel: "6.7M", region: "Latin America" },
  { slug: "sofia", name: "Sofia", country: "Bulgaria", flag: "BG", populationMillions: 1.3, populationLabel: "1.3M", region: "Europe" },
  { slug: "warsaw", name: "Warsaw", country: "Poland", flag: "PL", populationMillions: 1.8, populationLabel: "1.8M", region: "Europe" },
];

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

export const DOMAINS: Domain[] = [
  { id: 1, slug: "monitoring", name: "AQ Monitoring & Data Infrastructure", shortName: "Monitoring", stage: "Seeing", description: "Building the sensor networks and data systems cities need to see their air quality clearly. From reference-grade stations to low-cost sensor grids, this domain covers the infrastructure that makes everything else possible." },
  { id: 2, slug: "source-apportionment", name: "Source Apportionment & Emissions Analysis", shortName: "Source Analysis", stage: "Understanding", description: "Understanding where pollution comes from. Emissions inventories and source apportionment studies that identify the dominant contributors — transport, industry, cooking fuels, waste burning — so cities can target interventions where they will have the greatest impact." },
  { id: 3, slug: "health-impact", name: "Health Impact Assessment & Evidence Building", shortName: "Health Impact", stage: "Understanding", description: "Quantifying the health burden of air pollution. Epidemiological studies, health impact assessments, and evidence building that connects air quality data to public health outcomes and builds the case for action." },
  { id: 4, slug: "policy-design", name: "Policy Design & Adoption", shortName: "Policy Design", stage: "Acting", description: "Translating evidence into enforceable policy. National air quality standards, clean air acts, emission limits, and the regulatory frameworks that give cities the authority and mandate to act." },
  { id: 5, slug: "transport", name: "Transport & Mobility", shortName: "Transport", stage: "Acting", description: "Cleaning up how cities move. Low-emission zones, vehicle restrictions, public transit investment, cycling infrastructure, and the modal shifts that reduce transport-related emissions." },
  { id: 6, slug: "clean-fuels", name: "Clean Fuels for Cooking & Heating", shortName: "Clean Fuels", stage: "Acting", description: "Transitioning households away from solid fuels. Clean cookstove programmes, LPG subsidies, and heating fuel transitions that address the indoor-outdoor pollution nexus — especially critical in the Global South." },
  { id: 7, slug: "green-infrastructure", name: "Green Infrastructure & Urban Planning", shortName: "Green Infra", stage: "Acting", description: "Designing cities that breathe. Green corridors, urban forests, low-emission building standards, and spatial planning that reduces exposure and creates natural buffers between pollution sources and people." },
  { id: 8, slug: "awareness", name: "Raising Awareness & Community Engagement", shortName: "Awareness", stage: "Enabling", description: "Making air quality visible to citizens. Public awareness campaigns, school programmes, community monitoring, and the civic engagement that builds demand for clean air and sustains political will." },
  { id: 9, slug: "governance", name: "Multi-Level Governance & Coordination", shortName: "Governance", stage: "Enabling", description: "Aligning national, regional, and municipal action. Inter-agency coordination, multi-level governance frameworks, and the institutional arrangements that prevent fragmented or contradictory policy responses." },
  { id: 10, slug: "funding", name: "Funding, Sustainability & Progress Tracking", shortName: "Funding", stage: "Enabling", description: "Financing the transition and tracking progress. Climate finance, development bank loans, municipal budgets, and the monitoring frameworks that measure whether investments are delivering cleaner air." },
  { id: 12, slug: "data-technology", name: "Data & Technology Infrastructure", shortName: "Data & Tech", stage: "Seeing", description: "The digital backbone. Open data platforms, APIs, forecasting models, and the technology infrastructure that turns raw sensor readings into actionable intelligence for city managers and citizens." },
];

// ---------------------------------------------------------------------------
// Coverage Matrix — binary: has the city acted in this domain?
// Index matches domain ID (1-indexed), so index 0 = domain 1
// ---------------------------------------------------------------------------

export const COVERAGE_MATRIX: Record<string, boolean[]> = {
  "paris":          [true,  true,  true,  true,  true,  true,  true,  true,  true,  false, true],
  "london":         [true,  true,  true,  true,  true,  false, false, true,  true,  true,  true],
  "mexico-city":    [true,  true,  false, true,  true,  false, false, true,  true,  false, true],
  "milan":          [true,  false, false, true,  true,  false, true,  true,  false, false, false],
  "brussels":       [true,  false, false, true,  true,  false, true,  true,  true,  false, false],
  "jakarta":        [true,  false, true,  false, false, false, false, true,  false, false, true],
  "johannesburg":   [true,  false, false, true,  false, true,  false, false, true,  false, true],
  "accra":          [true,  true,  false, false, false, false, false, false, false, false, false],
  "nairobi":        [true,  true,  false, false, false, false, false, false, false, false, false],
  "bangkok":        [true,  false, true,  true,  true,  false, false, true,  true,  false, false],
  "bogota":         [true,  false, false, true,  true,  false, false, true,  false, false, false],
  "rio-de-janeiro": [true,  false, false, true,  true,  false, false, true,  false, false, true],
  "sofia":          [true,  false, false, true,  false, false, false, false, true,  false, false],
  "warsaw":         [true,  false, false, true,  true,  true,  true,  true,  true,  true,  true],
};

// ---------------------------------------------------------------------------
// Practice Cards
// ---------------------------------------------------------------------------

export const PRACTICE_CARDS: PracticeCard[] = [
  // Domain 1 — Low-Cost Sensor Deployment
  {
    id: "d1-sensor-deployment",
    name: "Low-Cost Sensor Deployment",
    domainId: 1,
    description: "Deploying networks of affordable PM2.5 and NO2 sensors across neighbourhoods, schools, and transport corridors to fill gaps in official monitoring and give communities real-time air quality data.",
    totalPopulationImpacted: "20.8M",
    cityCount: 3,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "Breathe London — 100+ low-cost sensors city-wide",
        introducedYear: 2019,
        outcomeState: "measured",
        outcomeBefore: "Sparse coverage (reference stations only)",
        outcomeAfter: "First city-scale network validated against reference monitoring",
        outcomeChange: "100+ sensors",
        outcomeNote: "Open-access data",
        chartData: { type: "deltaBar", label: "Sensors", before: 20, after: 120, unit: "stations", change: "+100 sensors" },
      },
      {
        citySlug: "nairobi",
        provenance: "BC Partnership",
        interventionName: "AirQo + sensors.AFRICA at schools & community centres",
        introducedYear: "ongoing",
        outcomeState: "baseline-building",
        outcomeNote: "First consistent data",
        chartData: { type: "outcomeHighlight", value: "24", label: "sensors at schools and community centres", context: "First consistent PM2.5 monitoring — AirQo + sensors.AFRICA network" },
      },
      {
        citySlug: "accra",
        provenance: "BC Partnership",
        interventionName: "AirQo PM2.5 sensors",
        introducedYear: "ongoing",
        outcomeState: "baseline-building",
        outcomeNote: "First consistent data",
        chartData: { type: "outcomeHighlight", value: "67", label: "sensors across 13 districts", context: "One of Africa's largest low-cost sensor networks — real-time PM2.5 where none existed" },
      },
    ],
    relatedPracticeIds: ["d2-source-apportionment", "d12-open-data"],
  },

  // Domain 2 — Source Apportionment Study
  {
    id: "d2-source-apportionment",
    name: "Source Apportionment Study",
    domainId: 2,
    description: "Comprehensive emissions inventories and receptor modelling studies that identify the dominant pollution sources in a city — the essential diagnostic step before designing targeted interventions.",
    totalPopulationImpacted: "18.8M",
    cityCount: 3,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "LAEI identified road transport as 50% of NOx → directly informed ULEZ design → NO₂ down 28%",
        introducedYear: 2013,
        outcomeState: "measured",
        outcomeBefore: "Uncertain source contribution",
        outcomeAfter: "ULEZ implemented based on LAEI evidence — NO₂ reduced 28% London-wide, on track to 30% target by 2030",
        outcomeChange: "→ ULEZ → -28% NO₂",
        chartData: { type: "sourceDonut", segments: [
          { label: "Road transport", icon: "", value: 50 },
          { label: "Domestic", icon: "", value: 15 },
          { label: "Industry", icon: "", value: 20 },
          { label: "Other", icon: "", value: 15 },
        ]},
      },
      {
        citySlug: "accra",
        provenance: "BC Partnership",
        interventionName: "Emissions study identified road transport as dominant → targeting vehicle standards and cookstove transition",
        introducedYear: 2020,
        outcomeState: "measured",
        outcomeBefore: "Limited emissions data",
        outcomeAfter: "Priority sectors identified — vehicle emission standards and clean cookstove programmes now in design phase",
        outcomeChange: "→ Transport + cookstove policy in design",
        chartData: { type: "sourceDonut", segments: [
          { label: "Road transport", icon: "", value: 39 },
          { label: "Household fuels", icon: "", value: 28 },
          { label: "Waste burning", icon: "", value: 18 },
          { label: "Other", icon: "", value: 15 },
        ]},
      },
      {
        citySlug: "nairobi",
        provenance: "BC Partnership",
        interventionName: "Inventory identified transport + cooking fuels → clean cooking programme launched, transport policy in development",
        introducedYear: 2021,
        outcomeState: "measured",
        outcomeBefore: "No city-level inventory",
        outcomeAfter: "Evidence now informing Nairobi's first clean air action plan — clean cooking transition underway",
        outcomeChange: "→ Clean air action plan underway",
        chartData: { type: "sourceDonut", segments: [
          { label: "Transport", icon: "", value: 45 },
          { label: "Cooking fuels", icon: "", value: 30 },
          { label: "Other sources", icon: "", value: 25 },
        ]},
      },
    ],
    relatedPracticeIds: ["d1-sensor-deployment", "d5-lez"],
  },

  // Domain 5 — Low-Emission Zone
  {
    id: "d5-lez",
    name: "Low-Emission Zone",
    domainId: 5,
    description: "Geographically defined areas where the most polluting vehicles are restricted or charged, incentivising fleet turnover and reducing roadside pollution concentrations in the most affected neighbourhoods.",
    totalPopulationImpacted: "22.6M",
    cityCount: 3,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "Ultra Low Emission Zone (ULEZ)",
        introducedYear: 2019,
        outcomeState: "measured",
        outcomeBefore: "High roadside NO2",
        outcomeAfter: "NO2: -21% at roadside monitoring stations",
        outcomeChange: "-21%",
        outcomeNote: "City-wide expansion 2023",
        chartData: { type: "deltaBar", label: "NO₂ roadside", before: 100, after: 79, unit: "index", change: "-21%" },
      },
      {
        citySlug: "paris",
        provenance: "City Achievement",
        interventionName: "Zone a Faibles Emissions (ZFE)",
        introducedYear: 2015,
        outcomeState: "measured",
        outcomeBefore: "High near-road NO2",
        outcomeAfter: "NO2: -30% near major roads (2012-2022)",
        outcomeChange: "-30%",
        chartData: { type: "sparkline", label: "NO₂ near major roads", values: [100, 97, 93, 88, 84, 80, 76, 74, 72, 70, 68], years: "2012–2022", change: "-30%" },
      },
      {
        citySlug: "milan",
        provenance: "City Achievement",
        interventionName: "Area B — covers 72% of city",
        introducedYear: 2019,
        outcomeState: "measured",
        outcomeBefore: "Elevated PM10 and black carbon",
        outcomeAfter: "PM10: -10%, Black carbon: -30%",
        outcomeChange: "-10% PM10, -30% BC",
        chartData: { type: "groupedBar", metrics: [
          { label: "PM10", before: 100, after: 90, change: "-10%" },
          { label: "Black Carbon", before: 100, after: 70, change: "-30%" },
        ]},
      },
    ],
    relatedPracticeIds: ["d5-vehicle-restriction", "d2-source-apportionment"],
  },

  // Domain 5 — Vehicle Restriction Programme
  {
    id: "d5-vehicle-restriction",
    name: "Vehicle Restriction Programme",
    domainId: 5,
    description: "Programmes that restrict vehicle use by plate number or day to reduce traffic volume and emissions. Among the earliest air quality interventions adopted by megacities.",
    totalPopulationImpacted: "21.8M",
    cityCount: 1,
    cityExamples: [
      {
        citySlug: "mexico-city",
        provenance: "City Achievement",
        interventionName: "Hoy No Circula",
        introducedYear: 1989,
        outcomeState: "measured",
        outcomeBefore: "Severe traffic congestion and vehicle emissions",
        outcomeAfter: "Removes ~20% of vehicles daily",
        outcomeChange: "-20% daily vehicles",
        chartData: { type: "coverageRing", label: "Daily traffic after restriction", value: 80, unit: "%", sublabel: "-20% vehicles removed" },
      },
    ],
    relatedPracticeIds: ["d5-lez"],
  },

  // Domain 3 — Health Impact Assessment
  {
    id: "d3-health-risk-assessment",
    name: "Health Impact Assessment",
    domainId: 3,
    description: "Quantifying how air pollution affects public health — linking AQ data to hospital admissions, respiratory disease, and premature mortality to build the evidence base for urgent action.",
    totalPopulationImpacted: "34.0M",
    cityCount: 3,
    cityExamples: [
      {
        citySlug: "paris",
        provenance: "City Achievement",
        interventionName: "UFP health study → ZFE tightening → 33% fewer respiratory admissions",
        introducedYear: 2018,
        outcomeState: "measured",
        outcomeBefore: "Limited ultrafine particle health data",
        outcomeAfter: "Direct link established between UFP exposure and respiratory admissions",
        outcomeChange: "UFP-health link confirmed",
        chartData: { type: "outcomeHighlight", value: "33%", label: "fewer respiratory admissions near major roads", context: "After Airparif UFP study linked pollution to hospital visits, informing ZFE policy tightening" },
      },
      {
        citySlug: "bangkok",
        provenance: "BC Partnership",
        interventionName: "PM2.5 health crisis → BC partnership → child exposure tracking and reduction target",
        introducedYear: 2019,
        outcomeState: "baseline-established",
        outcomeNote: "Targeting 50% reduction in child exposure days by 2030",
        chartData: { type: "deltaBar", label: "Child exposure days per year", before: 97, after: 48, unit: "days", change: "50% reduction target by 2030" },
      },
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "Clean air policies → 700 fewer premature deaths per year",
        introducedYear: 2015,
        outcomeState: "measured",
        outcomeBefore: "Est. 4,300 premature deaths/year from NO₂ and PM2.5",
        outcomeAfter: "Est. 3,600 after ULEZ and LEZ — 700 lives saved annually",
        outcomeChange: "700 lives saved/year",
        chartData: { type: "outcomeHighlight", value: "700", label: "premature deaths avoided per year", context: "Down from est. 4,300 to 3,600 after ULEZ and clean air policies" },
      },
    ],
    relatedPracticeIds: ["d2-source-apportionment", "d5-lez"],
  },

  // Domain 12 — Open Data Platform
  {
    id: "d12-open-data",
    name: "Open Data Platform",
    domainId: 12,
    description: "Public-facing platforms that turn raw sensor data into accessible, real-time air quality information for city managers, researchers, and citizens.",
    totalPopulationImpacted: "20.4M",
    cityCount: 4,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "London Air Quality Network — open data since 2005",
        introducedYear: 2005,
        outcomeState: "measured",
        outcomeBefore: "Data locked in agency silos",
        outcomeAfter: "150+ stations, real-time public API, open downloads",
        outcomeChange: "150+ stations",
        chartData: { type: "sparkline", label: "Active monitoring stations", values: [30, 38, 48, 58, 68, 78, 90, 105, 120, 135, 150], years: "2005–2024", change: "+400%" },
      },
      {
        citySlug: "jakarta",
        provenance: "City Achievement",
        interventionName: "udara.jakarta.go.id — city AQ dashboard",
        introducedYear: 2021,
        outcomeState: "measured",
        outcomeBefore: "No unified city-level data platform",
        outcomeAfter: "Single dashboard integrating government and community sensors",
        outcomeChange: "Unified platform",
        chartData: { type: "coverageRing", label: "Sensor feeds integrated", value: 78, unit: "%" },
      },
      {
        citySlug: "warsaw",
        provenance: "City Achievement",
        interventionName: "EU-funded public air quality data platform",
        introducedYear: 2019,
        outcomeState: "measured",
        outcomeBefore: "Fragmented data across agencies",
        outcomeAfter: "Centralised platform with real-time alerts and forecasting",
        outcomeChange: "Centralised",
        chartData: { type: "deltaBar", label: "Data sources integrated", before: 3, after: 12, unit: "sources", change: "+300%" },
      },
      {
        citySlug: "bogota",
        provenance: "City Achievement",
        interventionName: "Bogota open AQ data — RMCAB real-time monitoring network",
        introducedYear: 2018,
        outcomeState: "measured",
        outcomeBefore: "Limited public access to AQ data",
        outcomeAfter: "Real-time public dashboard with 20 stations",
        outcomeChange: "20 stations live",
        chartData: { type: "doubleRing", label: "Public monitoring stations", before: 4, after: 20, unit: "stations", change: "+400%" },
      },
    ],
    relatedPracticeIds: ["d1-sensor-deployment"],
  },

  // Domain 4 — Policy Design & Adoption
  {
    id: "d4-policy-timeline",
    name: "Policy Design & Adoption",
    domainId: 4,
    description: "Progressive policy frameworks that tighten over time — each intervention informed by the last, ratcheting toward cleaner air.",
    totalPopulationImpacted: "44.8M",
    cityCount: 4,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "20-year policy ratchet — congestion pricing to city-wide ULEZ",
        introducedYear: 2003,
        outcomeState: "measured",
        outcomeBefore: "High roadside NO₂",
        outcomeAfter: "NO₂: -28% across London",
        outcomeChange: "-28%",
        chartData: {
          type: "policyTimeline",
          metric: "NO₂",
          unit: "µg/m³",
          startYear: 2003,
          endYear: 2030,
          targetPct: 30,
          currentPct: 28,
          curve: [
            { year: 2003, value: 100 },
            { year: 2006, value: 96 },
            { year: 2008, value: 93 },
            { year: 2012, value: 88 },
            { year: 2015, value: 84 },
            { year: 2019, value: 79 },
            { year: 2021, value: 75 },
            { year: 2023, value: 72 },
            { year: 2025, value: 70 },
          ],
          policies: [
            { num: 1, year: 2003, label: "Congestion Charge" },
            { num: 2, year: 2008, label: "LEZ" },
            { num: 3, year: 2019, label: "ULEZ Central" },
            { num: 4, year: 2021, label: "ULEZ Inner London" },
            { num: 5, year: 2023, label: "ULEZ City-wide" },
          ],
        },
      },
      {
        citySlug: "warsaw",
        provenance: "City Achievement",
        interventionName: "Coal ban and rapid LEZ adoption",
        introducedYear: 2018,
        outcomeState: "measured",
        outcomeBefore: "High PM2.5 from coal heating",
        outcomeAfter: "PM2.5: -46%",
        outcomeChange: "-46%",
        chartData: {
          type: "policyTimeline",
          metric: "PM2.5",
          unit: "µg/m³",
          startYear: 2015,
          endYear: 2030,
          targetPct: 30,
          currentPct: 46,
          curve: [
            { year: 2015, value: 100 },
            { year: 2017, value: 95 },
            { year: 2018, value: 85 },
            { year: 2019, value: 75 },
            { year: 2020, value: 68 },
            { year: 2022, value: 60 },
            { year: 2024, value: 54 },
            { year: 2025, value: 52 },
          ],
          policies: [
            { num: 1, year: 2018, label: "Coal heating ban" },
            { num: 2, year: 2024, label: "LEZ introduced" },
          ],
        },
      },
      {
        citySlug: "paris",
        provenance: "City Achievement",
        interventionName: "Progressive ZFE expansion and Crit'Air system",
        introducedYear: 2015,
        outcomeState: "measured",
        outcomeBefore: "High near-road NO₂",
        outcomeAfter: "NO₂: -32% near major roads",
        outcomeChange: "-32%",
        chartData: {
          type: "policyTimeline",
          metric: "NO₂",
          unit: "µg/m³",
          startYear: 2010,
          endYear: 2030,
          targetPct: 30,
          currentPct: 32,
          curve: [
            { year: 2010, value: 100 },
            { year: 2012, value: 96 },
            { year: 2015, value: 90 },
            { year: 2017, value: 82 },
            { year: 2019, value: 76 },
            { year: 2021, value: 72 },
            { year: 2023, value: 69 },
            { year: 2025, value: 67 },
          ],
          policies: [
            { num: 1, year: 2015, label: "ZFE introduced" },
            { num: 2, year: 2017, label: "Crit'Air vignette" },
            { num: 3, year: 2024, label: "Limited-traffic zone" },
          ],
        },
      },
      {
        citySlug: "brussels",
        provenance: "City Achievement",
        interventionName: "City-wide LEZ with progressive tightening",
        introducedYear: 2018,
        outcomeState: "measured",
        outcomeBefore: "Elevated PM2.5",
        outcomeAfter: "PM2.5: -42%",
        outcomeChange: "-42%",
        chartData: {
          type: "policyTimeline",
          metric: "PM2.5",
          unit: "µg/m³",
          startYear: 2015,
          endYear: 2030,
          targetPct: 30,
          currentPct: 42,
          curve: [
            { year: 2015, value: 100 },
            { year: 2017, value: 94 },
            { year: 2018, value: 85 },
            { year: 2020, value: 72 },
            { year: 2022, value: 64 },
            { year: 2024, value: 58 },
            { year: 2025, value: 56 },
          ],
          policies: [
            { num: 1, year: 2018, label: "City-wide LEZ" },
            { num: 2, year: 2022, label: "LEZ phase 2 tightening" },
          ],
        },
      },
    ],
    relatedPracticeIds: ["d5-lez", "d2-source-apportionment"],
  },

  // Domain 6 — Clean Fuels for Cooking & Heating
  {
    id: "d6-clean-fuels",
    name: "Household Fuel Transition",
    domainId: 6,
    description: "Transitioning households from coal, biomass, and oil to clean alternatives — gas networks, electric heat pumps, district heating — reducing the indoor-outdoor pollution nexus at scale.",
    totalPopulationImpacted: "15.2M",
    cityCount: 3,
    cityExamples: [
      {
        citySlug: "warsaw",
        provenance: "City Achievement",
        interventionName: "Coal heating ban — 340,000 households transitioned",
        introducedYear: 2018,
        outcomeState: "measured",
        outcomeChange: "-46% PM2.5",
        chartData: {
          type: "fuelMixShift",
          beforeLabel: "2015",
          afterLabel: "2024",
          headline: "340K households off coal",
          segments: [
            { label: "Coal", icon: "", beforePct: 65, afterPct: 5 },
            { label: "Gas", icon: "", beforePct: 20, afterPct: 50 },
            { label: "Electric/heat pump", icon: "", beforePct: 10, afterPct: 35 },
            { label: "Other", icon: "", beforePct: 5, afterPct: 10 },
          ],
        },
      },
      {
        citySlug: "johannesburg",
        provenance: "City Achievement",
        interventionName: "Electrification programme — coal and paraffin reduction",
        introducedYear: 2016,
        outcomeState: "measured",
        outcomeChange: "-25% household PM",
        chartData: {
          type: "fuelMixShift",
          beforeLabel: "2012",
          afterLabel: "2023",
          headline: "1.2M homes electrified",
          segments: [
            { label: "Coal", icon: "", beforePct: 45, afterPct: 20 },
            { label: "Paraffin", icon: "", beforePct: 20, afterPct: 8 },
            { label: "Electric", icon: "", beforePct: 30, afterPct: 65 },
            { label: "Other", icon: "", beforePct: 5, afterPct: 7 },
          ],
        },
      },
      {
        citySlug: "paris",
        provenance: "City Achievement",
        interventionName: "District heating expansion + oil boiler phase-out",
        introducedYear: 2015,
        outcomeState: "measured",
        outcomeChange: "-38% heating emissions",
        chartData: {
          type: "fuelMixShift",
          beforeLabel: "2012",
          afterLabel: "2024",
          headline: "Oil boilers phased out",
          segments: [
            { label: "Oil/gas boilers", icon: "", beforePct: 55, afterPct: 20 },
            { label: "District heating", icon: "", beforePct: 25, afterPct: 45 },
            { label: "Electric/heat pump", icon: "", beforePct: 15, afterPct: 30 },
            { label: "Other", icon: "", beforePct: 5, afterPct: 5 },
          ],
        },
      },
    ],
    relatedPracticeIds: ["d4-policy-timeline", "d2-source-apportionment"],
  },

  // Domain 7 — Green Infrastructure & Urban Planning
  {
    id: "d7-green-infrastructure",
    name: "Urban Green Infrastructure",
    domainId: 7,
    description: "Designing cities that breathe — green corridors, urban forests, tree canopy expansion, and low-emission building standards that reduce exposure and create natural buffers.",
    totalPopulationImpacted: "16.6M",
    cityCount: 4,
    cityExamples: [
      {
        citySlug: "paris",
        provenance: "City Achievement",
        interventionName: "Plan Canopée — 170,000 new trees by 2026",
        introducedYear: 2020,
        outcomeState: "measured",
        outcomeChange: "+24% urban canopy",
        chartData: { type: "greenCoverMap", city: "paris", beforeLabel: "2014", afterLabel: "2024", beforePct: 22, afterPct: 33, change: "+50%", headline: "Urban canopy expanded" },
      },
      {
        citySlug: "milan",
        provenance: "City Achievement",
        interventionName: "ForestaMi — 3 million trees planted across metro area",
        introducedYear: 2018,
        outcomeState: "measured",
        outcomeChange: "3M trees planted",
        chartData: { type: "treePlanting", existing: 20, added: 12, unit: "x 100K", headline: "3M new trees planted" },
      },
      {
        citySlug: "brussels",
        provenance: "City Achievement",
        interventionName: "Green corridors along major roads — PM2.5 buffer zones",
        introducedYear: 2019,
        outcomeState: "measured",
        outcomeChange: "-34% roadside PM2.5",
        chartData: { type: "greenCorridor", headline: "47 km of green corridors", label: "PM2.5 behind tree canopy", reduction: "-34%" },
      },
      {
        citySlug: "warsaw",
        provenance: "City Achievement",
        interventionName: "Urban re-greening programme — parks and pocket forests",
        introducedYear: 2016,
        outcomeState: "measured",
        outcomeChange: "+78% green cover",
        chartData: { type: "greenCoverMap", city: "warsaw", beforeLabel: "2010", afterLabel: "2024", beforePct: 18, afterPct: 32, change: "+78%", headline: "Urban green cover expanded" },
      },
    ],
    relatedPracticeIds: ["d4-policy-timeline", "d5-lez"],
  },

  // Domain 8 — Raising Awareness & Community Engagement
  {
    id: "d8-awareness",
    name: "Public Awareness & Community Engagement",
    domainId: 8,
    description: "Making air quality visible to citizens through campaigns, school programmes, community monitoring, and civic platforms that build sustained demand for clean air.",
    totalPopulationImpacted: "42.0M",
    cityCount: 4,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "Breathe London — citizen science to school alerts",
        introducedYear: 2005,
        outcomeState: "measured",
        outcomeChange: "58% now AQ-aware",
        chartData: {
          type: "awarenessTimeline",
          metric: "Population aware of AQ issues",
          startYear: 2003,
          endYear: 2025,
          currentPct: 58,
          curve: [
            { year: 2003, value: 5 },
            { year: 2005, value: 10 },
            { year: 2008, value: 14 },
            { year: 2012, value: 20 },
            { year: 2015, value: 28 },
            { year: 2018, value: 38 },
            { year: 2019, value: 44 },
            { year: 2021, value: 50 },
            { year: 2023, value: 55 },
            { year: 2025, value: 58 },
          ],
          campaigns: [
            { num: 1, year: 2005, label: "London Air Quality Network public data" },
            { num: 2, year: 2018, label: "Breathe London citizen science" },
            { num: 3, year: 2019, label: "ULEZ public awareness campaign" },
            { num: 4, year: 2022, label: "School air quality alerts" },
          ],
        },
      },
      {
        citySlug: "nairobi",
        provenance: "BC Partnership",
        interventionName: "AirQo community monitoring — sensors to school programmes",
        introducedYear: 2021,
        outcomeState: "baseline-established",
        outcomeChange: "Growing AQ awareness",
        chartData: {
          type: "awarenessTimeline",
          metric: "Community AQ engagement",
          startYear: 2019,
          endYear: 2025,
          currentPct: 22,
          curve: [
            { year: 2019, value: 3 },
            { year: 2020, value: 6 },
            { year: 2021, value: 12 },
            { year: 2022, value: 15 },
            { year: 2023, value: 18 },
            { year: 2025, value: 22 },
          ],
          campaigns: [
            { num: 1, year: 2019, label: "sensors.AFRICA school pilot" },
            { num: 2, year: 2021, label: "AirQo community network" },
            { num: 3, year: 2023, label: "Citizen data app launch" },
          ],
        },
      },
      {
        citySlug: "paris",
        provenance: "City Achievement",
        interventionName: "Progressive AQ awareness — Airparif to school alerts",
        introducedYear: 2007,
        outcomeState: "measured",
        outcomeChange: "68% now AQ-aware",
        chartData: {
          type: "awarenessTimeline",
          metric: "Population aware of AQ issues",
          startYear: 2005,
          endYear: 2025,
          currentPct: 68,
          curve: [
            { year: 2005, value: 8 },
            { year: 2007, value: 15 },
            { year: 2010, value: 22 },
            { year: 2013, value: 28 },
            { year: 2015, value: 38 },
            { year: 2017, value: 48 },
            { year: 2020, value: 55 },
            { year: 2022, value: 62 },
            { year: 2025, value: 68 },
          ],
          campaigns: [
            { num: 1, year: 2007, label: "Airparif public dashboard" },
            { num: 2, year: 2015, label: "Paris Respire car-free days" },
            { num: 3, year: 2017, label: "Crit’Air awareness campaign" },
            { num: 4, year: 2020, label: "School AQ alert system" },
          ],
        },
      },
      {
        citySlug: "bangkok",
        provenance: "City Achievement",
        interventionName: "Bangkok Clean Air Act awareness — public health messaging campaign",
        introducedYear: 2020,
        outcomeState: "measured",
        outcomeChange: "45% now AQ-aware",
        chartData: {
          type: "awarenessTimeline",
          metric: "Population aware of AQ issues",
          startYear: 2018,
          endYear: 2025,
          currentPct: 45,
          curve: [
            { year: 2018, value: 8 },
            { year: 2019, value: 18 },
            { year: 2020, value: 28 },
            { year: 2021, value: 32 },
            { year: 2022, value: 36 },
            { year: 2024, value: 42 },
            { year: 2025, value: 45 },
          ],
          campaigns: [
            { num: 1, year: 2019, label: "PM2.5 crisis — public health alerts" },
            { num: 2, year: 2020, label: "Clean Air Act awareness push" },
            { num: 3, year: 2022, label: "School air quality programme" },
          ],
        },
      },
    ],
    relatedPracticeIds: ["d1-sensor-deployment", "d12-open-data"],
  },

  // Domain 9 — Multi-Level Governance & Coordination
  {
    id: "d9-governance",
    name: "Multi-Level Governance & Coordination",
    domainId: 9,
    description: "Building governance integration incrementally — each layer of coordination amplifies the last, from municipal offices to national frameworks to regional alignment and community engagement.",
    totalPopulationImpacted: "35.4M",
    cityCount: 3,
    cityExamples: [
      {
        citySlug: "brussels",
        provenance: "City Achievement",
        interventionName: "Four-level governance integration — municipal to EU alignment",
        introducedYear: 2008,
        outcomeState: "measured",
        outcomeChange: "4 levels coordinated",
        chartData: {
          type: "governanceStaircase",
          steps: [
            { year: 2008, layer: "Municipal AQ office", result: "First monitoring mandate" },
            { year: 2012, layer: "Regional coordination", result: "Brussels-Capital standards" },
            { year: 2018, layer: "National clean air plan", result: "LEZ enforcement powers" },
            { year: 2021, layer: "EU alignment", result: "Cross-border PM2.5 targets" },
          ],
        },
      },
      {
        citySlug: "warsaw",
        provenance: "City Achievement",
        interventionName: "Rapid governance build-up — municipal to national in 5 years",
        introducedYear: 2016,
        outcomeState: "measured",
        outcomeChange: "3 levels in 5 years",
        chartData: {
          type: "governanceStaircase",
          steps: [
            { year: 2016, layer: "Municipal environment dept", result: "AQ monitoring expanded" },
            { year: 2018, layer: "National anti-smog act", result: "Coal heating ban enacted" },
            { year: 2021, layer: "Regional voivodeship plan", result: "Cross-district enforcement" },
          ],
        },
      },
      {
        citySlug: "bangkok",
        provenance: "BC Partnership",
        interventionName: "Crisis-driven governance — BMA emergency to national coordination",
        introducedYear: 2019,
        outcomeState: "baseline-established",
        outcomeChange: "2 levels active",
        chartData: {
          type: "governanceStaircase",
          steps: [
            { year: 2019, layer: "BMA emergency response", result: "PM2.5 crisis task force formed" },
            { year: 2024, layer: "National coordination", result: "Cross-ministry clean air push" },
          ],
        },
      },
    ],
    relatedPracticeIds: ["d4-policy-timeline", "d8-awareness"],
  },

  // Domain 10 — Funding, Sustainability & Progress Tracking
  {
    id: "d10-funding",
    name: "AQ Investment & Returns",
    domainId: 10,
    description: "Financing the clean air transition — municipal budgets, national grants, EU funds, and climate finance — and tracking whether investments deliver measurable air quality improvement.",
    totalPopulationImpacted: "10.8M",
    cityCount: 2,
    cityExamples: [
      {
        citySlug: "london",
        provenance: "City Achievement",
        interventionName: "Evidence-driven investment — monitoring to policy to funding",
        introducedYear: 2015,
        outcomeState: "measured",
        outcomeChange: "Evidence → investment",
        chartData: {
          type: "fundingProgression",
          steps: [
            { pillar: "Seeing", label: "100+ sensor network built", year: 2013 },
            { pillar: "Understanding", label: "Health burden quantified — 4,300 deaths/year", year: 2015 },
            { pillar: "Acting", label: "ULEZ phases 1–3 implemented", year: 2019 },
          ],
          outcome: "Evidence-driven case secured £875M in clean air investment",
        },
      },
      {
        citySlug: "warsaw",
        provenance: "City Achievement",
        interventionName: "Evidence-driven investment — monitoring to coal ban to funding",
        introducedYear: 2017,
        outcomeState: "measured",
        outcomeChange: "Evidence → investment",
        chartData: {
          type: "fundingProgression",
          steps: [
            { pillar: "Seeing", label: "Monitoring network expanded", year: 2016 },
            { pillar: "Understanding", label: "Coal identified as dominant PM source", year: 2017 },
            { pillar: "Acting", label: "Heating ban enacted", year: 2018 },
          ],
          outcome: "Demonstrated results unlocked PLN 2.1B for household transition",
        },
      },
    ],
    relatedPracticeIds: ["d4-policy-timeline", "d9-governance"],
  },

];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get a city by slug, or undefined if not found */
export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

/** Get a domain by slug, or undefined if not found */
export function getDomainBySlug(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}

/** Get a domain by numeric ID */
export function getDomainById(id: number): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}

/** Get all practice cards for a given domain ID */
export function getPracticesByDomain(domainId: number): PracticeCard[] {
  return PRACTICE_CARDS.filter((p) => p.domainId === domainId);
}

/** Get all practice cards that include a given city slug */
export function getPracticesByCity(citySlug: string): PracticeCard[] {
  return PRACTICE_CARDS.filter((p) =>
    p.cityExamples.some((ex) => ex.citySlug === citySlug)
  );
}

/** Get the coverage count for a city (how many domains they've acted in) */
export function getCoverageCount(citySlug: string): number {
  const row = COVERAGE_MATRIX[citySlug];
  if (!row) return 0;
  return row.filter(Boolean).length;
}

/** Get a practice card by ID */
export function getPracticeById(id: string): PracticeCard | undefined {
  return PRACTICE_CARDS.find((p) => p.id === id);
}

/** Stage colour mapping for wireframe badges — neutral tones */
export const STAGE_COLORS: Record<Stage, { bg: string; text: string }> = {
  "Seeing": { bg: "bg-blue-100", text: "text-blue-800" },
  "Understanding": { bg: "bg-amber-100", text: "text-amber-800" },
  "Acting": { bg: "bg-green-100", text: "text-green-800" },
  "Enabling": { bg: "bg-gray-100", text: "text-gray-700" },
};
