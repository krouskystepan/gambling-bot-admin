import { NextRequest } from 'next/server'

import { requireExportAccess } from '@/lib/exportAuth'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/exportResponse'
import { getGuildGlobalSettings } from '@/lib/guildMoney.server'
import { parseTransactionExportParams } from '@/lib/parseTransactionExportParams'
import { exportTransactionsCsv } from '@/lib/transactionExport'

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
  const result = await exportTransactionsCsv(
    guildId,
    parseTransactionExportParams(request.nextUrl.searchParams),
    globalSettings.timezone
  )

  if ('error' in result) {
    return exportErrorResponse(result.error, result.status)
  }

  return csvAttachmentResponse(`transactions-${guildId}.csv`, result.csv)
}
