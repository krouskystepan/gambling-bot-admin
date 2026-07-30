import type { QuestKind } from 'gambling-bot-shared/quests'
import type { Session } from 'next-auth'

import { getQuests } from '@/actions/database/questActions.action'

export interface QuestsQuery {
  page: number
  limit: number
  search?: string
  sort?: string
  kind: QuestKind | 'all'
}

export interface QuestsResult {
  quests: Awaited<ReturnType<typeof getQuests>>['quests']
  total: number
}

export async function getQuestsData(
  guildId: string,
  session: Session,
  query: QuestsQuery
): Promise<QuestsResult> {
  const { quests, total } = await getQuests(
    guildId,
    session,
    query.page,
    query.limit,
    query.search,
    query.sort,
    query.kind
  )

  return { quests, total }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  sort?: string
  kind?: string
}

function parseKind(kind?: string): QuestKind | 'all' {
  if (kind === 'daily' || kind === 'normal' || kind === 'all') return kind
  return 'all'
}

export function normalizeQuestsSearchParams(
  searchParams: RawSearchParams = {}
): QuestsQuery {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    sort: searchParams.sort,
    kind: parseKind(searchParams.kind)
  }
}
