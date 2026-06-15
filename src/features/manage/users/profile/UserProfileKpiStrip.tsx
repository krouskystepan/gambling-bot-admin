import type { GlobalSettings } from 'gambling-bot-shared'

import KpiStrip from '@/components/KpiStrip'
import { formatOverviewCurrency } from '@/lib/overview/overviewFormatters'

type UserProfileKpiStripProps = {
  globalSettings: GlobalSettings
  registered: boolean
  balance: number
  bonusBalance: number
  lockedBalance: number
  dailyStreak: number
  lastDailyClaim: Date | null
  cashFlow: number
  gamePnL: number
  txCount: number
  periodNetProfit: number
}

const UserProfileKpiStrip = ({
  globalSettings,
  registered,
  balance,
  bonusBalance,
  lockedBalance,
  dailyStreak,
  lastDailyClaim,
  cashFlow,
  gamePnL,
  txCount,
  periodNetProfit
}: UserProfileKpiStripProps) => {
  const formatCurrency = (value: number) =>
    formatOverviewCurrency(value, globalSettings)

  const dash = '—'
  const formatWallet = (value: number) =>
    registered ? formatCurrency(value) : dash

  const totalWallet = balance + bonusBalance + lockedBalance

  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
          {
            label: 'Balance',
            value: balance,
            formatter: formatWallet
          },
          {
            label: 'Bonus balance',
            value: bonusBalance,
            formatter: formatWallet
          },
          {
            label: 'Locked balance',
            value: lockedBalance,
            formatter: formatWallet
          },
          {
            label: 'Total wallet',
            value: totalWallet,
            formatter: formatWallet,
            tooltip: 'Balance + bonus balance + locked balance'
          },
          {
            label: 'Daily streak',
            value: dailyStreak,
            formatter: (value) => (registered ? String(value) : dash)
          },
          {
            label: 'Last claim',
            value: 0,
            formatter: () =>
              registered && lastDailyClaim
                ? new Date(lastDailyClaim).toLocaleDateString('cs')
                : dash
          }
        ]}
      />

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
            label: 'Net profit',
            value: periodNetProfit,
            positiveIsGreen: true,
            formatter: formatCurrency,
            tooltip: 'Wins and bonuses minus bets in the selected period'
          }
        ]}
      />
    </div>
  )
}

export default UserProfileKpiStrip
