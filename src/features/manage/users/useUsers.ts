import type { Session } from 'next-auth'

import { getUsers } from '@/actions/database/user.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { TGuildMemberStatus } from '@/types/types'

export type UserRegistrationFilter = 'all' | 'registered' | 'not_registered'
export type UserBanStatusFilter = 'all' | 'active' | 'banned'

export interface UsersQuery {
  page: number
  limit: number
  search?: string
  sort?: string
  registration: UserRegistrationFilter
  banStatus: UserBanStatusFilter
}

export interface UsersResult {
  users: TGuildMemberStatus[]
  total: number
  guildMembers: Awaited<ReturnType<typeof getDiscordGuildMembers>>
  registeredUserIds: string[]
}

export async function getUsersData(
  guildId: string,
  session: Session,
  query: UsersQuery
): Promise<UsersResult> {
  const [{ users, total, registeredUserIds }, guildMembers] = await Promise.all(
    [
      getUsers(
        guildId,
        session,
        query.page,
        query.limit,
        query.search,
        query.sort,
        query.registration,
        query.banStatus
      ),
      getDiscordGuildMembers(guildId)
    ]
  )

  return {
    users,
    total,
    guildMembers,
    registeredUserIds
  }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  sort?: string
  registration?: string
  banStatus?: string
}

function parseRegistration(registration?: string): UserRegistrationFilter {
  if (registration === 'registered' || registration === 'not_registered') {
    return registration
  }
  return 'all'
}

function parseBanStatus(banStatus?: string): UserBanStatusFilter {
  if (banStatus === 'active' || banStatus === 'banned') {
    return banStatus
  }
  return 'all'
}

export function normalizeUsersSearchParams(searchParams: RawSearchParams = {}) {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    sort: searchParams.sort,
    registration: parseRegistration(searchParams.registration),
    banStatus: parseBanStatus(searchParams.banStatus)
  }
}
