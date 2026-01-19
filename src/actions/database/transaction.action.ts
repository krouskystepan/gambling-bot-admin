'use server'

import { TTransaction } from 'gambling-bot-shared'
import { Session, getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { connectToDatabase } from '@/lib/db'
import Transaction from '@/models/Transaction'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import { getDiscordGuildMembers } from '../discord/member.action'

type TransactionFilter = Record<string, unknown>

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getTransactions = async (
  guildId: string,
  session: Session,
  page = 1,
  limit = 15,
  search?: string,
  adminSearch?: string,
  filterType?: string[],
  filterSource?: string[],
  dateFrom?: string,
  dateTo?: string,
  sort?: string
): Promise<{
  transactions: TTransactionDiscord[]
  total: number
  gamePnL: number
  cashFlow: number
}> => {
  if (!session.accessToken || page < 1 || limit < 1 || limit > 50) {
    return { transactions: [], total: 0, gamePnL: 0, cashFlow: 0 }
  }

  await connectToDatabase()

  const andFilters: TransactionFilter[] = []

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    andFilters.push({ userId: regex })
  }

  if (adminSearch) {
    const regex = new RegExp(escapeRegExp(adminSearch), 'i')
    andFilters.push({ $or: [{ handledBy: regex }, { betId: regex }] })
  }

  if (filterType?.length) {
    andFilters.push({ type: { $in: filterType } })
  }

  if (filterSource?.length) {
    andFilters.push({ source: { $in: filterSource } })
  }

  if (dateFrom && dateTo) {
    const from = new Date(dateFrom)
    from.setHours(0, 0, 0, 0)

    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)

    andFilters.push({ createdAt: { $gte: from, $lte: to } })
  }

  const query: TransactionFilter =
    andFilters.length > 0 ? { guildId, $and: andFilters } : { guildId }

  const total = await Transaction.countDocuments(query)

  const totalsAgg = await Transaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        gamePnL: {
          $sum: {
            $switch: {
              branches: [
                { case: { $in: ['$type', ['bet', 'vip']] }, then: '$amount' },
                {
                  case: { $in: ['$type', ['win', 'bonus', 'refund']] },
                  then: { $multiply: ['$amount', -1] }
                }
              ],
              default: 0
            }
          }
        },
        cashFlow: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$type', 'deposit'] }, then: '$amount' },
                {
                  case: { $eq: ['$type', 'withdraw'] },
                  then: { $multiply: ['$amount', -1] }
                }
              ],
              default: 0
            }
          }
        }
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
      betId: tx.betId ?? undefined,
      handledBy: tx.handledBy ?? undefined,
      handledByUsername: handler?.username
    }
  })

  return { transactions: result, total, gamePnL, cashFlow }
}

const typeBadgeMap: Record<TTransaction['type'], string> = {
  deposit: '',
  withdraw: '',
  bet: '',
  win: '',
  refund: '',
  bonus: '',
  vip: ''
}

const sourceBadgeMap: Record<TTransaction['source'], string> = {
  casino: '',
  command: '',
  manual: '',
  system: '',
  web: ''
}

export const getTransactionCounts = async (
  guildId: string,
  session: Session,
  filterType?: string[],
  filterSource?: string[],
  search?: string,
  adminSearch?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<ITransactionCounts> => {
  if (!session.accessToken) {
    return {
      type: Object.fromEntries(
        Object.keys(typeBadgeMap).map((t) => [t, 0])
      ) as Record<TTransaction['type'], number>,
      source: Object.fromEntries(
        Object.keys(sourceBadgeMap).map((s) => [s, 0])
      ) as Record<TTransaction['source'], number>
    }
  }

  await connectToDatabase()

  const andFilters: TransactionFilter[] = []

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    andFilters.push({ userId: regex })
  }

  if (adminSearch) {
    const regex = new RegExp(escapeRegExp(adminSearch), 'i')
    andFilters.push({ $or: [{ handledBy: regex }, { betId: regex }] })
  }

  if (filterType?.length) {
    andFilters.push({ type: { $in: filterType } })
  }

  if (filterSource?.length) {
    andFilters.push({ source: { $in: filterSource } })
  }

  if (dateFrom && dateTo) {
    const from = new Date(dateFrom)
    from.setHours(0, 0, 0, 0)

    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)

    andFilters.push({ createdAt: { $gte: from, $lte: to } })
  }

  const query: TransactionFilter =
    andFilters.length > 0 ? { guildId, $and: andFilters } : { guildId }

  const typeAgg = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ])

  const sourceAgg = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ])

  const typeCounts = Object.fromEntries(
    Object.keys(typeBadgeMap).map((t) => [t, 0])
  ) as Record<TTransaction['type'], number>

  typeAgg.forEach((t) => {
    typeCounts[t._id as TTransaction['type']] = t.count
  })

  const sourceCounts = Object.fromEntries(
    Object.keys(sourceBadgeMap).map((s) => [s, 0])
  ) as Record<TTransaction['source'], number>

  sourceAgg.forEach((s) => {
    sourceCounts[s._id as TTransaction['source']] = s.count
  })

  return { type: typeCounts, source: sourceCounts }
}

export const deleteTransaction = async (
  transactionId: string
): Promise<{ success: boolean; message?: string }> => {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return { success: false, message: 'Unauthorized' }
  }

  await connectToDatabase()

  const deleted = await Transaction.findOneAndDelete({ _id: transactionId })

  if (!deleted) {
    return { success: false, message: 'Transaction not found' }
  }

  return { success: true, message: 'Transaction deleted' }
}
