'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { resolveGuildTimezone } from 'gambling-bot-shared/guild'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis
} from 'recharts'

import { useId, useMemo, useState } from 'react'

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import {
  formatChartAxisCurrency,
  formatOverviewCount,
  formatOverviewCurrency
} from '../overviewFormatters'
import {
  type OverviewPnLSeries,
  buildMultiDayHourAxisTicks,
  buildSingleDayHourAxisTicks,
  formatOverviewDailyAxisTick,
  formatOverviewDayTooltip,
  formatOverviewHourAxisTick,
  formatOverviewHourTooltip,
  formatOverviewMultiDayHourAxisTick,
  getOverviewHourlyDayCount,
  parseOverviewBucket
} from '../period'

const PNL_COLORS = {
  profit: 'var(--chart-2)',
  loss: 'var(--chart-5)'
} as const

const chartConfig = {
  gamePnL: {
    label: 'Game P&L',
    color: PNL_COLORS.profit
  }
} satisfies ChartConfig

type OverviewDailyPnLChartProps = {
  series: OverviewPnLSeries
  globalSettings: GlobalSettings
}

type ChartPoint = OverviewPnLSeries['points'][number]

type PnLViewMode = 'daily' | 'total'

function buildCumulativePoints(points: ChartPoint[]): ChartPoint[] {
  let runningTotal = 0

  return points.map((point) => {
    runningTotal += point.gamePnL
    return { ...point, gamePnL: runningTotal }
  })
}

function getPnLGradientOffset(values: number[]): number {
  if (values.length === 0) return 0.5

  const max = Math.max(...values)
  const min = Math.min(...values)

  if (max <= 0) return 0
  if (min >= 0) return 1

  return max / (max - min)
}

function formatTooltipHeader(
  dateKey: string,
  granularity: OverviewPnLSeries['granularity'],
  timezone: string
): { primary: string; secondary?: string } {
  if (granularity === 'hour') {
    const bucket = parseOverviewBucket(dateKey, timezone)
    return {
      primary: formatOverviewHourTooltip(bucket, timezone),
      secondary: bucket.toFormat('EEEE')
    }
  }

  const bucket = parseOverviewBucket(`${dateKey}T12:00`, timezone)
  return {
    primary: formatOverviewDayTooltip(bucket),
    secondary: bucket.toFormat('EEEE')
  }
}

function getDataExtents(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 }

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  }
}

function niceAxisStep(roughStep: number): number {
  if (!Number.isFinite(roughStep) || roughStep <= 0) return 1

  const exponent = Math.floor(Math.log10(roughStep))
  const fraction = roughStep / 10 ** exponent

  let niceFraction: number
  if (fraction <= 1) niceFraction = 1
  else if (fraction <= 2) niceFraction = 2
  else if (fraction <= 5) niceFraction = 5
  else niceFraction = 10

  return niceFraction * 10 ** exponent
}

function buildChartYAxisTicks(
  dataMin: number,
  dataMax: number,
  includeZero: boolean,
  targetCount = 5
): number[] {
  let min = dataMin
  let max = dataMax

  if (includeZero) {
    min = Math.min(min, 0)
    max = Math.max(max, 0)
  }

  if (min === max) {
    const padding = min === 0 ? 1 : Math.max(Math.abs(min) * 0.15, 1)
    min -= padding
    max += padding
  }

  const range = max - min
  const step = niceAxisStep(range / Math.max(targetCount - 1, 1))
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step

  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax + step * 0.001; tick += step) {
    ticks.push(Math.round(tick))
  }

  if (includeZero && !ticks.includes(0)) {
    ticks.push(0)
    ticks.sort((a, b) => a - b)
  }

  return [...new Set(ticks)]
}

function computeYAxisLayout(
  dataMin: number,
  dataMax: number,
  includeZero: boolean,
  formatLabel: (value: number) => string
): { domain: [number, number]; ticks: number[] } {
  for (let targetCount = 5; targetCount <= 7; targetCount++) {
    const ticks = dedupeTicksByLabel(
      buildChartYAxisTicks(dataMin, dataMax, includeZero, targetCount),
      formatLabel
    )

    if (ticks.length >= 4) {
      return {
        domain: [ticks[0]!, ticks[ticks.length - 1]!],
        ticks
      }
    }
  }

  const ticks = buildChartYAxisTicks(dataMin, dataMax, includeZero, 5)
  return {
    domain: [ticks[0] ?? dataMin, ticks[ticks.length - 1] ?? dataMax],
    ticks
  }
}

