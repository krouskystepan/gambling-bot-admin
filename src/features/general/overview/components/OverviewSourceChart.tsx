'use client'

import type { GlobalSettings } from 'gambling-bot-shared'
import { Cell, Pie, PieChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { type VolumeSlice, splitVolumeSlices } from '@/lib/volumeSlices'

import { formatOverviewCurrency } from '../overviewFormatters'

type OverviewSourceChartProps = {
  data: VolumeSlice[]
  globalSettings: GlobalSettings
}

const PIE_CENTER = { cx: '50%', cy: '50%' } as const
const CASINO_ARC = { startAngle: 225, endAngle: -45 } as const

const INNER_PIE_RADII = {
  solo: { innerRadius: '50%', outerRadius: '82%' },
  dual: { innerRadius: '42%', outerRadius: '64%' }
} as const

const OUTER_PIE_RADII = {
  dual: { innerRadius: '70%', outerRadius: '86%' }
} as const

function formatSignedCurrency(
  value: number,
  globalSettings: GlobalSettings
): string {
  const formatted = formatOverviewCurrency(Math.abs(value), globalSettings)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

const OverviewSourceTooltip = ({
  active,
  payload,
  totalVolume,
  globalSettings
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: VolumeSlice; value?: unknown }>
  totalVolume: number
  globalSettings: GlobalSettings
}) => {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload
  if (!row) return null

  const amount = Number(payload[0]?.value ?? row.amount)
  const share =
    totalVolume > 0 ? Math.round((amount / totalVolume) * 1000) / 10 : 0
  const netPositive = row.netAmount >= 0

  return (
    <div className="grid min-w-48 gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: row.color }}
          aria-hidden
        />
        <p className="font-semibold text-foreground">{row.label}</p>
      </div>

      <div className="space-y-1 border-t border-border/60 pt-2">
        <div className="grid grid-cols-[auto_minmax(0,max-content)] items-center gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Volume</span>
          <span className="justify-self-end whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
            {formatOverviewCurrency(amount, globalSettings)}
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
            {formatSignedCurrency(row.netAmount, globalSettings)}
          </span>
          <span className="text-muted-foreground">Share of total</span>
          <span className="justify-self-end whitespace-nowrap tabular-nums text-foreground">
            {share}%
          </span>
        </div>
      </div>
    </div>
  )
}

function SourceLegendItem({ slice }: { slice: VolumeSlice }) {
  return (
    <span className="inline-flex min-w-0 items-center justify-center gap-1.5 text-xs leading-none">
      <span
        className="size-2 shrink-0 rounded-[2px] ring-1 ring-background/80"
        style={{ backgroundColor: slice.color }}
        aria-hidden
      />
      <span className="truncate font-medium tracking-wide text-foreground">
        {slice.label}
      </span>
    </span>
  )
}

function formatShare(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return '0%'
  const pct = (amount / total) * 100
  if (pct > 0 && pct < 0.1) return '<0.1%'
  return `${Math.round(pct * 10) / 10}%`
}

function GameLegendItem({
  slice,
  share
}: {
  slice: VolumeSlice
  share: string
}) {
  return (
    <div className="group rounded-md px-1.5 py-1 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-[2px] ring-1 ring-background/60"
          style={{ backgroundColor: slice.color }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-[11px] leading-snug text-muted-foreground group-hover:text-foreground">
          {slice.label}
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/80">
          {share}
        </span>
      </div>
    </div>
  )
}

const OverviewSourceChart = ({
  data,
  globalSettings
}: OverviewSourceChartProps) => {
  const { sourceSlices, casinoSlices } = splitVolumeSlices(data)

  const chartConfig = Object.fromEntries(
    data.map((row) => [
      row.key,
      {
        label: row.label,
        color: row.color
      }
    ])
  ) satisfies ChartConfig

  const hasData = data.some((row) => row.amount > 0)
  const sourceTotalVolume = sourceSlices.reduce(
    (sum, row) => sum + row.amount,
    0
  )
  const casinoTotalVolume = casinoSlices.reduce(
    (sum, row) => sum + row.amount,
    0
  )
  const tooltipTotalVolume = sourceTotalVolume
  const hasSources = sourceSlices.length > 0
  const hasCasino = casinoSlices.length > 0
  const dualRing = hasSources && hasCasino

  const innerRadii = dualRing ? INNER_PIE_RADII.dual : INNER_PIE_RADII.solo

  return (
    <Card className="flex h-full min-h-[380px] flex-col">
      <CardHeader className="shrink-0 pb-2">
        <CardTitle>Volume by source</CardTitle>
        <CardDescription>
          Absolute transaction amounts in period
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 pb-4 pt-0">
        {hasData ? (
          <>
            <div className="flex min-h-0 flex-1 gap-3 sm:gap-4">
              <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
                <ChartContainer
                  config={chartConfig}
                  initialDimension={{ width: 420, height: 420 }}
                  className="aspect-square h-full w-auto max-w-full [&_.recharts-responsive-container]:size-full!"
                >
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <ChartTooltip
                      offset={16}
                      content={({ active, payload }) => (
                        <OverviewSourceTooltip
                          active={active}
                          payload={payload}
                          totalVolume={tooltipTotalVolume}
                          globalSettings={globalSettings}
                        />
                      )}
                    />
                    {hasSources ? (
                      <Pie
                        data={sourceSlices}
                        dataKey="amount"
                        nameKey="key"
                        {...PIE_CENTER}
                        {...innerRadii}
                        strokeWidth={2}
                        stroke="var(--background)"
                      >
                        {sourceSlices.map((row) => (
                          <Cell key={row.key} fill={row.color} />
                        ))}
                      </Pie>
                    ) : null}
                    {hasCasino ? (
                      <Pie
                        data={casinoSlices}
                        dataKey="amount"
                        nameKey="key"
                        {...PIE_CENTER}
                        innerRadius={
                          dualRing
                            ? OUTER_PIE_RADII.dual.innerRadius
                            : innerRadii.innerRadius
                        }
                        outerRadius={
                          dualRing
                            ? OUTER_PIE_RADII.dual.outerRadius
                            : innerRadii.outerRadius
                        }
                        startAngle={dualRing ? CASINO_ARC.startAngle : 90}
                        endAngle={dualRing ? CASINO_ARC.endAngle : -270}
                        strokeWidth={2}
                        stroke="var(--background)"
                        paddingAngle={2}
                        cornerRadius={3}
                      >
                        {casinoSlices.map((row) => (
                          <Cell key={row.key} fill={row.color} />
                        ))}
                      </Pie>
                    ) : null}
                  </PieChart>
                </ChartContainer>
              </div>

              {hasCasino ? (
                <div className="flex w-34 shrink-0 flex-col gap-2 self-stretch rounded-lg border border-border/40 bg-muted/10 p-2.5 sm:w-36 md:w-40">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                      Games
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                      {casinoSlices.length}
                    </p>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 overflow-y-auto pr-0.5">
                    {casinoSlices.map((row) => (
                      <GameLegendItem
                        key={row.key}
                        slice={row}
                        share={formatShare(row.amount, casinoTotalVolume)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {hasSources ? (
              <div
                className="grid justify-around shrink-0 border-t border-border/40 pt-2.5"
                style={{
                  gridTemplateColumns: `repeat(${sourceSlices.length}, minmax(0, 1fr))`
                }}
              >
                {sourceSlices.map((row) => (
                  <SourceLegendItem key={row.key} slice={row} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              No transaction volume in this period.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OverviewSourceChart
