'use client'

import { format, parseISO } from 'date-fns'
import type { GlobalSettings } from 'gambling-bot-shared'
import { resolveGuildTimezone } from 'gambling-bot-shared'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

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
  SINGLE_DAY_HOUR_AXIS_TICKS,
  formatOverviewHourAxisTick,
  formatOverviewHourLabel,
  formatOverviewHourTooltip,
  parseOverviewBucket
} from '../period'

const chartConfig = {
  gamePnL: {
    label: 'Game P&L',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

type OverviewDailyPnLChartProps = {
  series: OverviewPnLSeries
  globalSettings: GlobalSettings
}

type ChartPoint = OverviewPnLSeries['points'][number]

function formatDayBucketLabel(dateKey: string): string {
  return format(parseISO(dateKey), 'MMM d')
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

  const date = parseISO(dateKey)
  return {
    primary: format(date, 'MMM d, yyyy'),
    secondary: format(date, 'EEEE')
  }
}

function computeYAxisDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1]

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.12, 1)
    if (min >= 0) return [Math.min(0, min - padding), min + padding]
    return [min - padding, Math.max(0, min + padding)]
  }

  const padding = (max - min) * 0.06
  return [min - padding, max + padding]
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

  const gamePnL = Number(payload[0]?.value ?? point.gamePnL)
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
              className="size-2 shrink-0 rounded-[2px] bg-(--color-gamePnL)"
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
  const { granularity, points } = series
  const timezone = resolveGuildTimezone(globalSettings.timezone)
  const isHourly = granularity === 'hour'
  const isSingleDayHourly =
    isHourly &&
    new Set(points.map((point) => point.date.slice(0, 10))).size === 1

  const dayStart =
    isSingleDayHourly && points[0]
      ? parseOverviewBucket(points[0].date, timezone).startOf('day')
      : null

  const formatXAxisTick = (dateKey: string): string => {
    if (!isHourly) {
      return formatDayBucketLabel(dateKey)
    }

    const bucket = parseOverviewBucket(dateKey, timezone)

    if (isSingleDayHourly && dayStart) {
      if (
        !(SINGLE_DAY_HOUR_AXIS_TICKS as readonly number[]).includes(bucket.hour)
      ) {
        return ''
      }

      return formatOverviewHourAxisTick(dayStart, bucket.hour, timezone)
    }

    return `${bucket.toFormat('MMM d')} ${formatOverviewHourLabel(bucket, timezone)}`
  }

  const yDomain = computeYAxisDomain(points.map((point) => point.gamePnL))

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
        <ChartContainer
          config={chartConfig}
          className="aspect-auto min-h-[220px] w-full flex-1 [&_.recharts-responsive-container]:h-full!"
        >
          <AreaChart
            data={points}
            margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickFormatter={formatXAxisTick}
            />
            <YAxis
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={56}
              tickFormatter={(value) =>
                formatChartAxisCurrency(Number(value), globalSettings)
              }
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{
                stroke: 'var(--border)',
                strokeWidth: 1,
                strokeDasharray: '4 4'
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
              stroke="var(--color-gamePnL)"
              fill="var(--color-gamePnL)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default OverviewDailyPnLChart
