import { guildCalendarRangeToUtc } from 'gambling-bot-shared/guild'
import {
  STAFF_ACTION_CATEGORIES,
  STAFF_ADMIN_ACTIONS,
  type StaffActionCategory
} from 'gambling-bot-shared/transactions'
import type { PipelineStage } from 'mongoose'

import { escapeRegExp } from '@/lib/utils'

export type StaffActionsFilters = {
  search?: string
  staffId?: string
  filterAction?: StaffActionCategory[]
  dateFrom?: string
  dateTo?: string
}

const USER_NOTE_ADMIN_ACTIONS = [
  STAFF_ADMIN_ACTIONS.USER_NOTE_CREATE,
  STAFF_ADMIN_ACTIONS.USER_NOTE_UPDATE,
  STAFF_ADMIN_ACTIONS.USER_NOTE_DELETE
] as const

function buildCategoryTransactionMatch(
  category: StaffActionCategory
): Record<string, unknown> {
  switch (category) {
    case 'balance':
      return {
        type: { $in: ['deposit', 'withdraw', 'bonus'] },
        source: 'web',
        $or: [{ referenceId: { $exists: false } }, { referenceId: null }]
      }
    case 'atm':
      return {
        $or: [
          { 'meta.adminAction': STAFF_ADMIN_ACTIONS.ATM_REJECT },
          {
            type: { $in: ['deposit', 'withdraw'] },
            source: 'web',
            referenceId: { $exists: true, $ne: null }
          }
        ]
      }
    case 'vip':
      return {
        'meta.adminAction': {
          $in: [
            STAFF_ADMIN_ACTIONS.VIP_BUY,
            STAFF_ADMIN_ACTIONS.VIP_EXTEND,
            STAFF_ADMIN_ACTIONS.VIP_ADD_MEMBER,
            STAFF_ADMIN_ACTIONS.VIP_REMOVE
          ]
        }
      }
    case 'raffle':
      return { 'meta.adminAction': STAFF_ADMIN_ACTIONS.RAFFLE_CANCEL }
    case 'prediction':
      return {
        'meta.adminAction': {
          $in: [
            STAFF_ADMIN_ACTIONS.PREDICTION_END,
            STAFF_ADMIN_ACTIONS.PREDICTION_PAYOUT,
            STAFF_ADMIN_ACTIONS.PREDICTION_CANCEL
          ]
        }
      }
    case 'ban':
    case 'unban':
      return { _id: { $exists: false } }
    case 'user':
      return {
        'meta.adminAction': {
          $in: [...USER_NOTE_ADMIN_ACTIONS]
        }
      }
    default:
      return {}
  }
}

function buildDateRangeMatch(
  dateFrom?: string,
  dateTo?: string,
  timezone?: string | null,
  field = 'createdAt'
): Record<string, unknown> | null {
  if (!dateFrom || !dateTo) return null

  const { start, end } = guildCalendarRangeToUtc(dateFrom, dateTo, timezone)
  return { [field]: { $gte: start, $lte: end } }
}

export function shouldIncludeAtmRejectionUnion(
  filterAction?: StaffActionCategory[]
): boolean {
  if (!filterAction?.length) return true
  return filterAction.includes('atm')
}

export function shouldIncludeBanUnion(
  filterAction?: StaffActionCategory[]
): boolean {
  if (!filterAction?.length) return true
  return filterAction.includes('ban')
}

export function shouldIncludeUnbanUnion(
  filterAction?: StaffActionCategory[]
): boolean {
  if (!filterAction?.length) return true
  return filterAction.includes('unban')
}

function buildUserBanBaseMatch(
  guildId: string,
  filters: StaffActionsFilters
): Record<string, unknown>[] {
  const andFilters: Record<string, unknown>[] = [{ guildId }]

  if (filters.search) {
    const regex = new RegExp(escapeRegExp(filters.search), 'i')
    andFilters.push({ userId: regex })
  }

  return andFilters
}

