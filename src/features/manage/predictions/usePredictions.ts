import type { TPrediction } from 'gambling-bot-shared'
import type { Session } from 'next-auth'

import { getPredictions } from '@/actions/database/predictionActions.action'
import { TPredictionRow } from '@/types/types'

export interface PredictionsQuery {
  page: number
  limit: number
  search?: string
  sort?: string
  status: TPrediction['status'] | 'all'
}

export interface PredictionsResult {
  predictions: TPredictionRow[]
  total: number
}

export async function getPredictionsData(
  guildId: string,
  session: Session,
  query: PredictionsQuery
): Promise<PredictionsResult> {
  const { predictions, total } = await getPredictions(
    guildId,
    session,
    query.page,
    query.limit,
    query.search,
    query.sort,
    query.status
  )

  return { predictions, total }
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
  status: TPrediction['status'] | 'all'
}

const validStatuses: Array<TPrediction['status'] | 'all'> = [
  'active',
  'ended',
  'paying',
  'paid',
  'canceled',
  'all'
]

function parseStatus(status?: string): TPrediction['status'] | 'all' {
  if (
    status &&
    validStatuses.includes(status as TPrediction['status'] | 'all')
  ) {
    return status as TPrediction['status'] | 'all'
  }

  return 'active'
}

export function normalizePredictionsSearchParams(
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
