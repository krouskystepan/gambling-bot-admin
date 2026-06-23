import { NextRequest } from 'next/server'

import { requireExportAccess } from '@/lib/export/exportAuth'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/export/exportResponse'
import {
  exportStaffActionsCsv,
  parseStaffActionsExportParams
} from '@/lib/export/staffActionsExport'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const access = await requireExportAccess(guildId)
  if ('error' in access) {
    return exportErrorResponse(access.error, access.status)
  }

  const globalSettings = await getGuildGlobalSettings(guildId)
  const result = await exportStaffActionsCsv(
    guildId,
    parseStaffActionsExportParams(request.nextUrl.searchParams),
    globalSettings.timezone
  )

  if ('error' in result) {
    return exportErrorResponse(result.error, result.status)
  }

  return csvAttachmentResponse(`staff-actions-${guildId}.csv`, result.csv)
}
