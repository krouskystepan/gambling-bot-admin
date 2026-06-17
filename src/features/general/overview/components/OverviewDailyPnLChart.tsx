'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { resolveGuildTimezone } from 'gambling-bot-shared/guild'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { useId } from 'react'

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
  profit: '#22c55e',
  loss: '#ef4444'
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

function computeYAxisDomain(values: number[]): [number, number] {
  const { min, max } = getDataExtents(values)

  if (min === max) {
    if (min === 0) return [-1, 1]
    return min > 0 ? [0, min] : [min, 0]
  }

  return [min, max]
}

function buildChartYAxisTicks(
  dataMin: number,
  dataMax: number,
  targetCount = 6
): number[] {
  const min = Math.round(dataMin)
  const max = Math.round(dataMax)

  if (min === max) return [min]
  if (targetCount < 2) return [min, max]

  const ticks: number[] = []

  for (let i = 0; i < targetCount; i++) {
    if (i === 0) {
      ticks.push(min)
      continue
    }

    if (i === targetCount - 1) {
      ticks.push(max)
      continue
    }

    ticks.push(Math.round(min + ((max - min) * i) / (targetCount - 1)))
  }

  return [...new Set(ticks)].sort((a, b) => a - b)
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

function buildUniqueChartYAxisTicks(
  dataMin: number,
  dataMax: number,
  formatLabel: (value: number) => string
): number[] {
  for (let targetCount = 6; targetCount <= 9; targetCount++) {
    const ticks = dedupeTicksByLabel(
      buildChartYAxisTicks(dataMin, dataMax, targetCount),
      formatLabel
    )

    if (ticks.length >= 4) return ticks
  }

  return buildChartYAxisTicks(dataMin, dataMax, 6)
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
  timezone
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartPoint; value?: unknown }>
  globalSettings: GlobalSettings
  granularity: OverviewPnLSeries['granularity']
  timezone: string
}) => {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const gamePnL = Number(point.gamePnL)
  const isProfit = gamePnL >= 0
  const header = formatTooltipHeader(point.date, granularity, timezone)
  const periodLabel = granularity === 'hour' ? 'hour' : 'day'

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
        <p className="text-[11px] text-muted-foreground">
          {isProfit ? 'House profit' : 'House loss'} for the {periodLabel}
        </p>
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
  const { granularity, points } = series
  const gamePnLValues = points.map((point) => point.gamePnL)
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
  const yDomain = computeYAxisDomain(gamePnLValues)

  const formatYAxisTick = (value: number): string => {
    const amount = Math.round(value)
    if (amount === 0) return ''
    return formatChartAxisCurrency(amount, globalSettings)
  }

  const yAxisTicks = buildUniqueChartYAxisTicks(
    dataMin,
    dataMax,
    formatYAxisTick
  )
  const yAxisWidth = measureYAxisWidth(yAxisTicks, formatYAxisTick)
  const gradientOffset = getPnLGradientOffset(gamePnLValues)
  const hasData = points.some((point) => point.txCount > 0)

  return (
    <Card className="flex h-full min-h-[380px] flex-col">
      <CardHeader>
        <CardTitle>{isHourly ? 'Hourly game P&L' : 'Daily game P&L'}</CardTitle>
        <CardDescription>
          {isHourly
            ? 'House profit or loss per hour'
            : 'House profit or loss per day'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pb-4">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto min-h-[220px] w-full flex-1 [&_.recharts-responsive-container]:h-full!"
          >
            <AreaChart
              data={points}
              margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
            >
              <defs>
                <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={PNL_COLORS.profit}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset={`${gradientOffset * 100}%`}
                    stopColor={PNL_COLORS.profit}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset={`${gradientOffset * 100}%`}
                    stopColor={PNL_COLORS.loss}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor={PNL_COLORS.loss}
                    stopOpacity={0.35}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
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
                  stroke: 'var(--border)',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  fill: 'transparent'
                }}
                content={({ active, payload }) => (
                  <OverviewDailyPnLTooltip
                    active={active}
                    payload={payload}
                    globalSettings={globalSettings}
                    granularity={granularity}
                    timezone={timezone}
                  />
                )}
              />
              <Area
                type="linear"
                dataKey="gamePnL"
                baseValue={0}
                stroke={`url(#${fillGradientId})`}
                fill={`url(#${fillGradientId})`}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
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
