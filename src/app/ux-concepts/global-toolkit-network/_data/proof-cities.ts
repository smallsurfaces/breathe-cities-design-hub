/**
 * proof-cities.ts — concept-local city + tool directory for the proof-directory globe (v3).
 *
 * Purpose
 *   The single data source for the /ux-concepts/global-toolkit-network proof-directory section.
 *   Every pin on the globe and every tool row in a city panel comes from this file. It is OWNED
 *   by this concept and built fresh — it deliberately does NOT read from the aq-network-v2
 *   programme snapshot or any other concept's data (full-isolation rule from the section brief).
 *
 * v3 model — the honesty swap (supersedes v2's illustrative-tools model)
 *   v2 carried three "anchor" cities with real tools and links, and filled every other city with
 *   PLAUSIBLE but invented "illustrative" tool rows (each tagged `illustrative: true`, links off).
 *   v3 REMOVES that invention entirely (Jack, founder call, 2026-06-26): EVERY tool in EVERY city is
 *   now REAL and research-grounded — drawn from the 16-city City Product Mapping. The `illustrative`
 *   flag is RETIRED; there are no guessed tools left to flag. Honesty now rides the LINK STATE alone:
 *     - A tool with a real proven-live `url` renders the active "See the tool →" CTA.
 *     - A tool with `url: null` renders the existing visibly DISABLED "Link coming soon".
 *   Most cities deliberately carry some `null` links — that absence IS the honesty mechanic (we hold
 *   no proven-live URL for that tool), not a gap to be filled. Each city also carries a one-line
 *   `story`: a real, research-grounded adoption note shown at the top of the panel body.
 *
 * The honesty model (the project's backbone — see proof-directory-v2-design-spec.md §4)
 *   - Population is CITY POPULATION, always a labelled estimate — never "people reached/served".
 *   - Every tool ROW is real and research-grounded; its live-link CTA only fires on a real,
 *     proven-live URL. Where we hold no URL the CTA is rendered visibly DISABLED ("Link coming
 *     soon"). There is no longer any invented/illustrative row — the link state is the only signal.
 *   - Third-party tool links are framed "see the tool this city uses" via `provider` (e.g. WAQI,
 *     OpenAQ, AirQo) — not "visit the city's own site". `provider: null` = city/region-owned tool.
 *
 * Data provenance (every tool real & research-grounded — Jack's locked call 2026-06-26)
 *   - Tool rows (name / blurb / category / provider) + per-city stories: the 16-city
 *       "City Product Mapping" research set.
 *   - Live-link URLs: the Live-Link Manifest (2026-06-26) — the proven-live set as of that date.
 *   - Coordinates + city populations are public-knowledge estimates (labelled as estimates in UI).
 *   Corollary (re-ping at promotion): these URLs are the 2026-06-26 proven-live set ONLY. They must
 *   be re-pinged for liveness at any client-tier promotion before this concept goes client-facing —
 *   a link proven live today is not guaranteed live at promotion.
 *
 * Key exports: ProofCity, ProofTool, ToolCategory, CapabilityDeployment (types); PROOF_CITIES (const);
 *   toolMatchesCapability, getTotalCityPopulation, getToolUsageCounts, getToolDeploymentsByCapability
 *   (pure helpers).
 * External dependencies: none (plain data + pure functions).
 */

/** A tool's catalogue category — mirrors the toolkit's Component / Guidance split. */
export type ToolCategory = 'Component' | 'Guidance'

/**
 * One tool row inside a city panel. Every tool is real and research-grounded (v3 — the illustrative
 * concept is retired). `url` is the honest bit: a real proven-live URL renders the active "See the
 * tool →" CTA; `null` renders a visibly DISABLED "Link coming soon" (most cities carry some `null`
 * links deliberately — absence of a proven link is the honesty mechanic). `provider` labels
 * third-party products ("via AirQo" etc.); `null` means the tool is city/region-owned.
 */
export type ProofTool = {
  /** Stable id, unique within a city (used as React key). */
  id: string
  /** Tool / product name as shown in the row heading. */
  name: string
  /** One-line plain-language blurb of what the tool does for that city (revealed on row expand). */
  blurb: string
  /** Catalogue category tag. */
  category: ToolCategory
  /** Real proven-live URL → active CTA. `null` → disabled "Link coming soon" (no proven link held). */
  url: string | null
  /** Third-party product label, e.g. "AirQo", "WAQI", "OpenAQ". `null` for none/city-owned. */
  provider: string | null
}

