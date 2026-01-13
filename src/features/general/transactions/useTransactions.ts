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

  const transactionCounts = await getTransactionCounts(
    guildId,
    session,
    query.filterType,
    query.filterSource,
    query.search,
    query.adminSearch,
    query.dateFrom,
    query.dateTo
  )

  return {
    transactions,
    transactionCounts,
    total,
    gamePnL,
    cashFlow
  }
}
