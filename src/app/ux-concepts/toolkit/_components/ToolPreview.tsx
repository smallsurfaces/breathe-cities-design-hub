/**
 * ToolPreview.tsx — selects the right sketch panel for a catalogue entry's preview.
 *
 * Purpose
 *   Maps a capability id (ToolId) to its visual sketch (from the co-located ToolPanels copy) and
 *   feeds it a single REPRESENTATIVE city's illustrative data (CITIES[0] from toolkit-data). The
 *   catalogue is not per-city, so one representative dataset is enough to render a recognisable
 *   preview for every card — the sketch communicates the SHAPE of the capability, not live numbers.
 *
 * Key exports: ToolPreview
 * External dependencies: @/data/toolkit-data (CITIES, ToolId), ./ToolPanels (the sketch copy)
 */

'use client'

import React from 'react'
import { CITIES, type ToolId } from '@/data/toolkit-data'
import {
  MonitoringPanel,
  BenchmarkingPanel,
  SourceIdPanel,
  ForecastingPanel,
  HealthPanel,
  AdvocacyPanel,
  ActionPanel,
  OpenDataPanel,
} from './ToolPanels'

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