/**
 * One city on the globe. v2+: every city is a uniform BC member — there is no pin-state field.
 * `population` is CITY POPULATION (a labelled estimate), never reach. `story` is a one-line, real
 * adoption note shown at the top of the panel body. `tools` is the list of real tools that city
 * runs (v3 — all real and research-grounded). Every city carries at least one tool.
 */
export type ProofCity = {
  /** Stable slug / React key. */
  slug: string
  /** City display name. */
  name: string
  /** Country display name. */
  country: string
  /** Region tag shown in the panel (LatAm / EU / Africa / etc.). */
  region: string
  /** [lng, lat] for the Mapbox pin. */
  coordinates: [number, number]
  /** City population — a labelled estimate (shown with the Estimate pill). */
  population: number
  /** One-line proof summary surfaced in the sticky panel header (e.g. "Running 5 AQ tools."). */
  summary: string
  /** One-line real adoption story, shown as a lead paragraph at the top of the panel body. */
  story: string
  /** Tools this city runs — all real and research-grounded. Every city has at least one. */
  tools: ProofTool[]
}

/**
 * The directory — 16 cities, every tool real and research-grounded (v3 honesty swap). Honesty rides
 * the link state: a tool has an active CTA only where its `url` is a proven-live link, otherwise the
 * CTA is visibly disabled. Most cities deliberately carry some `null` links. Every city is a uniform
 * clickable BC member — no tier states. City populations are public estimates (UN/national-census
 * order of magnitude) — labelled as estimates throughout the UI.
 */
