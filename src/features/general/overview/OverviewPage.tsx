import { getServerSession } from 'next-auth'

import {
  getGuildOverviewTimezone,
  getOverviewData
} from '@/actions/database/overview.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'

import OverviewDailyPnLChart from './components/OverviewDailyPnLChart'
import OverviewHealthLink from './components/OverviewHealthLink'
import OverviewKpiGrid from './components/OverviewKpiGrid'
import OverviewPeriodSelect from './components/OverviewPeriodSelect'
import OverviewRecentTransactions from './components/OverviewRecentTransactions'
import OverviewSourceChart from './components/OverviewSourceChart'
import OverviewTopUsersPanel from './components/OverviewTopUsersPanel'
import { resolveOverviewDateRange } from './period'

const OverviewPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    dateFrom?: string
    dateTo?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const timezone = await getGuildOverviewTimezone(guildId)
  const range = resolveOverviewDateRange(searchParams, timezone)
  const data = await getOverviewData(guildId, session, range)
  if (!data) return null

  return (
    <FeatureLayout
      title="Overview"
      actions={
        <OverviewPeriodSelect dateFrom={range.dateFrom} dateTo={range.dateTo} />
      }
    >
      <div className="space-y-6">
        <OverviewKpiGrid
          globalSettings={data.globalSettings}
          cashFlow={data.cashFlow}
          gamePnL={data.gamePnL}
          txCount={data.txCount}
          registeredUsers={data.registeredUsers}
          totalLiability={data.totalLiability}
          vipRoomCount={data.vipRoomCount}
        />

        <OverviewHealthLink guildId={guildId} />

        <div className="grid min-h-[400px] gap-6 lg:grid-cols-2">
          <OverviewDailyPnLChart
            series={data.pnlSeries}
            globalSettings={data.globalSettings}
          />
          <OverviewSourceChart
            data={data.sourceAmounts}
            globalSettings={data.globalSettings}
          />
        </div>

        <OverviewRecentTransactions
          guildId={guildId}
          globalSettings={data.globalSettings}
          transactions={data.recentTransactions}
          dateFrom={range.dateFrom}
          dateTo={range.dateTo}
        />

        <OverviewTopUsersPanel
          guildId={guildId}
          globalSettings={data.globalSettings}
          topByBalance={data.topByBalance}
          topByNetProfit={data.topByNetProfit}
        />
      </div>
    </FeatureLayout>
  )
}

export default OverviewPage
