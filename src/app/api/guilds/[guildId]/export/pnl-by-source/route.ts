import { NextRequest } from 'next/server'

import { getPnLBySource } from '@/actions/database/report.action'
import { requireExportAccess } from '@/lib/export/exportAuth'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/export/exportResponse'
import { parseReportExportParams } from '@/lib/export/parseReportExportParams'
import { pnlBySourceToCsv } from '@/lib/export/reportExport'

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

  const rows = await getPnLBySource(guildId, range)
  if (!rows) {
    return exportErrorResponse('Insufficient permissions', 403)
  }

  return csvAttachmentResponse(
    `pnl-by-source-${guildId}.csv`,
    pnlBySourceToCsv(rows)
  )
}
