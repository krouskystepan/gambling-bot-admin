'use server'

import { CASINO_GAME_IDS } from 'gambling-bot-shared/casino'
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TTransaction
} from 'gambling-bot-shared/transactions'
import { Session } from 'next-auth'

import { connectToDatabase } from '@/lib/db'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'
import { cashFlowSum, gamePnLSum } from '@/lib/overview/transactionTotals'
import { LEGACY_CASINO_GAME_KEY } from '@/lib/transactions/transactionFilters'
import { buildTransactionMatch } from '@/lib/transactions/transactionQuery'
import Transaction from '@/models/Transaction'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'

export const getTransactions = async (
  guildId: string,
  session: Session,
  page = 1,
  limit = 15,
  search?: string,
  staffId?: string,
  referenceId?: string,
  filterType?: string[],
  filterSource?: string[],
  filterCasinoGame?: string[],
  dateFrom?: string,
  dateTo?: string,
  sort?: string,
  userId?: string
): Promise<{
  transactions: TTransactionDiscord[]
  total: number
  gamePnL: number
  cashFlow: number
}> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { transactions: [], total: 0, gamePnL: 0, cashFlow: 0 }
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)
  const query = buildTransactionMatch(
    guildId,
    {
      userId,
      search,
      staffId,
      referenceId,
      filterType,
      filterSource,
      filterCasinoGame,
      dateFrom,
      dateTo
    },
    globalSettings.timezone
  )

  const total = await Transaction.countDocuments(query)

  const totalsAgg = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        gamePnL: gamePnLSum,
        cashFlow: cashFlowSum
      }
    }
  ])

  const gamePnL = totalsAgg[0]?.gamePnL ?? 0
  const cashFlow = totalsAgg[0]?.cashFlow ?? 0

  let sortObj: Record<string, 1 | -1> = { createdAt: -1 }

  if (sort) {
    sortObj = {}
    for (const part of sort.split(',')) {
      const [field, dir] = part.split(':')
      if (field) sortObj[field] = dir === 'asc' ? 1 : -1
    }
  }

  const transactions = await Transaction.find(query)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)

  if (!transactions.length) {
    return { transactions: [], total, gamePnL, cashFlow }
  }

  const userIds = Array.from(
    new Set(
      transactions.flatMap((tx) => [tx.userId, tx.handledBy].filter(Boolean))
    )
  )

  const discordMembers = await getDiscordGuildMembers(guildId)
  if (!discordMembers) {
    return { transactions: [], total, gamePnL, cashFlow }
  }

  const discordMap = new Map(
    discordMembers
      .filter((m) => userIds.includes(m.userId))
      .map((m) => [
        m.userId,
        {
          username: m.username,
          nickname: m.nickname,
          avatar: m.avatarUrl || '/default-avatar.jpg'
        }
      ])
  )

  const result: TTransactionDiscord[] = transactions.map((tx) => {
    const user = discordMap.get(tx.userId)
    const handler = tx.handledBy ? discordMap.get(tx.handledBy) : undefined

    return {
      id: tx._id.toString(),
      userId: tx.userId,
      username: user?.username ?? 'Unknown',
      nickname: user?.nickname ?? null,
      avatar: user?.avatar ?? '/default-avatar.jpg',
      type: tx.type,
      meta: tx.meta,
      amount: tx.amount,
      source: tx.source,
      createdAt: tx.createdAt,
      referenceId: tx.referenceId ?? undefined,
      handledBy: tx.handledBy ?? undefined,
      handledByUsername: handler?.username
    }
  })

  return { transactions: result, total, gamePnL, cashFlow }
}