export const PROOF_CITIES: ProofCity[] = [
  // ── LatAm ──────────────────────────────────────────────────────────────────────
  {
    slug: 'cdmx',
    name: 'Mexico City',
    country: 'Mexico',
    region: 'LatAm',
    coordinates: [-99.1332, 19.4326],
    population: 9_200_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Mexico City runs SIMAT, a 35-station fixed monitoring network. Its readings are publicly available through WAQI and the OpenAQ API.',
    tools: [
      {
        id: 'cdmx-simat',
        name: 'SIMAT',
        blurb: "The city's own real-time monitoring network, around 35 fixed stations across the metro area.",
        category: 'Component',
        url: null,
        provider: null,
      },
      {
        id: 'cdmx-waqi',
        name: 'Real-time AQI map',
        blurb: 'City-level PM2.5 from SIMAT stations, surfaced on a public map.',
        category: 'Component',
        url: 'https://waqi.info',
        provider: 'WAQI',
      },
      {
        id: 'cdmx-openaq',
        name: 'Open data API',
        blurb: 'SIMAT data made machine-readable, documented and downloadable for researchers.',
        category: 'Component',
        url: 'https://api.openaq.org',
        provider: 'OpenAQ',
      },
    ],
  },

  // ── EU ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'EU',
    coordinates: [2.3522, 48.8566],
    population: 2_100_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Airparif gives Paris a dense real-time network with neighbourhood coverage, WHO-referenced framing, and a public 72-hour forecast.',
    tools: [
      {
        id: 'paris-airparif',
        name: 'Airparif',
        blurb: 'Dense real-time network with neighbourhood-level coverage and a public 72-hour forecast.',
        category: 'Component',
        url: 'https://www.airparif.fr',
        provider: 'Airparif',
      },
      {
        id: 'paris-opendata',
        name: 'Open data portal',
        blurb: 'Documented AQ datasets available for download and reuse.',
        category: 'Component',
        url: null,
        provider: 'Airparif',
      },
      {
        id: 'paris-eea',
        name: 'European peer comparison',
        blurb: 'Cross-country position against EU cities via the European Environment Agency.',
        category: 'Guidance',
        url: 'https://www.eea.europa.eu',
        provider: 'EEA',
      },
    ],
  },
  {
    slug: 'london',
    name: 'London',
    country: 'United Kingdom',
    region: 'EU',
    coordinates: [-0.1278, 51.5074],
    population: 8_900_000,
    summary: 'Running 4 air quality tools.',
    story:
      'London layers a reference network, a 400-site community sensor map, an emissions inventory, and a forecast with health advice.',
    tools: [
      {
        id: 'london-laqn',
        name: 'LondonAir (LAQN)',
        blurb: 'Imperial College reference network across all London boroughs, with a real-time map and forecast.',
        category: 'Component',
        url: 'https://www.londonair.org.uk',
        provider: 'Imperial College ERG',
      },
      {
        id: 'london-breathe',
        name: 'Breathe London',
        blurb: 'A 400-site hyperlocal community sensor network sited near roads, schools and hospitals.',
        category: 'Component',
        url: null,
        provider: 'Imperial College ERG',
      },
      {
        id: 'london-ukair',
        name: 'UK-AIR national data',
        blurb: 'National reference stations, the daily air-quality index, and bulk open data.',
        category: 'Component',
        url: 'https://uk-air.defra.gov.uk',
        provider: 'Defra',
      },
      {
        id: 'london-airtext',
        name: 'airTEXT forecast',
        blurb: 'Three-day forecast with action guidance for at-risk groups via SMS, email and app.',
        category: 'Guidance',
        url: 'https://www.airtext.info',
        provider: 'CERC',
      },
    ],
  },
  {
    slug: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    region: 'EU',
    coordinates: [-3.7038, 40.4168],
    population: 3_400_000,
    summary: 'Running 5 air quality tools.',
    story:
      'Madrid owns a 24-station network, an AI forecast, and an interactive street-level concentration map across the city.',
    tools: [
      {
        id: 'madrid-portal',
        name: 'Air-quality portal',
        blurb: 'City-owned hub: 24 reference stations updated every 20 minutes, with index and history.',
        category: 'Component',
        url: 'https://airedemadrid.madrid.es/portal/site/calidadaire',
        provider: null,
      },
      {
        id: 'madrid-streetmap',
        name: 'Street-level concentration map',
        blurb: 'NO2 and PM10 modelled across 56,000 points, queryable by address with route exposure.',
        category: 'Component',
        url: 'https://airedemadrid.madrid.es/portales/calidadaire/es/En-portada/Mapa-de-concentracion-de-contaminantes-por-calle-estimacion-/',
        provider: null,
      },
      {
        id: 'madrid-opendata',
        name: 'Open data portal',
        blurb: 'Real-time and historical data from 2001 in JSON, XML and CSV with an API.',
        category: 'Component',
        url: 'https://datos.madrid.es/egob/catalogo/212531-0-calidad-aire-tiempo-real',
        provider: null,
      },
      {
        id: 'madrid-lez',
        name: 'Low Emission Zone (Madrid 360)',
        blurb: 'City-wide low-emission zone with a documented drop in roadside NO2 since 2019.',
        category: 'Guidance',
        url: 'https://www.madrid.es/portales/munimadrid/es/Inicio/Movilidad-y-transportes/Zonas-de-Bajas-Emisiones/Madrid-Zona-de-Bajas-Emisiones/Madrid-Zona-de-Bajas-Emisiones-ZBE-/',
        provider: null,
      },
      {
        id: 'madrid-socaire',
        name: 'SOCAIRE forecast',
        blurb: "The city's own AI forecast for NO2, ozone, PM10 and PM2.5.",
        category: 'Component',
        url: null,
        provider: null,
      },
    ],
  },
  {
    slug: 'milan',
    name: 'Milan',
    country: 'Italy',
    region: 'EU',
    coordinates: [9.1900, 45.4642],
    population: 1_370_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Milan reads its air through the regional ARPA Lombardia reference network plus a citizen-science NO2 map run by a local NGO.',
    tools: [
      {
        id: 'milan-arpa',
        name: 'ARPA Lombardia',
        blurb: 'Regional reference network of around 83 stations with real-time maps and a daily forecast.',
        category: 'Component',
        url: 'https://www.arpalombardia.it/temi-ambientali/aria/',
        provider: 'ARPA Lombardia',
      },
      {
        id: 'milan-amat',
        name: 'AMAT daily report',
        blurb: "The city's own daily air-quality report, derived from regional data. Published October to March only.",
        category: 'Component',
        url: null,
        provider: 'AMAT / Comune di Milano',
      },
      {
        id: 'milan-cittadini',
        name: "Cittadini per l'aria",
        blurb: 'Citizen-science NO2 map benchmarked against WHO, run by a Milan NGO.',
        category: 'Guidance',
        url: 'https://cittadiniperlaria.org',
        provider: "Cittadini per l'aria",
      },
    ],
  },
  {
    slug: 'warsaw',
    name: 'Warsaw',
    country: 'Poland',
    region: 'EU',
    coordinates: [21.0122, 52.2297],
    population: 1_800_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Warsaw runs a city-owned 165-sensor network on top of the national system and has steadily reduced its PM2.5 levels over the past decade.',
    tools: [
      {
        id: 'warsaw-gios',
        name: 'GIOŚ air-quality portal',
        blurb: 'National reference network with nine Warsaw stations and a 72-hour forecast.',
        category: 'Component',
        url: 'https://powietrze.gios.gov.pl/pjp/current',
        provider: 'GIOŚ',
      },
      {
        id: 'warsaw-waqi',
        name: 'Warsaw Air Quality Index',
        blurb: 'City-owned 165-sensor network across every district, in the Warszawa 19115 app.',
        category: 'Component',
        url: null,
        provider: 'City of Warsaw / Airly',
      },
      {
        id: 'warsaw-smogalert',
        name: 'Smog alert advocacy',
        blurb: 'A national clean-air movement running boiler-replacement and coal-ban campaigns.',
        category: 'Guidance',
        url: null,
        provider: 'Polski Alarm Smogowy',
      },
    ],
  },
  {
    slug: 'sofia',
    name: 'Sofia',
    country: 'Bulgaria',
    region: 'EU',
    coordinates: [23.3219, 42.6977],
    population: 1_300_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Sofia tracks its air through 300-plus citizen sensors. A city programme has replaced thousands of solid-fuel home heating systems as part of its clean-air plan.',
    tools: [
      {
        id: 'sofia-airbg',
        name: 'AirBG.info citizen network',
        blurb: 'Over 300 real-time citizen PM sensors, the densest neighbourhood layer in the set.',
        category: 'Component',
        url: null,
        provider: 'Sensor.Community',
      },
      {
        id: 'sofia-eea',
        name: 'EEA European index',
        blurb: 'Live Sofia stations benchmarked against WHO and EU air-quality bands.',
        category: 'Component',
        url: 'https://airindex.eea.europa.eu/AQI/index.html',
        provider: 'EEA',
      },
      {
        id: 'sofia-breathe',
        name: 'Breathe Sofia',
        blurb: 'City and Clean Air Fund programme behind the heating-system replacement push.',
        category: 'Guidance',
        url: null,
        provider: 'Clean Air Fund',
      },
    ],
  },
  {
    slug: 'brussels',
    name: 'Brussels',
    country: 'Belgium',
    region: 'EU',
    coordinates: [4.3517, 50.8503],
    population: 1_200_000,
    summary: 'Running 4 air quality tools.',
    story:
      'Brussels mapped its air with 3,000 citizen sites in 2021 and runs a region-wide low-emission zone.',
    tools: [
      {
        id: 'brussels-environnement',
        name: 'Bruxelles Environnement',
        blurb: 'Region-owned real-time dashboard, 14 stations, with a mobile app and peak alerts.',
        category: 'Component',
        url: 'https://qualitedelair.brussels',
        provider: 'Bruxelles Environnement',
      },
      {
        id: 'brussels-irceline',
        name: 'IRCELINE / BelAQI index',
        blurb: 'Belgium-wide real-time maps and a WHO-aligned air-quality index with forecast.',
        category: 'Component',
        url: 'https://www.irceline.be/en',
        provider: 'IRCELINE',
      },
      {
        id: 'brussels-curieuzenair',
        name: 'CurieuzenAir',
        blurb: 'World-first citizen-science campaign mapping NO2 at 3,000 sites across the region.',
        category: 'Guidance',
        url: 'https://curieuzenair.brussels',
        provider: 'CurieuzenAir consortium',
      },
      {
        id: 'brussels-lez',
        name: 'Low Emission Zone',
        blurb: 'Region-wide low-emission zone with a documented drop in roadside NO2.',
        category: 'Guidance',
        url: 'https://lez.brussels',
        provider: null,
      },
    ],
  },

  // ── Africa ─────────────────────────────────────────────────────────────────────
  {
    slug: 'accra',
    name: 'Accra',
    country: 'Ghana',
    region: 'Africa',
    coordinates: [-0.1870, 5.6037],
    population: 2_600_000,
    summary: 'Running 4 air quality tools.',
    story:
      "Accra reads its air through AirQo's low-cost sensor network, with the national EPA portal anchoring official monitoring.",
    tools: [
      {
        id: 'accra-airqo',
        name: 'AirQo',
        blurb: 'Low-cost sensor network built for African cities, with open data and an API.',
        category: 'Component',
        url: 'https://airqo.net',
        provider: 'AirQo',
      },
      {
        id: 'accra-ghana-epa',
        name: 'Ghana EPA AQ portal',
        blurb: "The national environment agency's official monitoring portal, including Accra station data.",
        category: 'Component',
        url: null,
        provider: 'Ghana EPA',
      },
      {
        id: 'accra-cana',
        name: 'Clean Air Network Africa',
        blurb: 'Pan-African clean-air network for capacity building and shared monitoring data.',
        category: 'Guidance',
        url: 'https://cleanairafrica.org',
        provider: 'Clean Air Network Africa',
      },
      {
        id: 'accra-breathecities',
        name: 'Breathe Cities',
        blurb: 'Programme partner for clean-air monitoring and funding in the city.',
        category: 'Guidance',
        url: 'https://breathecities.org',
        provider: 'Clean Air Fund',
      },
    ],
  },
  {
    slug: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    region: 'Africa',
    coordinates: [36.8219, -1.2921],
    population: 4_400_000,
    summary: 'Running 4 air quality tools.',
    story:
      "Nairobi launched its first 50-sensor city network in 2025, on top of AirQo's live data layer.",
    tools: [
      {
        id: 'nairobi-airqo',
        name: 'AirQo',
        blurb: "Nairobi's main live data layer: real-time PM2.5 map, app, forecast, and open API.",
        category: 'Component',
        url: 'https://airqo.net',
        provider: 'AirQo',
      },
      {
        id: 'nairobi-cana',
        name: 'Clean Air Network Africa',
        blurb: 'AirQo-led pan-African convening network; hosted its 2025 forum in Nairobi.',
        category: 'Guidance',
        url: 'https://cleanairafrica.org',
        provider: 'Clean Air Network Africa',
      },
      {
        id: 'nairobi-afriqair',
        name: 'AfriqAir',
        blurb: 'Hybrid research monitoring network with a Nairobi node via the University of Nairobi.',
        category: 'Component',
        url: 'https://www.cmu.edu/epp/afriqair',
        provider: 'AfriqAir',
      },
      {
        id: 'nairobi-breathecities',
        name: 'Breathe Cities',
        blurb: "Programme behind the city's 2025 50-sensor network and clean-air commitments.",
        category: 'Guidance',
        url: 'https://breathecities.org',
        provider: 'Clean Air Fund',
      },
    ],
  },
  {
    slug: 'addis-ababa',
    name: 'Addis Ababa',
    country: 'Ethiopia',
    region: 'Africa',
    coordinates: [38.7578, 9.0250],
    population: 5_000_000,
    summary: 'Running 3 air quality tools.',
    story:
      "Addis Ababa's monitoring is fragmented and its most accessible public data source went offline in early 2026. It represents a city where the toolkit's open data and forecasting components would have the most impact.",
    tools: [
      {
        id: 'addis-airqo',
        name: 'AirQo',
        blurb: 'Regional low-cost network with around six Ethiopia monitors. Addis Ababa has limited coverage.',
        category: 'Component',
        url: 'https://airqo.net',
        provider: 'AirQo',
      },
      {
        id: 'addis-cana',
        name: 'Clean Air Network Africa',
        blurb: 'Pan-African convening network; Addis sits within its regional clean-air projects.',
        category: 'Guidance',
        url: 'https://cleanairafrica.org',
        provider: 'Clean Air Network Africa',
      },
      {
        id: 'addis-breathecities',
        name: 'Breathe Cities',
        blurb: "Programme membership behind the city's clean-air management plan and declarations.",
        category: 'Guidance',
        url: 'https://breathecities.org',
        provider: 'Clean Air Fund',
      },
    ],
  },
  {
    slug: 'johannesburg',
    name: 'Johannesburg',
    country: 'South Africa',
    region: 'Africa',
    coordinates: [28.0473, -26.2041],
    population: 5_600_000,
    summary: 'Running 4 air quality tools.',
    story:
      "Johannesburg is developing Africa's first Clean Air Zone. Its official monitoring stations are public, though most have been offline, making community and open-data feeds the practical data layer.",
    tools: [
      {
        id: 'johannesburg-saaqis',
        name: 'SAAQIS national portal',
        blurb: 'National platform carrying live City of Johannesburg stations, though most are offline.',
        category: 'Component',
        url: null,
        provider: 'DFFE / SAWS',
      },
      {
        id: 'johannesburg-cana',
        name: 'Clean Air Network Africa',
        blurb: 'Pan-African convening network with South Africa in scope.',
        category: 'Guidance',
        url: 'https://cleanairafrica.org',
        provider: 'Clean Air Network Africa',
      },
      {
        id: 'johannesburg-afriqair',
        name: 'AfriqAir',
        blurb: 'Research monitoring network with South Africa as a deployment country.',
        category: 'Component',
        url: 'https://www.cmu.edu/epp/afriqair',
        provider: 'AfriqAir',
      },
      {
        id: 'johannesburg-breathecities',
        name: 'Breathe Cities',
        blurb: "Programme behind the city's Clean Air Zone and a commissioned source-apportionment study.",
        category: 'Guidance',
        url: 'https://breathecities.org',
        provider: 'Clean Air Fund',
      },
    ],
  },

  // ── LatAm ──────────────────────────────────────────────────────────────────────
  {
    slug: 'bogota',
    name: 'Bogotá',
    country: 'Colombia',
    region: 'LatAm',
    coordinates: [-74.0721, 4.7110],
    population: 7_900_000,
    summary: 'Running 4 air quality tools.',
    story:
      'Bogotá runs the RMCAB reference network and the IBOCA health-risk index, with a public forecast and health-banded alerts.',
    tools: [
      {
        id: 'bogota-rmcab',
        name: 'RMCAB monitoring network',
        blurb: 'City-owned reference network running since 1997, reporting hourly across about 20 stations.',
        category: 'Component',
        url: null,
        provider: null,
      },
      {
        id: 'bogota-iboca',
        name: 'IBOCA health-risk index',
        blurb: 'City health-risk index with a 90-hour forecast and colour-banded health advice.',
        category: 'Guidance',
        url: null,
        provider: null,
      },
      {
        id: 'bogota-waqi',
        name: 'Real-time AQI map',
        blurb: "Live consumer AQI sourced from the city's official observatory feed.",
        category: 'Component',
        url: 'https://aqicn.org/city/bogota/',
        provider: 'WAQI',
      },
      {
        id: 'bogota-iqair',
        name: 'Annual trend record',
        blurb: "WHO-referenced consumer AQI with the city's multi-year PM2.5 trend.",
        category: 'Guidance',
        url: 'https://www.iqair.com/us/colombia/bogota-dc/bogota',
        provider: 'IQAir',
      },
    ],
  },
  {
    slug: 'rio-de-janeiro',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'LatAm',
    coordinates: [-43.1729, -22.9068],
    population: 6_700_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Rio owns MonitorAr-Rio, a city monitoring network with more than a decade of open data covering PM2.5 and other pollutants.',
    tools: [
      {
        id: 'rio-monitorar',
        name: 'MonitorAr-Rio',
        blurb: 'City-owned network since 2000, eight reference plus compact stations, with a daily public dashboard.',
        category: 'Component',
        url: 'https://ambienteclima.prefeitura.rio/monitoramento-diario-da-qualidade-do-ar/',
        provider: null,
      },
      {
        id: 'rio-datario',
        name: 'data.rio open data',
        blurb: 'Hourly MonitorAr data from 2011 onward, downloadable via CSV, GeoJSON and API.',
        category: 'Component',
        url: 'https://www.data.rio/datasets/5b1bf5c3e5114564bbf9b7a372b85e17_2',
        provider: null,
      },
      {
        id: 'rio-inea',
        name: 'State monitoring network',
        blurb: 'State-level real-time index and daily bulletin across the metro region.',
        category: 'Component',
        url: null,
        provider: 'INEA',
      },
    ],
  },

  // ── SE Asia ────────────────────────────────────────────────────────────────────
  {
    slug: 'jakarta',
    name: 'Jakarta',
    country: 'Indonesia',
    region: 'SE Asia',
    coordinates: [106.8456, -6.2088],
    population: 10_600_000,
    summary: 'Running 4 air quality tools.',
    story:
      'Jakarta runs a public city dashboard, and a landmark 2021 court ruling set a legal mandate for air quality improvement across the city.',
    tools: [
      {
        id: 'jakarta-dashboard',
        name: 'Jakarta air-quality dashboard',
        blurb: 'City-owned real-time dashboard from the environment agency, reporting PM2.5 across the city.',
        category: 'Component',
        url: 'https://udara.jakarta.go.id',
        provider: 'DLH DKI Jakarta',
      },
      {
        id: 'jakarta-nafas',
        name: 'Nafas',
        blurb: "Indonesia's densest hyperlocal sensor app, with education content and pre-activity checks.",
        category: 'Component',
        url: 'https://www.nafas.dev/learn',
        provider: 'Nafas',
      },
      {
        id: 'jakarta-iqair',
        name: 'Real-time AQI',
        blurb: 'WHO-referenced consumer AQI aggregating dozens of Jakarta stations, with forecast.',
        category: 'Component',
        url: 'https://www.iqair.com/indonesia/jakarta',
        provider: 'IQAir',
      },
      {
        id: 'jakarta-sourceapp',
        name: 'Source apportionment study',
        blurb: "First multisite study of Jakarta's airshed, naming transport and burning as top sources.",
        category: 'Guidance',
        url: null,
        provider: 'Vital Strategies / ITB',
      },
    ],
  },
  {
    slug: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    region: 'SE Asia',
    coordinates: [100.5018, 13.7563],
    population: 10_700_000,
    summary: 'Running 3 air quality tools.',
    story:
      'Bangkok\'s metropolitan administration runs a city dashboard, and Breathe Bangkok built a 2024 emissions inventory.',
    tools: [
      {
        id: 'bangkok-airbkk',
        name: 'AirBKK (BMA)',
        blurb: 'The city-owned dashboard: real-time PM2.5 across district stations, updated three times daily.',
        category: 'Component',
        url: 'https://www.airbkk.com',
        provider: 'BMA',
      },
      {
        id: 'bangkok-waqi',
        name: 'Real-time AQI',
        blurb: 'Live Bangkok AQI converted to the US EPA standard, with a forecast page.',
        category: 'Component',
        url: 'https://aqicn.org/city/bangkok/',
        provider: 'WAQI',
      },
      {
        id: 'bangkok-iqair',
        name: 'Air-quality with forecast',
        blurb: 'WHO-referenced consumer AQI aggregating 400-plus Bangkok-area stations, with forecast.',
        category: 'Component',
        url: 'https://www.iqair.com/thailand/bangkok/bangkok',
        provider: 'IQAir',
      },
    ],
  },
]

