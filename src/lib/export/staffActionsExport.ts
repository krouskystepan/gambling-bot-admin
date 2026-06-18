import { resolveGuildTimezone } from 'gambling-bot-shared/guild'
import { STAFF_ACTION_CATEGORIES } from 'gambling-bot-shared/transactions'
import { DateTime } from 'luxon'

import { fetchStaffActionsForExport } from '@/actions/database/staffActions.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { connectToDatabase } from '@/lib/db'
import { toCsv } from '@/lib/export/csv'
import { EXPORT_BATCH_SIZE, EXPORT_MAX_ROWS } from '@/lib/export/exportLimits'
import type { StaffActionsFilters } from '@/lib/staffAudit/staffActionQuery'
import { enrichStaffActionRows } from '@/lib/staffAudit/staffActionRows'

export const STAFF_ACTIONS_EXPORT_HEADERS = [
  'occurredAt',
  'actorId',
  'actorUsername',
  'subjectUserId',
  'subjectUsername',
  'actionLabel',
  'category',
  'amount',
  'notes',
  'requestId',
  'adminAction',
  'meta'
] as const

function formatOccurredAt(occurredAt: Date, timezone?: string | null): string {
  const zone = resolveGuildTimezone(timezone)
  return DateTime.fromJSDate(occurredAt, { zone: 'utc' })
    .setZone(zone)
    .toISO({ suppressMilliseconds: true })!
}

export async function exportStaffActionsCsv(
  guildId: string,
  filters: StaffActionsFilters,
  timezone?: string | null
): Promise<{ csv: string } | { error: string; status: number }> {
  await connectToDatabase()

  const { total } = await fetchStaffActionsForExport(
    guildId,
    filters,
    timezone,
    0,
    1
  )

  if (total > EXPORT_MAX_ROWS) {
    return {
      error: `Export exceeds maximum of ${EXPORT_MAX_ROWS.toLocaleString()} rows (${total.toLocaleString()} matched). Narrow your filters.`,
      status: 413
    }
  }

  const discordMembers = await getDiscordGuildMembers(guildId)
  const discordMap = new Map(
    (discordMembers ?? []).map((member) => [member.userId, member.username])
  )

  const rows: (string | number | null | undefined)[][] = []
  let skip = 0

  while (skip < total) {
    const { rows: batch } = await fetchStaffActionsForExport(
      guildId,
      filters,
      timezone,
      skip,
      EXPORT_BATCH_SIZE
    )

    if (!batch.length) break

    const enriched = enrichStaffActionRows(guildId, batch, discordMap)

    for (const action of enriched) {
      rows.push([
        formatOccurredAt(action.occurredAt, timezone),
        action.actorId,
        action.actorUsername ?? 'Unknown',
        action.subjectUserId,
        action.subjectUsername ?? 'Unknown',
        action.actionLabel,
        action.category,
        action.amount ?? 0,
        action.notes ?? '',
        (action.meta?.requestId as string | undefined) ?? '',
        (action.meta?.adminAction as string | undefined) ?? '',
        action.meta ? JSON.stringify(action.meta) : ''
      ])
    }

    skip += batch.length
  }

  return {
    csv: toCsv([...STAFF_ACTIONS_EXPORT_HEADERS], rows)
  }
}

export function parseStaffActionsExportParams(
  searchParams: URLSearchParams
): StaffActionsFilters {
  const filterAction = searchParams
    .get('filterAction')
    ?.split(',')
    .filter((value): value is (typeof STAFF_ACTION_CATEGORIES)[number] =>
      STAFF_ACTION_CATEGORIES.includes(
        value as (typeof STAFF_ACTION_CATEGORIES)[number]
      )
    )

  return {
    search: searchParams.get('search') ?? undefined,
    staffId: searchParams.get('staffId') ?? undefined,
    filterAction: filterAction?.length ? filterAction : undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined
  }
}
