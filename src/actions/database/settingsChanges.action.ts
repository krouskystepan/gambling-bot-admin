'use server'

import { guildCalendarRangeToUtc } from 'gambling-bot-shared/guild'
import { Session } from 'next-auth'

import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { connectToDatabase } from '@/lib/db'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'
import {
  getDemoSettingsChangeCounts,
  getDemoSettingsChangeEntityFacets,
  getDemoSettingsChanges,
  isDemoGuild
} from '@/lib/presentation'
import {
  type SettingsChangeCounts,
  type SettingsChangeEntityFacets,
  type SettingsChangeRow,
  type SettingsChangesFilters,
  emptySettingsChangeCounts,
  formatSettingsChangeSummary
} from '@/lib/settingsAudit/settingsChangeRows'
import {
  SETTINGS_CHANGE_SECTION_LABELS,
  type SettingsChangeSection,
  isSettingsChangeSection
} from '@/lib/settingsAudit/settingsChangeSections'
import SettingsChangeLog from '@/models/SettingsChangeLog'

import { requireGuildAccess } from '../perms'

export type {
  SettingsChangeCounts,
  SettingsChangeEntityFacets,
  SettingsChangeRow,
  SettingsChangesFilters
} from '@/lib/settingsAudit/settingsChangeRows'

function buildDateRangeMatch(
  dateFrom?: string,
  dateTo?: string,
  timezone?: string | null
): Record<string, unknown> | null {
  if (!dateFrom || !dateTo) return null

  const { start, end } = guildCalendarRangeToUtc(dateFrom, dateTo, timezone)
  return { createdAt: { $gte: start, $lte: end } }
}

function buildSettingsChangeMatch(
  guildId: string,
  filters: SettingsChangesFilters,
  timezone?: string | null
): Record<string, unknown> {
  const match: Record<string, unknown> = { guildId }

  if (filters.staffId) {
    match.changedBy = filters.staffId
  }

  if (filters.filterSection?.length) {
    match.section = { $in: filters.filterSection }
  }

  const dateMatch = buildDateRangeMatch(
    filters.dateFrom,
    filters.dateTo,
    timezone
  )
  if (dateMatch) {
    Object.assign(match, dateMatch)
  }

  return match
}

function mapSettingsChangeRows(
  docs: Array<{
    _id: { toString(): string }
    createdAt?: Date
    changedBy: string
    section: SettingsChangeSection
    changedPaths: string[]
    before: unknown
    after: unknown
  }>,
  usernameById: Map<string, string>
): SettingsChangeRow[] {
  return docs.map((doc) => {
    const section = isSettingsChangeSection(doc.section)
      ? doc.section
      : 'global'
    const changedPaths = doc.changedPaths ?? []

    return {
      id: doc._id.toString(),
      occurredAt: doc.createdAt ?? new Date(0),
      changedBy: doc.changedBy,
      changedByUsername: usernameById.get(doc.changedBy) ?? null,
      section,
      sectionLabel: SETTINGS_CHANGE_SECTION_LABELS[section],
      changedPaths,
      summary: formatSettingsChangeSummary(changedPaths),
      before: doc.before ?? null,
      after: doc.after ?? null
    }
  })
}

export async function getSettingsChanges(
  guildId: string,
  _session: Session,
  page = 1,
  limit = 15,
  filters: SettingsChangesFilters = {}
): Promise<{ changes: SettingsChangeRow[]; total: number }> {
  if (isDemoGuild(guildId)) {
    return getDemoSettingsChanges({
      page,
      limit,
      staffId: filters.staffId,
      filterSection: filters.filterSection
    })
  }

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { changes: [], total: 0 }
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)
  const match = buildSettingsChangeMatch(
    guildId,
    filters,
    globalSettings.timezone
  )

  const [docs, total] = await Promise.all([
    SettingsChangeLog.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SettingsChangeLog.countDocuments(match)
  ])

  if (!docs.length) {
    return { changes: [], total }
  }

  const userIds = Array.from(new Set(docs.map((doc) => doc.changedBy)))
  const discordMembers = await getDiscordGuildMembers(guildId)
  const usernameById = new Map(
    discordMembers
      .filter((member) => userIds.includes(member.userId))
      .map((member) => [member.userId, member.username])
  )

  return {
    changes: mapSettingsChangeRows(docs, usernameById),
    total
  }
}

export async function getSettingsChangeCounts(
  guildId: string,
  _session: Session,
  filters: Omit<SettingsChangesFilters, 'filterSection'> = {}
): Promise<SettingsChangeCounts> {
  if (isDemoGuild(guildId)) {
    return getDemoSettingsChangeCounts()
  }

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) {
    return emptySettingsChangeCounts()
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)
  const match = buildSettingsChangeMatch(
    guildId,
    filters,
    globalSettings.timezone
  )

  const rows = await SettingsChangeLog.aggregate<{
    _id: SettingsChangeSection
    count: number
  }>([{ $match: match }, { $group: { _id: '$section', count: { $sum: 1 } } }])

  const counts = emptySettingsChangeCounts()
  for (const row of rows) {
    if (isSettingsChangeSection(row._id)) {
      counts[row._id] = row.count
    }
  }

  return counts
}

export async function getSettingsChangeEntityFacets(
  guildId: string,
  _session: Session,
  filters: SettingsChangesFilters = {}
): Promise<SettingsChangeEntityFacets> {
  if (isDemoGuild(guildId)) {
    return getDemoSettingsChangeEntityFacets()
  }

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) {
    return { staff: {} }
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)
  const match = buildSettingsChangeMatch(
    guildId,
    { ...filters, staffId: undefined },
    globalSettings.timezone
  )

  const staffRows = await SettingsChangeLog.aggregate<{
    _id: string | null
    count: number
  }>([{ $match: match }, { $group: { _id: '$changedBy', count: { $sum: 1 } } }])

  const staff: Record<string, number> = {}
  for (const row of staffRows) {
    if (row._id) staff[row._id] = row.count
  }

  return { staff }
}
