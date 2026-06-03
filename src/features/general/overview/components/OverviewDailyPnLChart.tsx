'use client'

import { format, parseISO } from 'date-fns'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

import type { OverviewDailyPoint } from '../period'
import {
  formatChartAxisCurrency,
  formatOverviewCount,
  formatOverviewCurrency
} from '../overviewFormatters'

const chartConfig = {
  gamePnL: {
    label: 'Game P&L',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig

type OverviewDailyPnLChartProps = {
  data: OverviewDailyPoint[]
}

type ChartPoint = OverviewDailyPoint & { label: string }

const OverviewDailyPnLTooltip = ({
  active,
  payload
}: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: ChartPoint }>
}) => {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const gamePnL = Number(payload[0]?.value ?? point.gamePnL)
  const isProfit = gamePnL >= 0
  const date = parseISO(point.date)

  return (
    <div className="grid min-w-44 gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs shadow-xl">
      <div>
        <p className="font-semibold text-foreground">
          {format(date, 'MMM d, yyyy')}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {format(date, 'EEEE')}
        </p>
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
            {formatOverviewCurrency(gamePnL)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {isProfit ? 'House profit' : 'House loss'} for the day
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
            {formatOverviewCurrency(point.cashFlow)}
          </span>
        </div>
      </div>
    </div>
  )
}

const OverviewDailyPnLChart = ({ data }: OverviewDailyPnLChartProps) => {
  const chartData = data.map((point) => ({
    ...point,
    label: format(parseISO(point.date), 'MMM d')
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily game P&L</CardTitle>
        <CardDescription>House profit or loss per day</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <AreaChart
            data={chartData}
            margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={56}
              tickFormatter={(value) => formatChartAxisCurrency(Number(value))}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{
                stroke: 'var(--border)',
                strokeWidth: 1,
                strokeDasharray: '4 4'
              }}
              content={<OverviewDailyPnLTooltip />}
            />
            <Area
              type="monotone"
              dataKey="gamePnL"
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