function dedupeTicksByLabel(
  ticks: number[],
  formatLabel: (value: number) => string
): number[] {
  const seen = new Set<string>()
  const unique: number[] = []

  for (const tick of ticks) {
    const label = formatLabel(tick)
    if (!label || seen.has(label)) continue
    seen.add(label)
    unique.push(tick)
  }

  return unique
}

function measureYAxisWidth(
  ticks: number[],
  formatLabel: (value: number) => string
): number {
  const longestLabel = ticks.reduce((max, tick) => {
    return Math.max(max, formatLabel(tick).length)
  }, 0)

  return Math.min(120, Math.max(72, Math.ceil(longestLabel * 7) + 12))
}

const OverviewDailyPnLTooltip = ({
  active,
  payload,
  globalSettings,
  granularity,
  timezone,
  viewMode
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartPoint; value?: unknown }>
  globalSettings: GlobalSettings
  granularity: OverviewPnLSeries['granularity']
  timezone: string
  viewMode: PnLViewMode
}) => {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const gamePnL = Number(point.gamePnL)
  const isProfit = gamePnL >= 0
  const header = formatTooltipHeader(point.date, granularity, timezone)
  const periodLabel = granularity === 'hour' ? 'hour' : 'day'
  const valueDescription =
    viewMode === 'total'
      ? isProfit
        ? 'Cumulative house profit'
        : 'Cumulative house loss'
      : isProfit
        ? `House profit for the ${periodLabel}`
        : `House loss for the ${periodLabel}`

  return (
    <div className="grid min-w-44 gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs shadow-xl">
      <div>
        <p className="font-semibold text-foreground">{header.primary}</p>
        {header.secondary ? (
          <p className="text-[11px] text-muted-foreground">
            {header.secondary}
          </p>
        ) : null}
      </div>

      <div className="space-y-1 border-t border-border/60 pt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className={cn(
                'size-2 shrink-0 rounded-[2px]',
                isProfit
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : 'bg-red-500 dark:bg-red-400'
              )}
              aria-hidden
            />
            Game P&L
          </span>
          <span
            className={cn(
              'font-mono text-sm font-semibold tabular-nums',
              isProfit ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatOverviewCurrency(gamePnL, globalSettings)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">{valueDescription}</p>
      </div>

      <div className="space-y-1 border-t border-border/60 pt-2">
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>Transactions</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatOverviewCount(point.txCount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>Cash flow</span>
          <span className="font-mono tabular-nums text-foreground">
            {formatOverviewCurrency(point.cashFlow, globalSettings)}
          </span>
        </div>
      </div>
    </div>
  )
}

const OverviewDailyPnLChart = ({
  series,
  globalSettings
}: OverviewDailyPnLChartProps) => {
  const fillGradientId = useId().replace(/:/g, '')
  const [viewMode, setViewMode] = useState<PnLViewMode>('daily')
  const { granularity, points } = series
  const chartPoints = useMemo(
    () => (viewMode === 'total' ? buildCumulativePoints(points) : points),
    [points, viewMode]
  )
  const gamePnLValues = chartPoints.map((point) => point.gamePnL)
  const timezone = resolveGuildTimezone(globalSettings.timezone)
  const isHourly = granularity === 'hour'
  const hourlyDayCount = isHourly ? getOverviewHourlyDayCount(points) : 0
  const isSingleDayHourly = isHourly && hourlyDayCount === 1
  const isTwoDayHourly = isHourly && hourlyDayCount === 2
  const isMultiDayHourly =
    isHourly && hourlyDayCount >= 2 && hourlyDayCount <= 5

  const dayStart =
    isSingleDayHourly && points[0]
      ? parseOverviewBucket(points[0].date, timezone).startOf('day')
      : null

  const hourlyAxisTicks = isSingleDayHourly
    ? buildSingleDayHourAxisTicks(points, timezone)
    : isMultiDayHourly
      ? buildMultiDayHourAxisTicks(points, hourlyDayCount, timezone)
      : undefined

  const formatXAxisTick = (dateKey: string): string => {
    if (!isHourly) {
      return formatOverviewDailyAxisTick(dateKey, timezone)
    }

    const bucket = parseOverviewBucket(dateKey, timezone)

    if (isSingleDayHourly && dayStart) {
      return formatOverviewHourAxisTick(dayStart, bucket.hour, timezone)
    }

    if (isMultiDayHourly) {
      return formatOverviewMultiDayHourAxisTick(
        bucket,
        hourlyDayCount,
        timezone
      )
    }

    return formatOverviewDailyAxisTick(dateKey, timezone)
  }

  const { min: dataMin, max: dataMax } = getDataExtents(gamePnLValues)
  const crossesZero = dataMin < 0 && dataMax > 0

  const formatYAxisTick = (value: number): string =>
    formatChartAxisCurrency(Math.round(value), globalSettings)

  const { domain: yDomain, ticks: yAxisTicks } = computeYAxisLayout(
    dataMin,
    dataMax,
    crossesZero,
    formatYAxisTick
  )
  const yAxisWidth = measureYAxisWidth(yAxisTicks, formatYAxisTick)
  const gradientOffset = getPnLGradientOffset(gamePnLValues)
  const hasData = points.some(
    (point) => point.txCount > 0 || point.gamePnL !== 0 || point.cashFlow !== 0
  )
  const chartTitle =
    viewMode === 'total'
      ? 'Total game P&L'
      : isHourly
        ? 'Hourly game P&L'
        : 'Daily game P&L'
  const chartDescription =
    viewMode === 'total'
      ? 'Cumulative house profit or loss'
      : isHourly
        ? 'House profit or loss per hour'
        : 'House profit or loss per day'

  return (
    <Card className="flex h-full min-h-[400px] flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{chartTitle}</CardTitle>
          <CardDescription>{chartDescription}</CardDescription>
        </div>
        {hasData ? (
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as PnLViewMode)}
          >
            <TabsList className="h-8 shrink-0">
              <TabsTrigger value="daily" className="px-3 text-xs">
                Daily
              </TabsTrigger>
              <TabsTrigger value="total" className="px-3 text-xs">
                Total
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pb-4">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            initialDimension={{ width: 800, height: 300 }}
            className="aspect-auto h-[300px] w-full [&_.recharts-responsive-container]:h-full!"
          >
            <AreaChart
              data={chartPoints}
              margin={{ left: 0, right: 12, top: 12, bottom: 4 }}
            >
              <defs>
                <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={PNL_COLORS.profit}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset={`${gradientOffset * 100}%`}
                    stopColor={PNL_COLORS.profit}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset={`${gradientOffset * 100}%`}
                    stopColor={PNL_COLORS.loss}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor={PNL_COLORS.loss}
                    stopOpacity={0.45}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.55}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={24}
                ticks={hourlyAxisTicks}
                padding={isTwoDayHourly ? { left: 16 } : undefined}
                tick={{
                  fill: 'var(--muted-foreground)',
                  fontSize: 12,
                  ...(isTwoDayHourly ? { dx: 8 } : {})
                }}
                tickFormatter={formatXAxisTick}
              />
              <YAxis
                domain={yDomain}
                ticks={yAxisTicks}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={yAxisWidth}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => formatYAxisTick(Number(value))}
              />
              <ChartTooltip
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeWidth: 1,
                  strokeOpacity: 0.35,
                  strokeDasharray: '3 3',
                  fill: 'var(--muted)',
                  fillOpacity: 0.12
                }}
                content={({ active, payload }) => (
                  <OverviewDailyPnLTooltip
                    active={active}
                    payload={payload}
                    globalSettings={globalSettings}
                    granularity={granularity}
                    timezone={timezone}
                    viewMode={viewMode}
                  />
                )}
              />
              {crossesZero ? (
                <ReferenceLine
                  y={0}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.45}
                  strokeDasharray="5 4"
                />
              ) : null}
              <Area
                type="monotone"
                dataKey="gamePnL"
                baseValue={0}
                fill={`url(#${fillGradientId})`}
                stroke="var(--foreground)"
                strokeOpacity={0.2}
                strokeWidth={1.5}
                dot={false}
                activeDot={(props: {
                  cx?: number
                  cy?: number
                  payload?: ChartPoint
                }) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null || !payload) return null
                  const fill =
                    payload.gamePnL >= 0 ? PNL_COLORS.profit : PNL_COLORS.loss
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={fill}
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  )
                }}
                isAnimationActive
                animationDuration={500}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              No game activity in this period.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OverviewDailyPnLChart
