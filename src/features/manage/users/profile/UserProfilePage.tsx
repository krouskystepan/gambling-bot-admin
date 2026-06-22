import { ArrowLeft } from 'lucide-react'
import { getServerSession } from 'next-auth'

import Link from 'next/link'

import { getGuildOverviewTimezone } from '@/actions/database/overview.action'
import { getUserProfile } from '@/actions/database/userProfile.action'
import { getUserPermissions } from '@/actions/perms'
import NotFoundBox from '@/components/states/NotFoundBox'
import FeatureLayout from '@/features/FeatureLayout'
import OverviewDailyPnLChart from '@/features/general/overview/components/OverviewDailyPnLChart'
import OverviewSourceChart from '@/features/general/overview/components/OverviewSourceChart'
import { resolveOverviewDateRange } from '@/features/general/overview/period'
import TransactionTable from '@/features/general/transactions/table/TransactionTable'
import {
  getTransactionsData,
  normalizeTransactionsSearchParams
} from '@/features/general/transactions/useTransactions'
import { authOptions } from '@/lib/auth/authOptions'

import UserProfileHeader from './UserProfileHeader'
import UserProfileKpiStrip from './UserProfileKpiStrip'
import UserProfileVipCard from './UserProfileVipCard'

type UserProfilePageProps = {
  guildId: string
  userId: string
  searchParams?: {
    dateFrom?: string
    dateTo?: string
    page?: string
    limit?: string
    adminSearch?: string
    filterType?: string
    filterSource?: string
    filterCasinoGame?: string
    sort?: string
  }
}

const UserProfilePage = async ({
  guildId,
  userId,
  searchParams
}: UserProfilePageProps) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const timezone = await getGuildOverviewTimezone(guildId)
  const range = resolveOverviewDateRange(searchParams, timezone)

  const txQuery = normalizeTransactionsSearchParams({
    ...searchParams,
    dateFrom: searchParams?.dateFrom ?? range.dateFrom,
    dateTo: searchParams?.dateTo ?? range.dateTo
  })

  const [{ isAdmin }, profile, txData] = await Promise.all([
    getUserPermissions(guildId, session),
    getUserProfile(guildId, userId, session, range),
    getTransactionsData(guildId, session, { ...txQuery, userId })
  ])

  if (!profile) return <NotFoundBox />

  const transactionsHref = `/dashboard/g/${guildId}/transactions?search=${userId}&dateFrom=${range.dateFrom}&dateTo=${range.dateTo}`

  return (
    <FeatureLayout title="User profile">
      <div className="space-y-6">
        <Link
          href={`/dashboard/g/${guildId}/users`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>

        <UserProfileHeader
          guildId={guildId}
          managerId={session.userId!}
          isGuildAdmin={isAdmin}
          profile={profile}
          dateFrom={range.dateFrom}
          dateTo={range.dateTo}
        />

        <UserProfileKpiStrip
          globalSettings={profile.globalSettings}
          registered={profile.registered}
          balance={profile.balance}
          bonusBalance={profile.bonusBalance}
          lockedBalance={profile.lockedBalance}
          dailyStreak={profile.dailyStreak}
          lastDailyClaim={profile.lastDailyClaim}
          cashFlow={profile.cashFlow}
          gamePnL={profile.gamePnL}
          txCount={profile.txCount}
          periodNetProfit={profile.periodNetProfit}
        />

        <OverviewDailyPnLChart
          series={profile.pnlSeries}
          globalSettings={profile.globalSettings}
        />

        <OverviewSourceChart
          data={profile.sourceAmounts}
          globalSettings={profile.globalSettings}
        />

        <UserProfileVipCard guildId={guildId} vips={profile.vips} />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Transactions</h3>
            <Link
              href={transactionsHref}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <TransactionTable
            guildId={guildId}
            globalSettings={profile.globalSettings}
            transactions={txData.transactions}
            transactionCounts={txData.transactionCounts}
            staffMembers={txData.staffMembers}
            guildMembers={txData.guildMembers}
            page={txQuery.page}
            limit={txQuery.limit}
            total={txData.total}
            gamePnL={txData.gamePnL}
            cashFlow={txData.cashFlow}
            hideUserSearch
            hideDatePicker
          />
        </div>
      </div>
    </FeatureLayout>
  )
}

export default UserProfilePage
