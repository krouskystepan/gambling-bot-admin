import { resolveGuildTimezone } from 'gambling-bot-shared/guild'
import { DateTime } from 'luxon'

import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { connectToDatabase } from '@/lib/db'
import { toCsv } from '@/lib/export/csv'
import { EXPORT_BATCH_SIZE, EXPORT_MAX_ROWS } from '@/lib/export/exportLimits'
import { buildTransactionMatch } from '@/lib/transactions/transactionQuery'
import Transaction from '@/models/Transaction'

export const TRANSACTION_EXPORT_HEADERS = [
  'transactionId',
  'createdAt',
  'userId',
  'username',
  'type',
  'source',
  'amount',
  'betId',
  'handledBy',
  'handledByUsername',
  'meta'
] as const

export type TransactionExportFilters = {
  search?: string
  staffId?: string
  betId?: string
  adminSearch?: string
  filterType?: string[]
  filterSource?: string[]
  filterCasinoGame?: string[]
  dateFrom?: string
  dateTo?: string
  sort?: string
  userId?: string
}

function formatCreatedAtInGuildTimezone(
  createdAt: Date,
  timezone?: string | null
): string {
  const zone = resolveGuildTimezone(timezone)
  return DateTime.fromJSDate(createdAt, { zone: 'utc' })
    .setZone(zone)
    .toISO({ suppressMilliseconds: true })!
}

function parseSort(sort?: string): Record<string, 1 | -1> {
  if (!sort) return { createdAt: -1 }

  const sortObj: Record<string, 1 | -1> = {}
  for (const part of sort.split(',')) {
    const [field, dir] = part.split(':')
    if (field) sortObj[field] = dir === 'asc' ? 1 : -1
  }
  return Object.keys(sortObj).length ? sortObj : { createdAt: -1 }
}

export async function exportTransactionsCsv(
  guildId: string,
  filters: TransactionExportFilters,
  timezone?: string | null
): Promise<{ csv: string } | { error: string; status: number }> {
  await connectToDatabase()

  const query = buildTransactionMatch(guildId, filters, timezone)
  const total = await Transaction.countDocuments(query)

  if (total > EXPORT_MAX_ROWS) {
    return {
      error: `Export exceeds maximum of ${EXPORT_MAX_ROWS.toLocaleString()} rows (${total.toLocaleString()} matched). Narrow your filters.`,
      status: 413
    }
  }

  const sortObj = parseSort(filters.sort)
  const rows: (string | number | null | undefined)[][] = []
  const discordMembers = await getDiscordGuildMembers(guildId)
  const discordMap = new Map(
    (discordMembers ?? []).map((member) => [member.userId, member.username])
  )

  let skip = 0
  while (skip < total) {
    const batch = await Transaction.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(EXPORT_BATCH_SIZE)
      .lean()

    if (!batch.length) break

    for (const tx of batch) {
      rows.push([
        tx._id.toString(),
        formatCreatedAtInGuildTimezone(tx.createdAt, timezone),
        tx.userId,
        discordMap.get(tx.userId) ?? 'Unknown',
        tx.type,
        tx.source,
        tx.amount,
        tx.betId ?? '',
        tx.handledBy ?? '',
        tx.handledBy ? (discordMap.get(tx.handledBy) ?? 'Unknown') : '',
        tx.meta ? JSON.stringify(tx.meta) : ''
      ])
    }

    skip += batch.length
  }

  return {
    csv: toCsv([...TRANSACTION_EXPORT_HEADERS], rows)
  }
}