/**
 * Total CITY POPULATION across every plotted city. This is the section's aggregate stat — a
 * "why it matters" human-scale figure, shown with an Estimate pill. It is city population, NEVER
 * an implied "people reached/served" number (honesty rule).
 */
export function getTotalCityPopulation(cities: ProofCity[]): number {
  return cities.reduce((sum, city) => sum + city.population, 0)
}

/**
 * The SINGLE match predicate for "does this tool express this capability". A tool matches a capability
 * when any of that capability's keywords is a case-insensitive substring of the tool's name + blurb
 * (the only two fields the match has ever read). Factored out so every consumer — the catalogue
 * prevalence counts (getToolUsageCounts), the per-capability deployment list
 * (getToolDeploymentsByCapability), AND the city panel's category-led rows (getCityCapabilityRows) —
 * shares ONE definition and can never disagree. Changing matching behaviour now means changing this
 * one function.
 */
export function toolMatchesCapability(tool: ProofTool, keywords: readonly string[]): boolean {
  const haystack = `${tool.name} ${tool.blurb}`.toLowerCase()
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()))
}

/**
 * Count, per catalogue capability, how many cities run a tool matching that capability. WIRED into
 * the UI: this count drives the catalogue cards' prevalence-counter line ("{N} BC cities offer
 * something like this for their citizens"). The detailed WHICH-cities list is reserved for the
 * component detail page (see getToolDeploymentsByCapability).
 *
 * Why a keyword map rather than a hard join: the proof-cities tool names are product/city-voice
 * ("LondonAir (LAQN)", "ARPA Lombardia") while the catalogue entries are capability-voice ("Real-time
 * Monitoring"). This maps each catalogue capability id to the keywords that signal its presence in a
 * city's tool list, then counts distinct cities — an honest "adoption breadth" approximation for the
 * concept, not a production data contract (the cards carry breadth, not human scale — number-homes rule).
 * Uses the shared toolMatchesCapability predicate so the count and the panel rows never diverge.
 */
