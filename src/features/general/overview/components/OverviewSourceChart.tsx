'use client'

import { TTransaction } from 'gambling-bot-shared'
import { Cell, Pie, PieChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig
} from '@/components/ui/chart'

import { formatOverviewCurrency } from '../overviewFormatters'

type SourceRow = { source: TTransaction['source']; amount: number }

const SOURCE_LABELS: Record<TTransaction['source'], string> = {
  casino: 'Casino',
  command: 'Command',
  manual: 'Manual',
  system: 'System',
  web: 'Web'
}

const SOURCE_COLORS: Record<TTransaction['source'], string> = {
  casino: 'var(--chart-1)',
  command: 'var(--chart-2)',
  manual: 'var(--chart-3)',
  system: 'var(--chart-4)',
  web: 'var(--chart-5)'
}

type OverviewSourceChartProps = {
  data: SourceRow[]
}

const OverviewSourceTooltip = ({
  active,
  payload,
  totalVolume
}: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: SourceRow }>
  totalVolume: number
}) => {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload
  if (!row) return null

  const amount = Number(payload[0]?.value ?? row.amount)
  const share =
    totalVolume > 0 ? Math.round((amount / totalVolume) * 1000) / 10 : 0
  const color = SOURCE_COLORS[row.source]

  return (
    <div className="grid min-w-44 gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <p className="font-semibold text-foreground">
          {SOURCE_LABELS[row.source]}
        </p>
      </div>

      <div className="space-y-1 border-t border-border/60 pt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Volume</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatOverviewCurrency(amount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>Share of total</span>
          <span className="font-mono tabular-nums text-foreground">{share}%</span>
        </div>
      </div>
    </div>
  )
}

const OverviewSourceChart = ({ data }: OverviewSourceChartProps) => {
  const chartConfig = Object.fromEntries(
    data.map((row) => [
      row.source,
      {
        label: row.source,
        color: SOURCE_COLORS[row.source]
      }
    ])
  ) satisfies ChartConfig

  const hasData = data.some((row) => row.amount > 0)
  const totalVolume = data.reduce((sum, row) => sum + row.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume by source</CardTitle>
        <CardDescription>Absolute transaction amounts in period</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[280px]">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[280px] max-h-[280px]"
          >
            <PieChart>
              <ChartTooltip
                offset={16}
                content={(props) => (
                  <OverviewSourceTooltip {...props} totalVolume={totalVolume} />
                )}
              />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="source"
                innerRadius={56}
                strokeWidth={2}
              >
                {data.map((row) => (
                  <Cell
                    key={row.source}
                    fill={SOURCE_COLORS[row.source]}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="source" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center">
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
