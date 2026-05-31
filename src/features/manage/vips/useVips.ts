import type { Session } from 'next-auth'

import { getVips } from '@/actions/database/vipActions.action'
import { TVipChannels } from '@/types/types'

export interface VipsQuery {
  page: number
  limit: number
  search?: string
  sort?: string
}

export interface VipsResult {
  vips: TVipChannels[]
  total: number
}

export async function getVipsData(
  guildId: string,
  session: Session,
  query: VipsQuery
): Promise<VipsResult> {
  const { vips, total } = await getVips(
    guildId,
    session,
    query.page,
    query.limit,
    query.search,
    query.sort
  )

  return {
    vips,
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

export function normalizeVipsSearchParams(
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