export function getToolUsageCounts(
  cities: ProofCity[],
  keywordsByCapability: Record<string, readonly string[]>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const capabilityId of Object.keys(keywordsByCapability)) {
    const keywords = keywordsByCapability[capabilityId]
    let cityCount = 0
    for (const city of cities) {
      if (city.tools.some((tool) => toolMatchesCapability(tool, keywords))) {
        cityCount += 1
      }
    }
    counts[capabilityId] = cityCount
  }
  return counts
}

/**
 * One city's OWN deployment of a catalogue capability — the honest unit behind the catalogue card's
 * explorable city list. A deployment means "this city runs its OWN version of this capability" (e.g.
 * SIMAT, Airparif, AirQo), NOT that the city adopted the BC toolkit's component. The `url` is the
 * manifest-gated link to that city's REAL tool (carried straight off the matched ProofTool, never
 * synthesised): a proven-live URL → render a link to the city's own tool; `null` → render unlinked
 * (no proven-live link held). `toolName` is the city's real product name, surfaced as the chip title.
 */
export type CapabilityDeployment = {
  /** City slug (stable key). */
  slug: string
  /** City display name — the chip label. */
  name: string
  /** The city's OWN tool name that matched this capability — shown as the chip title. */
  toolName: string
  /** Manifest-gated link to the city's own tool. Proven-live URL → linked; `null` → unlinked. */
  url: string | null
}

