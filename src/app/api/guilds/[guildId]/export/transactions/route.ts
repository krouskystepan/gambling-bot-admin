import { NextRequest } from 'next/server'

import { requireExportAccess } from '@/lib/export/exportAuth'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/export/exportResponse'
import { parseTransactionExportParams } from '@/lib/export/parseTransactionExportParams'
import { exportTransactionsCsv } from '@/lib/export/transactionExport'
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

  try {
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
  } catch (error) {
    console.error('Transaction export failed:', error)
    const message =
      error instanceof Error ? error.message : 'Transaction export failed'
    return exportErrorResponse(message, 500)
  }
}
