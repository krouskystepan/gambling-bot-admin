import { NextRequest } from 'next/server'

import { getStaffTaxPeriodSummary } from '@/actions/database/report.action'
import { requireExportAccess } from '@/lib/exportAuth'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/exportResponse'
import { parseReportExportParams } from '@/lib/parseReportExportParams'
import { staffTaxSummaryToCsv } from '@/lib/reportExport'

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

  const rows = await getStaffTaxPeriodSummary(guildId, range)
  if (!rows) {
    return exportErrorResponse('Insufficient permissions', 403)
  }

  return csvAttachmentResponse(
    `tax-summary-staff-${guildId}.csv`,
    staffTaxSummaryToCsv(rows)
  )
}
