import type { Session } from 'next-auth'

import {
  type GuildBanRow,
  type GuildBanStatusFilter,
  getGuildBans
} from '@/actions/database/guildBans.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'

export type BansQuery = {
  page: number
  limit: number
  userId?: string
  sort?: string
  status: GuildBanStatusFilter
}

export type BansResult = {
  bans: GuildBanRow[]
  total: number
  guildMembers: Awaited<ReturnType<typeof getDiscordGuildMembers>>
}

export async function getBansData(
  guildId: string,
  session: Session,
  query: BansQuery
): Promise<BansResult> {
  const [{ bans, total }, guildMembers] = await Promise.all([
    getGuildBans(
      guildId,
      session,
      query.page,
      query.limit,
      query.status,
      query.userId,
      query.sort
    ),
    getDiscordGuildMembers(guildId)
  ])

  return { bans, total, guildMembers }
}

type RawSearchParams = {
  page?: string
  limit?: string
  userId?: string
  sort?: string
  status?: string
}

function parseStatus(status?: string): GuildBanStatusFilter {
  if (status === 'ended' || status === 'all') return status
  return 'active'
}

export function normalizeBansSearchParams(
  searchParams: RawSearchParams = {}
): BansQuery {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    userId: searchParams.userId,
    sort: searchParams.sort,
    status: parseStatus(searchParams.status)
  }
}
