import { NextRequest } from 'next/server'

import { getGuildTaxPeriodSummary } from '@/actions/database/report.action'
import { requireExportAccess } from '@/lib/export/exportAuth'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/export/exportResponse'
import { parseReportExportParams } from '@/lib/export/parseReportExportParams'
import { guildTaxSummaryToCsv } from '@/lib/export/reportExport'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const access = await requireExportAccess(guildId)
  if ('error' in access) {
    return exportErrorResponse(access.error, access.status)
  }

  const range = parseReportExportParams(request.nextUrl.searchParams)
  if (!range) {
    return exportErrorResponse('dateFrom and dateTo are required', 400)
  }

  const rows = await getGuildTaxPeriodSummary(guildId, range)
  if (!rows) {
    return exportErrorResponse('Insufficient permissions', 403)
  }

  return csvAttachmentResponse(
    `tax-summary-guild-${guildId}.csv`,
    guildTaxSummaryToCsv(rows)
  )
}
