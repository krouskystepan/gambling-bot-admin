'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { Pie, PieChart } from 'recharts'

import type { ReactNode } from 'react'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { PieRenderSlice, VolumeSlice } from '@/lib/overview/volumeSlices'
import { cn } from '@/lib/utils'

import { formatOverviewCurrency } from '../overviewFormatters'

const PIE_CENTER = { cx: '50%', cy: '50%' } as const
const PIE_RADII = { innerRadius: '52%', outerRadius: '82%' } as const
const PIE_STROKE = {
  strokeWidth: 1,
  stroke: 'var(--background)'
} as const

function withPieFill(slices: PieRenderSlice[]) {
  return slices.map((slice) => ({ ...slice, fill: slice.color }))
}

function formatSignedCurrency(
  value: number,
  globalSettings: GlobalSettings
): string {
  const formatted = formatOverviewCurrency(Math.abs(value), globalSettings)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

export function formatVolumeSharePercent(
  amount: number,
  total: number
): number {
  if (total <= 0 || amount <= 0) return 0

  const pct = (amount / total) * 100
  const rounded = Math.round(pct * 10) / 10

  if (rounded >= 100 && amount < total) {
    return Math.floor(pct * 10) / 10
  }

  return rounded
}

export function formatVolumeShare(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return '0%'

  const pct = (amount / total) * 100
  if (pct > 0 && pct < 0.1) return '<0.1%'

  return `${formatVolumeSharePercent(amount, total)}%`
}

export function buildVolumePieChartConfig(
  slices: PieRenderSlice[]
): ChartConfig {
  return Object.fromEntries(
    slices.map((row) => [row.key, { label: row.label, color: row.color }])
  )
}

const OverviewSliceTooltipContent = ({
  slice,
  totalVolume,
  shareTotal,
  shareLabel = 'Share of total',
  globalSettings
}: {
  slice: PieRenderSlice
  totalVolume: number
  shareTotal?: number
  shareLabel?: string
  globalSettings: GlobalSettings
}) => {
  const shareBasis = shareTotal ?? totalVolume
  const share = formatVolumeSharePercent(slice.amount, shareBasis)
  const netPositive = slice.netAmount >= 0

  return (
    <div className="grid min-w-48 gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: slice.color }}
          aria-hidden
        />
        <p className="font-semibold text-foreground">{slice.label}</p>
      </div>

      <div className="space-y-1 border-t border-border/60 pt-2">
        <div className="grid grid-cols-[auto_minmax(0,max-content)] items-center gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Volume</span>
          <span className="justify-self-end whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
            {formatOverviewCurrency(slice.amount, globalSettings)}
          </span>
          <span className="text-muted-foreground">House P&L</span>
          <span
            className={cn(
              'justify-self-end whitespace-nowrap text-sm font-semibold tabular-nums',
              netPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {formatSignedCurrency(slice.netAmount, globalSettings)}
          </span>
          <span className="text-muted-foreground">{shareLabel}</span>
          <span className="justify-self-end whitespace-nowrap tabular-nums text-foreground">
            {share}%
          </span>
        </div>
      </div>

      {slice.groupedSlices && slice.groupedSlices.length > 0 ? (
        <div className="space-y-1 border-t border-border/60 pt-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            Includes
          </p>
          <div className="space-y-1">
            {slice.groupedSlices.map((groupedSlice) => (
              <div
                key={groupedSlice.key}
                className="flex items-center justify-between gap-4"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: groupedSlice.color }}
                    aria-hidden
                  />
                  <span className="truncate">{groupedSlice.label}</span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-foreground">
                  {formatVolumeShare(groupedSlice.amount, shareBasis)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function VolumeLegendTooltip({
  slice,
  totalVolume,
  shareTotal,
  shareLabel,
  globalSettings,
  side,
  children
}: {
  slice: VolumeSlice & { groupedSlices?: VolumeSlice[] }
  totalVolume: number
  shareTotal: number
  shareLabel?: string
  globalSettings: GlobalSettings
  side: 'top' | 'left'
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        hideArrow
        className="border-0 bg-transparent p-0 text-foreground shadow-none"
      >
        <OverviewSliceTooltipContent
          slice={{
            ...slice,
            pieAmount: slice.amount,
            groupedSlices: slice.groupedSlices
          }}
          totalVolume={totalVolume}
          shareTotal={shareTotal}
          shareLabel={shareLabel}
          globalSettings={globalSettings}
        />
      </TooltipContent>
    </Tooltip>
  )
}

function VolumeLegendItem({
  slice,
  share,
  globalSettings,
  totalVolume,
  shareTotal,
  shareLabel,
  legendOnly = false,
  inactive = false
}: {
  slice: VolumeSlice
  share: string
  globalSettings: GlobalSettings
  totalVolume: number
  shareTotal: number
  shareLabel?: string
  legendOnly?: boolean
  inactive?: boolean
}) {
  return (
    <VolumeLegendTooltip
      slice={slice}
      totalVolume={totalVolume}
      shareTotal={shareTotal}
      shareLabel={shareLabel}
      globalSettings={globalSettings}
      side="left"
    >
      <div
        className={cn(
          'flex cursor-default items-center gap-2 rounded-md px-1 py-0.5',
          (legendOnly || inactive) && 'opacity-75'
        )}
      >
        <span
          className={cn(
            'size-2 shrink-0 rounded-[2px]',
            legendOnly && 'ring-1 ring-dashed ring-muted-foreground/50'
          )}
          style={{
            backgroundColor: slice.color,
            opacity: inactive ? 0.35 : 1
          }}
          aria-hidden
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[11px] leading-snug',
            inactive ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {slice.label}
        </span>
        <span className="shrink-0 font-mono text-[10px] leading-none whitespace-nowrap tabular-nums text-muted-foreground">
          {share}
        </span>
      </div>
    </VolumeLegendTooltip>
  )
}

export function OverviewVolumeLegend({
  items,
  totalVolume,
  globalSettings,
  getItemShareTotal,
  getItemShareLabel,
  isLegendOnly,
  isInactive
}: {
  items: VolumeSlice[]
  totalVolume: number
  globalSettings: GlobalSettings
  getItemShareTotal?: (slice: VolumeSlice) => number
  getItemShareLabel?: (slice: VolumeSlice) => string | undefined
  isLegendOnly?: (slice: VolumeSlice) => boolean
  isInactive?: (slice: VolumeSlice) => boolean
}) {
  return (
    <div className="flex w-32 shrink-0 flex-col justify-center gap-0.5 overflow-y-auto border-l border-border/40 py-1 pl-3 sm:w-36 md:w-40">
      {items.map((row) => {
        const shareTotal = getItemShareTotal?.(row) ?? totalVolume

        return (
          <VolumeLegendItem
            key={row.key}
            slice={row}
            share={formatVolumeShare(row.amount, shareTotal)}
            globalSettings={globalSettings}
            totalVolume={totalVolume}
            shareTotal={shareTotal}
            shareLabel={getItemShareLabel?.(row)}
            legendOnly={isLegendOnly?.(row)}
            inactive={isInactive?.(row)}
          />
        )
      })}
    </div>
  )
}

export function OverviewVolumeDonut({
  slices,
  ringVisual,
  chartConfig,
  totalVolume,
  shareTotal,
  shareLabel,
  globalSettings,
  className
}: {
  slices: PieRenderSlice[]
  ringVisual: { paddingAngle: number; cornerRadius: number }
  chartConfig: ChartConfig
  totalVolume: number
  shareTotal?: number
  shareLabel?: string
  globalSettings: GlobalSettings
  className?: string
}) {
  const shareBasis = shareTotal ?? totalVolume
  return (
    <ChartContainer
      config={chartConfig}
      initialDimension={{ width: 220, height: 220 }}
      className={cn(
        'aspect-square h-full max-h-60 w-full max-w-60 min-h-44 [&_.recharts-responsive-container]:size-full!',
        className
      )}
    >
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <ChartTooltip
          offset={16}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const row = payload[0]?.payload as PieRenderSlice | undefined
            if (!row) return null

            return (
              <OverviewSliceTooltipContent
                slice={row}
                totalVolume={totalVolume}
                shareTotal={shareBasis}
                shareLabel={shareLabel}
                globalSettings={globalSettings}
              />
            )
          }}
        />
        <Pie
          data={withPieFill(slices)}
          dataKey="pieAmount"
          nameKey="key"
          {...PIE_CENTER}
          {...PIE_RADII}
          {...PIE_STROKE}
          paddingAngle={ringVisual.paddingAngle}
          cornerRadius={ringVisual.cornerRadius}
        />
      </PieChart>
    </ChartContainer>
  )
}
