'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import type { StaffTaxRow } from '@/actions/database/report.action'
import {
  getReportTaxSummaryDescription,
  resolveReportTaxGranularity
} from '@/features/general/overview/period'
import { buildReportExportUrl } from '@/lib/export/exportUrls'

import ReportTable from '../table/ReportTable'
import { staffTaxColumns } from '../table/reportColumns'

const StaffTaxSummaryTable = ({
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
  rows: StaffTaxRow[]
}) => {
  const granularity = resolveReportTaxGranularity(
    { dateFrom, dateTo },
    timezone
  )

  return (
    <ReportTable
      title="Staff handler summary"
      description={getReportTaxSummaryDescription('staff', granularity)}
      exportHref={buildReportExportUrl(
        guildId,
        'tax-summary-staff',
        dateFrom,
        dateTo
      )}
      exportFilename={`tax-summary-staff-${guildId}.csv`}
      columns={staffTaxColumns(globalSettings, granularity, timezone)}
      data={rows}
    />
  )
}

export default StaffTaxSummaryTable
