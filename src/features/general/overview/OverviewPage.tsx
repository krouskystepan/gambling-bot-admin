import {
  getGuildOverviewTimezone,
  getOverviewData
} from '@/actions/database/overview.action'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'
import { guildPageDenial } from '@/lib/guild/guildPageDenial'

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
  const session = await requireSession()

  const timezone = await getGuildOverviewTimezone(guildId)
  const range = resolveOverviewDateRange(searchParams, timezone)
  const result = await getOverviewData(guildId, session, range)
  if (!result.ok) {
    return guildPageDenial({ rateLimited: result.rateLimited })
  }

  const data = result.data

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

        <OverviewDailyPnLChart
          series={data.pnlSeries}
          globalSettings={data.globalSettings}
        />

        <OverviewSourceChart
          data={data.sourceAmounts}
          globalSettings={data.globalSettings}
        />

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
