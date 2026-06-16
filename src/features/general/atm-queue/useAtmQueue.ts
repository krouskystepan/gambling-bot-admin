import type { Session } from 'next-auth'

import {
  getAtmRequestCounts,
  getAtmRequests
} from '@/actions/database/atmRequest.action'
import { IAtmRequestCounts, TAtmRequestDiscord } from '@/types/types'

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
}

export async function getAtmQueueData(
  guildId: string,
  session: Session,
  query: AtmQueueQuery
): Promise<AtmQueueResult> {
  const [{ requests, total }, counts] = await Promise.all([
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
    getAtmRequestCounts(guildId, session)
  ])

  return { requests, counts, total }
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
    filterStatus: searchParams.filterStatus?.split(',').filter(Boolean) ?? [
      'pending'
    ],
    filterType: searchParams.filterType?.split(',').filter(Boolean) ?? [],
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    sort: searchParams.sort
  }
}
