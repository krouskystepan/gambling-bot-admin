import {
  STAFF_ACTION_CATEGORIES,
  type StaffActionCategory
} from 'gambling-bot-shared/transactions'
import type { Session } from 'next-auth'

import {
  type StaffActionCounts,
  type StaffActionEntityFacets,
  type StaffActionRow,
  getGuildStaffMembers,
  getStaffActionCounts,
  getStaffActionEntityFacets,
  getStaffActions
} from '@/actions/database/staffActions.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'

export interface StaffActionsQuery {
  page: number
  limit: number
  search?: string
  staffId?: string
  filterAction?: StaffActionCategory[]
  dateFrom?: string
  dateTo?: string
}

export interface StaffActionsResult {
  actions: StaffActionRow[]
  counts: StaffActionCounts
  entityFacets: StaffActionEntityFacets
  total: number
  staffMembers: { userId: string; username: string }[]
  guildMembers: Awaited<ReturnType<typeof getDiscordGuildMembers>>
}

export async function getStaffActionsData(
  guildId: string,
  session: Session,
  query: StaffActionsQuery
): Promise<StaffActionsResult> {
  const filters = {
    search: query.search,
    staffId: query.staffId,
    filterAction: query.filterAction,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  }

  const [{ actions, total }, counts, entityFacets, staffMembers, guildMembers] =
    await Promise.all([
      getStaffActions(guildId, session, query.page, query.limit, filters),
      getStaffActionCounts(guildId, session, filters),
      getStaffActionEntityFacets(guildId, session, filters),
      getGuildStaffMembers(guildId),
      getDiscordGuildMembers(guildId)
    ])

  return { actions, counts, entityFacets, total, staffMembers, guildMembers }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  staffId?: string
  filterAction?: string
  dateFrom?: string
  dateTo?: string
}

export function normalizeStaffActionsSearchParams(
  searchParams: RawSearchParams = {}
): StaffActionsQuery {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)
  const filterAction = searchParams.filterAction
    ?.split(',')
    .filter((value): value is StaffActionCategory =>
      STAFF_ACTION_CATEGORIES.includes(value as StaffActionCategory)
    )

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    staffId: searchParams.staffId,
    filterAction: filterAction?.length ? filterAction : undefined,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo
  }
}
