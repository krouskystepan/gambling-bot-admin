'use client'

import type { GlobalSettings } from 'gambling-bot-shared'

import type { SourcePnLRow } from '@/actions/database/report.action'
import { buildReportExportUrl } from '@/lib/export/exportUrls'

import ReportTable from '../table/ReportTable'
import { sourcePnLColumns } from '../table/reportColumns'

const SourcePnLTable = ({
  guildId,
  dateFrom,
  dateTo,
  globalSettings,
  rows
}: {
  guildId: string
  dateFrom: string
  dateTo: string
  globalSettings: GlobalSettings
  rows: SourcePnLRow[]
}) => {
  return (
    <ReportTable
      title="P&L by source"
      description="House P&L and volume attributed to each transaction source."
      exportHref={buildReportExportUrl(
        guildId,
        'pnl-by-source',
        dateFrom,
        dateTo
      )}
      columns={sourcePnLColumns(globalSettings)}
      data={rows.filter((row) => row.txCount > 0)}
    />
  )
}

export default SourcePnLTable
