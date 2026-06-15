import type { TRaffleStatus } from 'gambling-bot-shared'
import type { Session } from 'next-auth'

import { getRaffles } from '@/actions/database/raffleActions.action'
import { TRaffleRow } from '@/types/types'

export interface RafflesQuery {
  page: number
  limit: number
  search?: string
  sort?: string
  status: TRaffleStatus | 'all'
}

export interface RafflesResult {
  raffles: TRaffleRow[]
  total: number
}

export async function getRafflesData(
  guildId: string,
  session: Session,
  query: RafflesQuery
): Promise<RafflesResult> {
  const { raffles, total } = await getRaffles(
    guildId,
    session,
    query.page,
    query.limit,
    query.search,
    query.sort,
    query.status
  )

  return { raffles, total }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  sort?: string
  status?: string
}

type NormalizedSearchParams = {
  page: number
  limit: number
  search?: string
  sort?: string
  status: TRaffleStatus | 'all'
}

function parseStatus(status?: string): TRaffleStatus | 'all' {
  if (status === 'canceled' || status === 'all') return status
  return 'active'
}

export function normalizeRafflesSearchParams(
  searchParams: RawSearchParams = {}
): NormalizedSearchParams {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    sort: searchParams.sort,
    status: parseStatus(searchParams.status)
  }
}
