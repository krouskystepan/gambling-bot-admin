import KpiStrip from '@/components/KpiStrip'
import {
  formatOverviewCount,
  formatOverviewCurrency
} from '@/lib/overviewFormatters'

type OverviewKpiGridProps = {
  cashFlow: number
  gamePnL: number
  txCount: number
  registeredUsers: number
  totalLiability: number
  vipRoomCount: number
}

const OverviewKpiGrid = ({
  cashFlow,
  gamePnL,
  txCount,
  registeredUsers,
  totalLiability,
  vipRoomCount
}: OverviewKpiGridProps) => {
  return (
    <KpiStrip
      items={[
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
      ]}
    />
  )
}

export default OverviewKpiGrid
