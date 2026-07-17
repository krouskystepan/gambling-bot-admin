'use server'

import { resolveGuildTimezone } from 'gambling-bot-shared/guild'
import {
  TRANSACTION_SOURCES,
  TTransaction
} from 'gambling-bot-shared/transactions'

import {
  MonthlyTaxPoint,
  OverviewDateRange,
  fillTaxPeriodSeries,
  resolveReportTaxGranularity
} from '@/features/general/overview/period'
import { connectToDatabase } from '@/lib/db'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'
import { guildDateRangeMatch } from '@/lib/guild/guildTimezone'
import { mapReportMetrics } from '@/lib/overview/mapReportMetrics'
import {
  buildStaffTaxPeriodGroupStage,
  buildTaxPeriodGroupStage,
  sourcePnLGroupStage
} from '@/lib/overview/transactionTotals'
import {
  getDemoGuildTaxPeriodSummary,
  getDemoPnLBySource,
  getDemoStaffTaxPeriodSummary,
  isDemoGuild
} from '@/lib/presentation'
import Transaction from '@/models/Transaction'

import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'

export type SourcePnLRow = {
  source: TTransaction['source']
  gamePnL: number
  cashFlow: number
  betVolume: number
  winVolume: number
  depositVolume: number
  withdrawVolume: number
  txCount: number
}

export type StaffTaxRow = MonthlyTaxPoint & {
  handlerId: string
  handlerUsername: string
}

async function getReportContext(guildId: string, range: OverviewDateRange) {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return { error: access.error as string }

  await connectToDatabase()
  const globalSettings = await getGuildGlobalSettings(guildId)
  const timezone = resolveGuildTimezone(globalSettings.timezone)
  const dateMatch = guildDateRangeMatch(
    guildId,
    range.dateFrom,
    range.dateTo,
    timezone
  )
  const granularity = resolveReportTaxGranularity(range, timezone)

  return { timezone, dateMatch, globalSettings, granularity }
}

export async function getPnLBySource(
  guildId: string,
  range: OverviewDateRange
): Promise<SourcePnLRow[] | null> {
  if (isDemoGuild(guildId)) return getDemoPnLBySource(range)

  const context = await getReportContext(guildId, range)
  if ('error' in context) return null

  const rows = await Transaction.aggregate([
    { $match: context.dateMatch },
    sourcePnLGroupStage,
    { $sort: { _id: 1 } }
  ])

  const rowMap = new Map(
    rows.map((row) => [
      row._id as TTransaction['source'],
      mapReportMetrics(row)
    ])
  )

  return TRANSACTION_SOURCES.map((source) => ({
    source,
    ...mapReportMetrics(rowMap.get(source) ?? {})
  }))
}

export async function getGuildTaxPeriodSummary(
  guildId: string,
  range: OverviewDateRange
): Promise<MonthlyTaxPoint[] | null> {
  if (isDemoGuild(guildId)) return getDemoGuildTaxPeriodSummary(range)

  const context = await getReportContext(guildId, range)
  if ('error' in context) return null

  const rows = await Transaction.aggregate([
    { $match: context.dateMatch },
    buildTaxPeriodGroupStage(context.timezone, context.granularity),
    { $sort: { _id: 1 } }
  ])

  const points: MonthlyTaxPoint[] = rows.map((row) => ({
    period: row._id as string,
    ...mapReportMetrics(row)
  }))

  return fillTaxPeriodSeries(
    range,
    points,
    context.granularity,
    context.timezone
  )
}

export async function getStaffTaxPeriodSummary(
  guildId: string,
  range: OverviewDateRange
): Promise<StaffTaxRow[] | null> {
  if (isDemoGuild(guildId)) return getDemoStaffTaxPeriodSummary(range)

  const context = await getReportContext(guildId, range)
  if ('error' in context) return null

  const rows = await Transaction.aggregate([
    {
      $match: {
        ...context.dateMatch,
        handledBy: { $exists: true, $ne: null }
      }
    },
    buildStaffTaxPeriodGroupStage(context.timezone, context.granularity),
    { $sort: { '_id.period': 1, '_id.handlerId': 1 } }
  ])

  if (!rows.length) return []

  const handlerIds = Array.from(
    new Set(rows.map((row) => row._id.handlerId as string))
  )
  const discordMembers = await getDiscordGuildMembers(guildId)
  const discordMap = new Map(
    (discordMembers ?? [])
      .filter((member) => handlerIds.includes(member.userId))
      .map((member) => [member.userId, member.username])
  )

  const rawByHandler = new Map<string, MonthlyTaxPoint[]>()

  for (const row of rows) {
    const handlerId = row._id.handlerId as string
    const point: MonthlyTaxPoint = {
      period: row._id.period as string,
      ...mapReportMetrics(row)
    }
    const existing = rawByHandler.get(handlerId) ?? []
    existing.push(point)
    rawByHandler.set(handlerId, existing)
  }

  const filled: StaffTaxRow[] = []

  for (const handlerId of handlerIds) {
    const handlerUsername = discordMap.get(handlerId) ?? 'Unknown'
    const handlerPoints = fillTaxPeriodSeries(
      range,
      rawByHandler.get(handlerId) ?? [],
      context.granularity,
      context.timezone
    )

    for (const point of handlerPoints) {
      filled.push({
        ...point,
        handlerId,
        handlerUsername
      })
    }
  }

  return filled.sort(
    (a, b) =>
      a.period.localeCompare(b.period) ||
      a.handlerUsername.localeCompare(b.handlerUsername)
  )
}

export async function getReportsTimezone(guildId: string): Promise<string> {
  const globalSettings = await getGuildGlobalSettings(guildId)
  return resolveGuildTimezone(globalSettings.timezone)
}
