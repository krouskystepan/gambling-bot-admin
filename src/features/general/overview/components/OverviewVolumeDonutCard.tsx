'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import type { PieRenderSlice, VolumeSlice } from '@/lib/overview/volumeSlices'
import { cn } from '@/lib/utils'

import {
  OverviewVolumeDonut,
  OverviewVolumeLegend
} from './overviewVolumeDonut'

type OverviewVolumeDonutCardProps = {
  title: string
  description: string
  pieSlices: PieRenderSlice[]
  legendItems: VolumeSlice[]
  ringVisual: { paddingAngle: number; cornerRadius: number }
  chartConfig: ChartConfig
  totalVolume: number
  globalSettings: GlobalSettings
  className?: string
  emptyMessage?: string
  legendShareTotal?: number
  shareLabel?: string
  getLegendItemShareTotal?: (slice: VolumeSlice) => number
  getLegendItemShareLabel?: (slice: VolumeSlice) => string | undefined
  isLegendOnly?: (slice: VolumeSlice) => boolean
  isInactive?: (slice: VolumeSlice) => boolean
}

const OverviewVolumeDonutCard = ({
  title,
  description,
  pieSlices,
  legendItems,
  ringVisual,
  chartConfig,
  totalVolume,
  globalSettings,
  className,
  emptyMessage,
  legendShareTotal,
  shareLabel,
  getLegendItemShareTotal,
  getLegendItemShareLabel,
  isLegendOnly,
  isInactive
}: OverviewVolumeDonutCardProps) => {
  const hasPieData = pieSlices.length > 0
  const legendTotal = legendShareTotal ?? totalVolume

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="shrink-0 pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 min-h-[240px] flex-row items-center gap-3 pb-4 pt-0 sm:gap-4">
        {hasPieData ? (
          <>
            <div className="col-span-2 flex h-60 min-w-0 flex-1 items-center justify-center">
              <OverviewVolumeDonut
                slices={pieSlices}
                ringVisual={ringVisual}
                chartConfig={chartConfig}
                totalVolume={totalVolume}
                shareTotal={legendTotal}
                shareLabel={shareLabel}
                globalSettings={globalSettings}
              />
            </div>
            <OverviewVolumeLegend
              items={legendItems}
              totalVolume={totalVolume}
              globalSettings={globalSettings}
              getItemShareTotal={getLegendItemShareTotal}
              getItemShareLabel={getLegendItemShareLabel}
              isLegendOnly={isLegendOnly}
              isInactive={isInactive}
            />
          </>
        ) : (
          <p className="flex flex-1 items-center justify-center py-6 text-center text-sm text-muted-foreground">
            {emptyMessage ?? 'No volume in this period.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default OverviewVolumeDonutCard
