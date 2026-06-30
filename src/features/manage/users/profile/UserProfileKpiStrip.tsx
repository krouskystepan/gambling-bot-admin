import type { GlobalSettings } from 'gambling-bot-shared/guild'

import KpiStrip from '@/components/page/KpiStrip'
import { formatOverviewCurrency } from '@/lib/overview/overviewFormatters'

type UserProfileKpiStripProps = {
  globalSettings: GlobalSettings
  registered: boolean
  balance: number
  bonusBalance: number
  lockedBalance: number
  dailyStreak: number
  lastDailyClaim: Date | null
}

const UserProfileKpiStrip = ({
  globalSettings,
  registered,
  balance,
  bonusBalance,
  lockedBalance,
  dailyStreak,
  lastDailyClaim
}: UserProfileKpiStripProps) => {
  const formatCurrency = (value: number) =>
    formatOverviewCurrency(value, globalSettings)

  const dash = '-'
  const formatWallet = (value: number) =>
    registered ? formatCurrency(value) : dash

  const totalWallet = balance + bonusBalance + lockedBalance

  return (
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
  )
}

export default UserProfileKpiStrip
