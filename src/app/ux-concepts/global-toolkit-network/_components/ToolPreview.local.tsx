/**
 * ToolPreview.local.tsx — selects the right sketch panel for a catalogue entry's preview.
 *
 * Purpose
 *   Maps a capability id (ToolId) to its visual sketch (from the co-located ToolPanels copy) and
 *   feeds it a single REPRESENTATIVE city's illustrative data (CITIES[0] from toolkit-data). The
 *   catalogue is not per-city, so one representative dataset is enough to render a recognisable
 *   preview for every card — the sketch communicates the SHAPE of the capability, not live numbers.
 *
 *   Concept-local vendored copy for the global-toolkit-network concept (promotion to client review
 *   hub, 2026-06-29): zero dependency on any sibling `toolkit` concept. Only the import paths differ
 *   from the source — data and panels now resolve to the concept-local copies.
 *
 * Key exports: ToolPreview
 * External dependencies: ./toolkit-data.local (CITIES, ToolId), ./ToolPanels.local (the sketch copy)
 */

'use client'

import React from 'react'
import { CITIES, type ToolId } from './toolkit-data.local'
import {
  MonitoringPanel,
  BenchmarkingPanel,
  SourceIdPanel,
  ForecastingPanel,
  HealthPanel,
  AdvocacyPanel,
  ActionPanel,
  OpenDataPanel,
} from './ToolPanels.local'

/** The representative city whose illustrative data drives every preview sketch. */
const SAMPLE = CITIES[0]

type Props = {
  /** Which capability's sketch to render. */
  id: ToolId
}

/** Render the sketch panel for the given capability id, fed the representative sample data. */
export function ToolPreview({ id }: Props): React.ReactElement | null {
  switch (id) {
    case 'monitoring':
      return <MonitoringPanel sensors={SAMPLE.sensors} stationCount={SAMPLE.stationCount} />
    case 'benchmarking':
      return (
        <BenchmarkingPanel
          currentAqi={SAMPLE.currentAqi}
          whoGuideline={SAMPLE.whoGuideline}
          nationalStandard={SAMPLE.nationalStandard}
          nationalStandardLabel={SAMPLE.nationalStandardLabel}
        />
      )
    case 'sourceId':
      return <SourceIdPanel sources={SAMPLE.sources} />
    case 'forecasting':
      return <ForecastingPanel forecast={SAMPLE.forecast} />
    case 'health':
      return <HealthPanel alerts={SAMPLE.alerts} />
    case 'advocacy':
      return (
        <AdvocacyPanel
          trendLine={SAMPLE.trendLine}
          trendStat={SAMPLE.trendStat}
          trendDirection={SAMPLE.trendDirection}
        />
      )
    case 'action':
      return <ActionPanel actions={SAMPLE.actions} />
    case 'openData':
      return <OpenDataPanel dataRows={SAMPLE.dataRows} apiEndpoint={SAMPLE.apiEndpoint} />
    default:
      return null
  }
}
