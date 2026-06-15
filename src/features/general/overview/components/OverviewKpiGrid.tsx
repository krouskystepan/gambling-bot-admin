import type { GlobalSettings } from 'gambling-bot-shared'

import KpiStrip from '@/components/KpiStrip'
import { formatOverviewCurrency } from '@/lib/overview/overviewFormatters'

type OverviewKpiGridProps = {
  globalSettings: GlobalSettings
  cashFlow: number
  gamePnL: number
  txCount: number
  registeredUsers: number
  totalLiability: number
  vipRoomCount: number
}

const OverviewKpiGrid = ({
  globalSettings,
  cashFlow,
  gamePnL,
  txCount,
  registeredUsers,
  totalLiability,
  vipRoomCount
}: OverviewKpiGridProps) => {
  const formatCurrency = (value: number) =>
    formatOverviewCurrency(value, globalSettings)

  return (
    <KpiStrip
      items={[
        {
          label: 'Cash flow',
          value: cashFlow,
          positiveIsGreen: true,
          formatter: formatCurrency,
          tooltip: 'Deposits minus withdraws in the selected period'
        },
        {
          label: 'Game P&L',
          value: gamePnL,
          positiveIsGreen: true,
          formatter: formatCurrency,
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
          formatter: formatCurrency,
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
