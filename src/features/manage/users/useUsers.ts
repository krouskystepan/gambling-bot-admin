import type { Session } from 'next-auth'

import { getUsers } from '@/actions/database/user.action'
import { TGuildMemberStatus } from '@/types/types'

export interface UsersQuery {
  page: number
  limit: number
  search?: string
  sort?: string
}

export interface UsersResult {
  users: TGuildMemberStatus[]
  total: number
}

export async function getUsersData(
  guildId: string,
  session: Session,
  query: UsersQuery
): Promise<UsersResult> {
  const { users, total } = await getUsers(
    guildId,
    session,
    query.page,
    query.limit,
    query.search,
    query.sort
  )

  return {
    users,
    total
  }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  sort?: string
}

type NormalizedSearchParams = {
  page: number
  limit: number
  search?: string
  sort?: string
}

export function normalizeUsersSearchParams(
  searchParams: RawSearchParams = {}
): NormalizedSearchParams {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    sort: searchParams.sort
  }
}
