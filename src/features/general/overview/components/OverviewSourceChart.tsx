'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  type VolumeSlice,
  buildCasinoPieLegendSlices,
  buildPieRenderSlices,
  buildSourcePieLegendSlices,
  enrichPieOthersGroupedSlices,
  enrichSourcePieOthersGroupedSlices,
  getCasinoRingVisualProps,
  getCasinoSourceSlice,
  getNonCasinoSourceSlices,
  getSourcePieSlices,
  getSourceRingVisualProps,
  splitVolumeSlices,
  sumVolumeSliceAmounts
} from '@/lib/overview/volumeSlices'
import { cn } from '@/lib/utils'

import OverviewVolumeDonutCard from './OverviewVolumeDonutCard'
import { buildVolumePieChartConfig } from './overviewVolumeDonut'

type OverviewSourceChartProps = {
  data: VolumeSlice[]
  globalSettings: GlobalSettings
}

const CASINO_SOURCE_KEY = 'casino'

const OverviewSourceChart = ({
  data,
  globalSettings
}: OverviewSourceChartProps) => {
  const { sourceSlices, casinoSlices } = splitVolumeSlices(data)
  const sourcePieSlices = getSourcePieSlices(sourceSlices)
  const nonCasinoSourceSlices = getNonCasinoSourceSlices(sourceSlices)
  const casinoSourceSlice = getCasinoSourceSlice(sourceSlices)
  const activeCasinoSlices = casinoSlices.filter((slice) => slice.amount > 0)
  const sourcePieRenderSlices = enrichSourcePieOthersGroupedSlices(
    sourceSlices,
    buildPieRenderSlices(sourcePieSlices)
  )
  const sourceLegendSlices = buildSourcePieLegendSlices(
    sourcePieRenderSlices,
    casinoSourceSlice
  )
  const casinoPieRenderSlices = enrichPieOthersGroupedSlices(
    casinoSlices,
    buildPieRenderSlices(activeCasinoSlices)
  )
  const casinoLegendSlices = buildCasinoPieLegendSlices(
    casinoSlices,
    casinoPieRenderSlices
  )

  const hasData = data.some((row) => row.amount > 0)
  const sourceTotalVolume = sumVolumeSliceAmounts(sourceSlices)
  const nonCasinoTotalVolume = sumVolumeSliceAmounts(nonCasinoSourceSlices)
  const casinoTotalVolume = sumVolumeSliceAmounts(activeCasinoSlices)

  const sourceRingVisual = getSourceRingVisualProps(
    sourcePieRenderSlices,
    nonCasinoTotalVolume
  )
  const casinoRingVisual = getCasinoRingVisualProps(
    casinoPieRenderSlices,
    casinoTotalVolume
  )

  if (!hasData) {
    return (
      <Card className="flex min-h-[200px] flex-col">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle>Volume</CardTitle>
          <CardDescription>
            Absolute transaction amounts in period
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            No transaction volume in this period.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OverviewVolumeDonutCard
        title="Volume by source"
        description="Non-casino channel split — dashed items are legend only"
        pieSlices={sourcePieRenderSlices}
        legendItems={sourceLegendSlices}
        ringVisual={sourceRingVisual}
        chartConfig={buildVolumePieChartConfig(sourcePieRenderSlices)}
        totalVolume={sourceTotalVolume}
        legendShareTotal={nonCasinoTotalVolume}
        shareLabel="Share of non-casino"
        getLegendItemShareTotal={(slice) =>
          slice.key === CASINO_SOURCE_KEY
            ? sourceTotalVolume
            : nonCasinoTotalVolume
        }
        getLegendItemShareLabel={(slice) =>
          slice.key === CASINO_SOURCE_KEY
            ? 'Share of total'
            : 'Share of non-casino'
        }
        isLegendOnly={(slice) => slice.key === CASINO_SOURCE_KEY}
        globalSettings={globalSettings}
        className={cn(casinoTotalVolume <= 0 && 'lg:col-span-2')}
        emptyMessage="All volume is from casino games — see the games chart."
      />

      {casinoTotalVolume > 0 ? (
        <OverviewVolumeDonutCard
          title="Volume by game"
          description="Casino volume split across games"
          pieSlices={casinoPieRenderSlices}
          legendItems={casinoLegendSlices}
          ringVisual={casinoRingVisual}
          chartConfig={buildVolumePieChartConfig(casinoPieRenderSlices)}
          totalVolume={casinoTotalVolume}
          globalSettings={globalSettings}
        />
      ) : null}
    </div>
  )
}

export default OverviewSourceChart
