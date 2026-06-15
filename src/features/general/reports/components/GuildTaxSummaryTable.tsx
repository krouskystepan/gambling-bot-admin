'use client'

import type { GlobalSettings } from 'gambling-bot-shared'

import {
  type MonthlyTaxPoint,
  getReportTaxSummaryDescription,
  resolveReportTaxGranularity
} from '@/features/general/overview/period'
import { buildReportExportUrl } from '@/lib/export/exportUrls'

import ReportTable from '../table/ReportTable'
import { guildTaxColumns } from '../table/reportColumns'

const GuildTaxSummaryTable = ({
  guildId,
  dateFrom,
  dateTo,
  timezone,
  globalSettings,
  rows
}: {
  guildId: string
  dateFrom: string
  dateTo: string
  timezone: string
  globalSettings: GlobalSettings
  rows: MonthlyTaxPoint[]
}) => {
  const granularity = resolveReportTaxGranularity(
    { dateFrom, dateTo },
    timezone
  )

  return (
    <ReportTable
      title="Guild tax summary"
      description={getReportTaxSummaryDescription('guild', granularity)}
      exportHref={buildReportExportUrl(
        guildId,
        'tax-summary-guild',
        dateFrom,
        dateTo
      )}
      columns={guildTaxColumns(globalSettings, granularity, timezone)}
      data={rows}
    />
  )
}

export default GuildTaxSummaryTable
