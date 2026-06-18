import type { TRaffleStatus } from 'gambling-bot-shared/raffle'
import type { Session } from 'next-auth'

import { getRaffles } from '@/actions/database/raffleActions.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { TRaffleRow } from '@/types/types'

export interface RafflesQuery {
  page: number
  limit: number
  search?: string
  userId?: string
  sort?: string
  status: TRaffleStatus | 'all'
}

export interface RafflesResult {
  raffles: TRaffleRow[]
  total: number
  guildMembers: Awaited<ReturnType<typeof getDiscordGuildMembers>>
}

export async function getRafflesData(
  guildId: string,
  session: Session,
  query: RafflesQuery
): Promise<RafflesResult> {
  const [{ raffles, total }, guildMembers] = await Promise.all([
    getRaffles(
      guildId,
      session,
      query.page,
      query.limit,
      query.search,
      query.sort,
      query.status,
      query.userId
    ),
    getDiscordGuildMembers(guildId)
  ])

  return { raffles, total, guildMembers }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  userId?: string
  sort?: string
  status?: string
}

type NormalizedSearchParams = {
  page: number
  limit: number
  search?: string
  userId?: string
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
    userId: searchParams.userId,
    sort: searchParams.sort,
    status: parseStatus(searchParams.status)
  }
}
