'use client'

import { type PreviewDay } from 'gambling-bot-shared'
import { formatNumberToReadableString } from 'gambling-bot-shared'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { useEffect, useRef, useState } from 'react'

const CHART_HEIGHT = 280
const MILESTONE_DAYS = [7, 14, 21, 28]

const COLORS = {
  base: 'var(--chart-3)',
  weekly: 'var(--chart-2)',
  monthly: 'var(--chart-4)',
  reward: 'var(--chart-1)'
} as const

type ChartPoint = PreviewDay & {
  isWeekly: boolean
  isMonthly: boolean
}

const formatAmount = (value: number) =>
  `$${formatNumberToReadableString(value)}`

const BonusChartTooltip = ({
  active,
  payload
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartPoint }>
}) => {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const rows = [
    { label: 'Base streak', value: point.base, color: COLORS.base, show: true },
    {
      label: 'Weekly bonus',
      value: point.weekly,
      color: COLORS.weekly,
      show: point.weekly > 0
    },
    {
      label: 'Monthly bonus',
      value: point.monthly,
      color: COLORS.monthly,
      show: point.monthly > 0
    }
  ]

  return (
    <div className="grid max-w-[11rem] gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs shadow-xl sm:max-w-[13rem]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold">Day {point.day}</span>
        {point.isWeekly ? (
          <span className="rounded-full bg-chart-2/20 px-1.5 py-0.5 text-[10px] font-medium text-chart-2">
            Weekly
          </span>
        ) : null}
        {point.isMonthly ? (
          <span className="rounded-full bg-chart-4/20 px-1.5 py-0.5 text-[10px] font-medium text-chart-4">
            Monthly
          </span>
        ) : null}
        {point.isReset ? (
          <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
            Cap reset
          </span>
        ) : null}
      </div>

      {point.isReset ? (
        <p className="text-pretty text-[11px] leading-snug text-muted-foreground">
          Streak cycled back to day 1 after hitting the cap.
        </p>
      ) : null}

      <div className="space-y-1 border-t border-border/60 pt-2">
        {rows
          .filter((row) => row.show)
          .map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: row.color }}
                />
                {row.label}
              </span>
              <span className="font-mono font-medium tabular-nums">
                {formatAmount(row.value)}
              </span>
            </div>
          ))}

        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1.5">
          <span className="font-medium">Total payout</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatAmount(point.reward)}
          </span>
        </div>
      </div>
    </div>
  )
}

type BonusRewardChartProps = {
  preview: PreviewDay[]
}

const BonusRewardChart = ({ preview }: BonusRewardChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const update = () => {
      const next = Math.floor(node.getBoundingClientRect().width)
      if (next > 0) setWidth(next)
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (preview.length === 0) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
        style={{ height: CHART_HEIGHT }}
      >
        No preview data
      </div>
    )
  }

  const data: ChartPoint[] = preview.map((day) => ({
    ...day,
    isWeekly: day.day % 7 === 0,
    isMonthly: day.day % 28 === 0
  }))

  const hasResets = data.some((d) => d.isReset)

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full min-w-0"
        style={{ height: CHART_HEIGHT }}
      >
        {width > 0 ? (
          <AreaChart
            width={width}
            height={CHART_HEIGHT}
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => formatNumberToReadableString(v)}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              width={56}
            />
            <Tooltip content={<BonusChartTooltip />} />
            {MILESTONE_DAYS.filter((day) => preview.length >= day).map(
              (day) => (
                <ReferenceLine
                  key={day}
                  x={day}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
              )
            )}
            <Area
              type="monotone"
              dataKey="base"
              stackId="reward"
              fill={COLORS.base}
              stroke={COLORS.base}
              fillOpacity={0.4}
              dot={(props) => {
                const { cx, cy, payload, index } = props
                if (!payload?.isReset || cx == null || cy == null) {
                  return <g key={`base-${index}`} />
                }

                return (
                  <circle
                    key={`reset-${payload.day}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="var(--destructive)"
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="weekly"
              stackId="reward"
              fill={COLORS.weekly}
              stroke={COLORS.weekly}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="monthly"
              stackId="reward"
              fill={COLORS.monthly}
              stroke={COLORS.monthly}
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="reward"
              fill="transparent"
              stroke={COLORS.reward}
              strokeWidth={2}
              activeDot={{
                r: 4,
                fill: COLORS.reward,
                stroke: 'var(--background)',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        ) : null}
      </div>

      {hasResets ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block size-2.5 rounded-full bg-destructive" />
          Red dot = cap reset (streak wraps to day 1)
        </p>
      ) : null}
    </div>
  )
}

export default BonusRewardChart