/**
 * Build, per catalogue capability id, the list of cities that run their OWN version of that
 * capability. For each capability, scans cities in natural order (no sorting); for each city takes
 * the FIRST tool whose name+blurb matches any keyword (same case-insensitive substring logic as
 * getToolUsageCounts) and records that city's own tool name + manifest-gated url.
 *
 * Honesty (the point of this helper): a listed city runs ITS OWN version of the capability — it has
 * NOT adopted the BC toolkit's component. The `url` is the link to that city's real tool exactly as
 * held in the data (`null` = no proven-live link, render the city unlinked). No url is inferred,
 * fixed, or pointed at a BC product.
 *
 * RESERVED FOR THE COMPONENT DETAIL PAGE: this helper (and the CapabilityDeployment type) is retained
 * but NOT currently wired into the landing cards — the cards now show only a prevalence counter via
 * getToolUsageCounts. The detailed WHICH-cities + per-city tool-link list this builds is intended for
 * the per-component detail page (separate task).
 */
export function getToolDeploymentsByCapability(
  cities: ProofCity[],
  keywordsByCapability: Record<string, readonly string[]>,
): Record<string, CapabilityDeployment[]> {
  const deployments: Record<string, CapabilityDeployment[]> = {}
  for (const capabilityId of Object.keys(keywordsByCapability)) {
    const keywords = keywordsByCapability[capabilityId]
    const cityDeployments: CapabilityDeployment[] = []
    for (const city of cities) {
      const matchedTool = city.tools.find((tool) => toolMatchesCapability(tool, keywords))
      if (matchedTool !== undefined) {
        cityDeployments.push({
          slug: city.slug,
          name: city.name,
          toolName: matchedTool.name,
          url: matchedTool.url,
        })
      }
    }
    deployments[capabilityId] = cityDeployments
  }
  return deployments
}