export function buildUserBanStaffActionUnionStages(
  guildId: string,
  filters: StaffActionsFilters,
  timezone: string | null | undefined,
  collectionName: string,
  options: { includeBan: boolean; includeUnban: boolean }
): PipelineStage[] {
  const banAndFilters = [
    ...buildUserBanBaseMatch(guildId, filters),
    ...(filters.staffId ? [{ bannedBy: filters.staffId }] : [])
  ]
  const banDateMatch = buildDateRangeMatch(
    filters.dateFrom,
    filters.dateTo,
    timezone,
    'bannedAt'
  )
  if (banDateMatch) banAndFilters.push(banDateMatch)

  const unbanAndFilters = [
    ...buildUserBanBaseMatch(guildId, filters),
    { unbannedAt: { $ne: null } },
    { unbannedBy: { $ne: null } },
    ...(filters.staffId ? [{ unbannedBy: filters.staffId }] : [])
  ]
  const unbanDateMatch = buildDateRangeMatch(
    filters.dateFrom,
    filters.dateTo,
    timezone,
    'unbannedAt'
  )
  if (unbanDateMatch) unbanAndFilters.push(unbanDateMatch)

  const banMatch =
    banAndFilters.length === 1 ? banAndFilters[0] : { $and: banAndFilters }
  const unbanMatch =
    unbanAndFilters.length === 1
      ? unbanAndFilters[0]
      : { $and: unbanAndFilters }

  const stages: PipelineStage[] = []

  if (options.includeBan) {
    stages.push({
      $unionWith: {
        coll: collectionName,
        pipeline: [
          { $match: banMatch },
          {
            $project: {
              _id: 0,
              id: { $concat: ['ban:', '$banId'] },
              occurredAt: '$bannedAt',
              actorId: '$bannedBy',
              subjectUserId: '$userId',
              amount: { $literal: 0 },
              notes: '$banReason',
              meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_BAN },
              referenceId: '$banId',
              txType: { $literal: null },
              txSource: { $literal: 'web' },
              sourceType: { $literal: 'userBan' }
            }
          }
        ]
      }
    })
  }

  if (options.includeUnban) {
    stages.push({
      $unionWith: {
        coll: collectionName,
        pipeline: [
          { $match: unbanMatch },
          {
            $project: {
              _id: 0,
              id: { $concat: ['unban:', '$banId'] },
              occurredAt: '$unbannedAt',
              actorId: '$unbannedBy',
              subjectUserId: '$userId',
              amount: { $literal: 0 },
              notes: '$unbanReason',
              meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_UNBAN },
              referenceId: '$banId',
              txType: { $literal: null },
              txSource: { $literal: 'web' },
              sourceType: { $literal: 'userBan' }
            }
          }
        ]
      }
    })
  }

  return stages
}

export function buildStaffTransactionMatch(
  guildId: string,
  filters: StaffActionsFilters,
  timezone?: string | null
): Record<string, unknown> {
  const andFilters: Record<string, unknown>[] = [
    { guildId },
    { handledBy: { $exists: true, $ne: null } },
    {
      $or: [
        { 'meta.adminAction': { $exists: false } },
        { 'meta.adminAction': null },
        {
          'meta.adminAction': {
            $nin: [STAFF_ADMIN_ACTIONS.USER_BAN, STAFF_ADMIN_ACTIONS.USER_UNBAN]
          }
        }
      ]
    }
  ]

  if (filters.staffId) {
    andFilters.push({ handledBy: filters.staffId })
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegExp(filters.search), 'i')
    andFilters.push({ userId: regex })
  }

  const dateMatch = buildDateRangeMatch(
    filters.dateFrom,
    filters.dateTo,
    timezone,
    'createdAt'
  )
  if (dateMatch) andFilters.push(dateMatch)

  if (filters.filterAction?.length) {
    andFilters.push({
      $or: filters.filterAction.map(buildCategoryTransactionMatch)
    })
  }

  return { $and: andFilters }
}

export function buildAtmRejectionMatch(
  guildId: string,
  filters: StaffActionsFilters,
  timezone?: string | null
): Record<string, unknown> {
  const andFilters: Record<string, unknown>[] = [
    { guildId },
    { status: 'rejected' },
    { handledBy: { $exists: true, $ne: null } }
  ]

  if (filters.staffId) {
    andFilters.push({ handledBy: filters.staffId })
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegExp(filters.search), 'i')
    andFilters.push({ userId: regex })
  }

  const dateMatch = buildDateRangeMatch(
    filters.dateFrom,
    filters.dateTo,
    timezone,
    'handledAt'
  )
  if (dateMatch) andFilters.push(dateMatch)

  return andFilters.length === 1 ? andFilters[0] : { $and: andFilters }
}

export function emptyStaffActionCategoryCounts(): Record<
  StaffActionCategory,
  number
> {
  return Object.fromEntries(
    STAFF_ACTION_CATEGORIES.map((category) => [category, 0])
  ) as Record<StaffActionCategory, number>
}
