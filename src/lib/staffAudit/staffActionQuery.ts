import { guildCalendarRangeToUtc } from 'gambling-bot-shared/guild'
import {
  STAFF_ACTION_CATEGORIES,
  STAFF_ADMIN_ACTIONS,
  type StaffActionCategory
} from 'gambling-bot-shared/transactions'

import { escapeRegExp } from '@/lib/utils'

export type StaffActionsFilters = {
  search?: string
  staffId?: string
  filterAction?: StaffActionCategory[]
  dateFrom?: string
  dateTo?: string
}

function buildCategoryTransactionMatch(
  category: StaffActionCategory
): Record<string, unknown> {
  switch (category) {
    case 'balance':
      return {
        type: { $in: ['deposit', 'withdraw', 'bonus'] },
        source: 'web',
        $or: [
          { 'meta.requestId': { $exists: false } },
          { 'meta.requestId': null }
        ]
      }
    case 'atm':
      return {
        $or: [
          { 'meta.adminAction': STAFF_ADMIN_ACTIONS.ATM_REJECT },
          {
            type: { $in: ['deposit', 'withdraw'] },
            source: 'web',
            'meta.requestId': { $exists: true, $ne: null }
          }
        ]
      }
    case 'vip':
      return { type: 'vip' }
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

export function buildStaffTransactionMatch(
  guildId: string,
  filters: StaffActionsFilters,
  timezone?: string | null
): Record<string, unknown> {
  const andFilters: Record<string, unknown>[] = [
    { guildId },
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
    'createdAt'
  )
  if (dateMatch) andFilters.push(dateMatch)

  if (filters.filterAction?.length) {
    andFilters.push({
      $or: filters.filterAction.map(buildCategoryTransactionMatch)
    })
  }

  return andFilters.length === 1 ? andFilters[0] : { $and: andFilters }
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
