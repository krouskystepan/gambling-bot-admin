import { getServerSession } from 'next-auth'

import {
  getGuildTaxPeriodSummary,
  getPnLBySource,
  getReportsTimezone,
  getStaffTaxPeriodSummary
} from '@/actions/database/report.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'
import { getGuildGlobalSettings } from '@/lib/guildMoney.server'

import { resolveReportsDateRange } from '../overview/period'
import GuildTaxSummaryTable from './components/GuildTaxSummaryTable'
import ReportsPeriodSelect from './components/ReportsPeriodSelect'
import SourcePnLTable from './components/SourcePnLTable'
import StaffTaxSummaryTable from './components/StaffTaxSummaryTable'

const ReportsPage = async ({
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

  const timezone = await getReportsTimezone(guildId)
  const range = resolveReportsDateRange(searchParams, timezone)

  const [globalSettings, guildSummary, staffSummary, sourcePnL] =
    await Promise.all([
      getGuildGlobalSettings(guildId),
      getGuildTaxPeriodSummary(guildId, range),
      getStaffTaxPeriodSummary(guildId, range),
      getPnLBySource(guildId, range)
    ])

  if (!guildSummary || !staffSummary || !sourcePnL) return null

  return (
    <FeatureLayout
      title="Reports"
      actions={
        <ReportsPeriodSelect
          dateFrom={range.dateFrom}
          dateTo={range.dateTo}
          timezone={timezone}
        />
      }
    >
      <div className="space-y-8">
        <GuildTaxSummaryTable
          guildId={guildId}
          dateFrom={range.dateFrom}
          dateTo={range.dateTo}
          timezone={timezone}
          globalSettings={globalSettings}
          rows={guildSummary}
        />

        <StaffTaxSummaryTable
          guildId={guildId}
          dateFrom={range.dateFrom}
          dateTo={range.dateTo}
          timezone={timezone}
          globalSettings={globalSettings}
          rows={staffSummary}
        />

        <SourcePnLTable
          guildId={guildId}
          dateFrom={range.dateFrom}
          dateTo={range.dateTo}
          globalSettings={globalSettings}
          rows={sourcePnL}
        />

        <p className="text-muted-foreground text-sm">
          Per-game P&L will be available after game metadata is added to
          transactions.
        </p>
      </div>
    </FeatureLayout>
  )
}

export default ReportsPage
