import type { Session } from 'next-auth'

import {
  getAtmRequestCounts,
  getAtmRequests
} from '@/actions/database/atmRequest.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { IAtmRequestCounts, TAtmRequestDiscord } from '@/types/types'

import { parseAtmQueueFilterStatus } from './atmQueueFilterParams'

export interface AtmQueueQuery {
  page: number
  limit: number
  search?: string
  filterStatus?: string[]
  filterType?: string[]
  dateFrom?: string
  dateTo?: string
  sort?: string
}

export interface AtmQueueResult {
  requests: TAtmRequestDiscord[]
  counts: IAtmRequestCounts
  total: number
  guildMembers: Awaited<ReturnType<typeof getDiscordGuildMembers>>
}

export async function getAtmQueueData(
  guildId: string,
  session: Session,
  query: AtmQueueQuery
): Promise<AtmQueueResult> {
  const [{ requests, total }, counts, guildMembers] = await Promise.all([
    getAtmRequests(
      guildId,
      session,
      query.page,
      query.limit,
      query.search,
      query.filterStatus,
      query.filterType,
      query.dateFrom,
      query.dateTo,
      query.sort
    ),
    getAtmRequestCounts(guildId, session, {
      search: query.search,
      filterStatus: query.filterStatus,
      filterType: query.filterType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    }),
    getDiscordGuildMembers(guildId)
  ])

  return { requests, counts, total, guildMembers }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  filterStatus?: string
  filterType?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
}

export function normalizeAtmQueueSearchParams(
  searchParams: RawSearchParams = {}
) {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    filterStatus: parseAtmQueueFilterStatus(searchParams.filterStatus),
    filterType: searchParams.filterType?.split(',').filter(Boolean) ?? [],
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    sort: searchParams.sort
  }
}
