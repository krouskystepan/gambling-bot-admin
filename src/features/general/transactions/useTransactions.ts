import type { Session } from 'next-auth'

import {
  getTransactionCounts,
  getTransactions
} from '@/actions/database/transaction.action'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

export interface TransactionsQuery {
  page: number
  limit: number
  search?: string
  adminSearch?: string
  filterType?: string[]
  filterSource?: string[]
  dateFrom?: string
  dateTo?: string
  sort?: string
}

export interface TransactionsResult {
  transactions: TTransactionDiscord[]
  transactionCounts: ITransactionCounts
  total: number
  gamePnL: number
  cashFlow: number
}

export async function getTransactionsData(
  guildId: string,
  session: Session,
  query: TransactionsQuery
): Promise<TransactionsResult> {
  const { transactions, total, gamePnL, cashFlow } = await getTransactions(
    guildId,
    session,
    query.page,
    query.limit,
    query.search,
    query.adminSearch,
    query.filterType,
    query.filterSource,
    query.dateFrom,
    query.dateTo,
    query.sort
  )

  const rawCounts = await getTransactionCounts(
    guildId,
    session,
    query.filterType,
    query.filterSource,
    query.search,
    query.adminSearch,
    query.dateFrom,
    query.dateTo
  )

  const emptyTypeCounts = {
    deposit: 0,
    withdraw: 0,
    bet: 0,
    vip: 0,
    win: 0,
    bonus: 0,
    refund: 0
  }

  const emptySourceCounts = {
    system: 0,
    admin: 0,
    user: 0,
    bot: 0
  }

  const transactionCounts = {
    type: {
      ...emptyTypeCounts,
      ...(rawCounts?.type ?? {})
    },
    source: {
      ...emptySourceCounts,
      ...(rawCounts?.source ?? {})
    }
  }

  return {
    transactions,
    transactionCounts,
    total,
    gamePnL: gamePnL ?? 0,
    cashFlow: cashFlow ?? 0
  }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  adminSearch?: string
  filterType?: string
  filterSource?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
}

type NormalizedSearchParams = {
  page: number
  limit: number
  search?: string
  adminSearch?: string
  filterType: string[]
  filterSource: string[]
  dateFrom?: string
  dateTo?: string
  sort?: string
}

export function normalizeTransactionsSearchParams(
  searchParams: RawSearchParams = {}
): NormalizedSearchParams {
  const page = Number(searchParams.page)
  const limit = Number(searchParams.limit)

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
    search: searchParams.search,
    adminSearch: searchParams.adminSearch,
    filterType: searchParams.filterType?.split(',').filter(Boolean) ?? [],
    filterSource: searchParams.filterSource?.split(',').filter(Boolean) ?? [],
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    sort: searchParams.sort
  }
}