export const getTransactionCounts = async (
  guildId: string,
  session: Session,
  filterType?: string[],
  filterSource?: string[],
  filterCasinoGame?: string[],
  search?: string,
  staffId?: string,
  referenceId?: string,
  dateFrom?: string,
  dateTo?: string,
  userId?: string
): Promise<ITransactionCounts> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return {
      type: Object.fromEntries(TRANSACTION_TYPES.map((t) => [t, 0])) as Record<
        TTransaction['type'],
        number
      >,
      source: Object.fromEntries(
        TRANSACTION_SOURCES.map((s) => [s, 0])
      ) as Record<TTransaction['source'], number>,
      casinoGame: Object.fromEntries(
        [...CASINO_GAME_IDS, LEGACY_CASINO_GAME_KEY].map((game) => [game, 0])
      ),
      staff: {},
      users: {}
    }
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)
  const timezone = globalSettings.timezone

  const sharedFilters = {
    userId,
    search,
    staffId,
    referenceId,
    dateFrom,
    dateTo
  }

  const typeQuery = buildTransactionMatch(
    guildId,
    {
      ...sharedFilters,
      filterSource,
      filterCasinoGame
    },
    timezone
  )

  const sourceQuery = buildTransactionMatch(
    guildId,
    {
      ...sharedFilters,
      filterType,
      filterCasinoGame
    },
    timezone
  )

  const casinoGameQuery = buildTransactionMatch(
    guildId,
    {
      ...sharedFilters,
      filterType,
      filterSource
    },
    timezone
  )

  const staffFacetQuery = buildTransactionMatch(
    guildId,
    {
      userId,
      search,
      referenceId,
      dateFrom,
      dateTo,
      filterType,
      filterSource,
      filterCasinoGame
    },
    timezone
  )

  const userFacetQuery = buildTransactionMatch(
    guildId,
    {
      staffId,
      referenceId,
      dateFrom,
      dateTo,
      filterType,
      filterSource,
      filterCasinoGame
    },
    timezone
  )

  const [typeAgg, sourceAgg, casinoGameAgg, staffFacetAgg, userFacetAgg] =
    await Promise.all([
      Transaction.aggregate([
        { $match: typeQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: sourceQuery },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...casinoGameQuery, source: 'casino' } },
        {
          $group: {
            _id: { $ifNull: ['$meta.game', LEGACY_CASINO_GAME_KEY] },
            count: { $sum: 1 }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            ...staffFacetQuery,
            handledBy: { $exists: true, $ne: null }
          }
        },
        { $group: { _id: '$handledBy', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: userFacetQuery },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ])
    ])

  const typeCounts = Object.fromEntries(
    TRANSACTION_TYPES.map((t) => [t, 0])
  ) as Record<TTransaction['type'], number>

  typeAgg.forEach((t) => {
    typeCounts[t._id as TTransaction['type']] = t.count
  })

  const sourceCounts = Object.fromEntries(
    TRANSACTION_SOURCES.map((s) => [s, 0])
  ) as Record<TTransaction['source'], number>

  sourceAgg.forEach((s) => {
    sourceCounts[s._id as TTransaction['source']] = s.count
  })

  const casinoGameCounts = Object.fromEntries(
    [...CASINO_GAME_IDS, LEGACY_CASINO_GAME_KEY].map((game) => [game, 0])
  ) as Record<string, number>

  casinoGameAgg.forEach((row) => {
    casinoGameCounts[row._id as string] = row.count
  })

  const staffCounts: Record<string, number> = {}
  staffFacetAgg.forEach((row) => {
    if (row._id) {
      staffCounts[row._id as string] = row.count
    }
  })

  const userCounts: Record<string, number> = {}
  userFacetAgg.forEach((row) => {
    if (row._id) {
      userCounts[row._id as string] = row.count
    }
  })

  return {
    type: typeCounts,
    source: sourceCounts,
    casinoGame: casinoGameCounts,
    staff: staffCounts,
    users: userCounts
  }
}

export const deleteTransaction = async (
  transactionId: string,
  guildId: string
): Promise<{ success: boolean; message?: string }> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  await connectToDatabase()

  const deleted = await Transaction.findOneAndDelete({
    _id: transactionId,
    guildId
  })

  if (!deleted) {
    return { success: false, message: 'Transaction not found' }
  }

  return { success: true, message: 'Transaction deleted' }
}
