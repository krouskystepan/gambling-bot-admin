import { CircleQuestionMark } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

import {
  formatOverviewCount,
  formatOverviewCurrency
} from '../overviewFormatters'

type KpiItem = {
  label: string
  value: number
  positiveIsGreen?: boolean
  tooltip?: string
  formatter?: (value: number) => string
}

type OverviewKpiGridProps = {
  cashFlow: number
  gamePnL: number
  txCount: number
  registeredUsers: number
  totalLiability: number
  vipRoomCount: number
}

const KpiItem = ({
  label,
  value,
  positiveIsGreen = false,
  tooltip,
  formatter = formatOverviewCount
}: KpiItem) => {
  const colorClass = positiveIsGreen
    ? value >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-foreground'

  return (
    <div className="min-w-[120px] flex-1">
      <Label className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleQuestionMark
                size={16}
                className="cursor-pointer text-muted-foreground"
              />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </Label>
      <div className={`text-lg font-bold ${colorClass}`}>
        {formatter(value)}
      </div>
    </div>
  )
}

const OverviewKpiGrid = ({
  cashFlow,
  gamePnL,
  txCount,
  registeredUsers,
  totalLiability,
  vipRoomCount
}: OverviewKpiGridProps) => {
  const items: KpiItem[] = [
    {
      label: 'Cash flow',
      value: cashFlow,
      positiveIsGreen: true,
      formatter: formatOverviewCurrency,
      tooltip: 'Deposits minus withdraws in the selected period'
    },
    {
      label: 'Game P&L',
      value: gamePnL,
      positiveIsGreen: true,
      formatter: formatOverviewCurrency,
      tooltip: 'Bets + VIP minus wins, bonuses, and refunds'
    },
    {
      label: 'Transactions',
      value: txCount,
      tooltip: 'Transaction count in the selected period'
    },
    {
      label: 'Registered users',
      value: registeredUsers
    },
    {
      label: 'Total liability',
      value: totalLiability,
      formatter: formatOverviewCurrency,
      tooltip: 'Sum of balance, bonus balance, and locked balance'
    },
    {
      label: 'VIP rooms',
      value: vipRoomCount
    }
  ]

  return (
    <Card className="py-4">
      <CardContent className="flex flex-wrap justify-center gap-8">
        {items.map((item) => (
          <KpiItem key={item.label} {...item} />
        ))}
      </CardContent>
    </Card>
  )
}

export default OverviewKpiGrid
