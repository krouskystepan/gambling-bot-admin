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

  const transactionCounts: ITransactionCounts = {
    type: {
      deposit: Number(rawCounts?.type?.deposit ?? 0),
      withdraw: Number(rawCounts?.type?.withdraw ?? 0),
      bet: Number(rawCounts?.type?.bet ?? 0),
      vip: Number(rawCounts?.type?.vip ?? 0),
      win: Number(rawCounts?.type?.win ?? 0),
      bonus: Number(rawCounts?.type?.bonus ?? 0),
      refund: Number(rawCounts?.type?.refund ?? 0)
    },

    source: {
      command: Number(rawCounts?.source?.command ?? 0),
      manual: Number(rawCounts?.source?.manual ?? 0),
      web: Number(rawCounts?.source?.web ?? 0),
      system: Number(rawCounts?.source?.system ?? 0),
      casino: Number(rawCounts?.source?.casino ?? 0)
    }
  }

  return {
    transactions,
    transactionCounts,
    total: Number(total ?? 0),
    gamePnL: Number(gamePnL ?? 0),
    cashFlow: Number(cashFlow ?? 0)
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
