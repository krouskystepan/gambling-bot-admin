import { getServerSession } from 'next-auth'

import {
  getGuildOverviewTimezone,
  getOverviewData
} from '@/actions/database/overview.action'
import { getUserPermissions } from '@/actions/perms'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import OverviewDailyPnLChart from './components/OverviewDailyPnLChart'
import OverviewKpiGrid from './components/OverviewKpiGrid'
import OverviewPeriodSelect from './components/OverviewPeriodSelect'
import OverviewRecentTransactions from './components/OverviewRecentTransactions'
import OverviewSourceChart from './components/OverviewSourceChart'
import OverviewTopUsersPanel from './components/OverviewTopUsersPanel'
import SetupHealthCard from './components/SetupHealthCard'
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

  const { isAdmin } = await getUserPermissions(guildId, session)

  return (
    <FeatureLayout title="Overview">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-4">
          <OverviewPeriodSelect
            dateFrom={range.dateFrom}
            dateTo={range.dateTo}
          />
        </div>

        <OverviewKpiGrid
          globalSettings={data.globalSettings}
          cashFlow={data.cashFlow}
          gamePnL={data.gamePnL}
          txCount={data.txCount}
          registeredUsers={data.registeredUsers}
          totalLiability={data.totalLiability}
          vipRoomCount={data.vipRoomCount}
        />

        <div className="grid gap-6 lg:grid-cols-2">
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

        {isAdmin ? <SetupHealthCard checks={data.setupHealth} /> : null}
      </div>
    </FeatureLayout>
  )
}

export default OverviewPage
