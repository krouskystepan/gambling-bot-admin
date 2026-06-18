import type { Session } from 'next-auth'

import { getGuildStaffMembers } from '@/actions/database/staffActions.action'
import {
  getTransactionCounts,
  getTransactions
} from '@/actions/database/transaction.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

export interface TransactionsQuery {
  page: number
  limit: number
  search?: string
  staffId?: string
  betId?: string
  adminSearch?: string
  filterType?: string[]
  filterSource?: string[]
  filterCasinoGame?: string[]
  dateFrom?: string
  dateTo?: string
  sort?: string
  userId?: string
}

export interface TransactionsResult {
  transactions: TTransactionDiscord[]
  transactionCounts: ITransactionCounts
  total: number
  gamePnL: number
  cashFlow: number
  staffMembers: { userId: string; username: string }[]
  guildMembers: Awaited<ReturnType<typeof getDiscordGuildMembers>>
}

export async function getTransactionsData(
  guildId: string,
  session: Session,
  query: TransactionsQuery
): Promise<TransactionsResult> {
  const [
    { transactions, total, gamePnL, cashFlow },
    transactionCounts,
    staffMembers,
    guildMembers
  ] = await Promise.all([
    getTransactions(
      guildId,
      session,
      query.page,
      query.limit,
      query.search,
      query.staffId,
      query.betId,
      query.adminSearch,
      query.filterType,
      query.filterSource,
      query.filterCasinoGame,
      query.dateFrom,
      query.dateTo,
      query.sort,
      query.userId
    ),
    getTransactionCounts(
      guildId,
      session,
      query.filterType,
      query.filterSource,
      query.filterCasinoGame,
      query.search,
      query.staffId,
      query.betId,
      query.adminSearch,
      query.dateFrom,
      query.dateTo,
      query.userId
    ),
    getGuildStaffMembers(guildId),
    getDiscordGuildMembers(guildId)
  ])

  return {
    transactions,
    transactionCounts,
    total,
    gamePnL,
    cashFlow,
    staffMembers,
    guildMembers
  }
}

type RawSearchParams = {
  page?: string
  limit?: string
  search?: string
  staffId?: string
  betId?: string
  adminSearch?: string
  filterType?: string
  filterSource?: string
  filterCasinoGame?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
}

type NormalizedSearchParams = {
  page: number
  limit: number
  search?: string
  staffId?: string
  betId?: string
  adminSearch?: string
  filterType: string[]
  filterSource: string[]
  filterCasinoGame: string[]
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
    staffId: searchParams.staffId,
    betId: searchParams.betId,
    adminSearch: searchParams.adminSearch,
    filterType: searchParams.filterType?.split(',').filter(Boolean) ?? [],
    filterSource: searchParams.filterSource?.split(',').filter(Boolean) ?? [],
    filterCasinoGame:
      searchParams.filterCasinoGame?.split(',').filter(Boolean) ?? [],
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    sort: searchParams.sort
  }
}
