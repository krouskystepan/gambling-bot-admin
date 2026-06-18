'use server'

import {
  type GlobalSettings,
  normalizeGlobalSettings,
  resolveGuildTimezone
} from 'gambling-bot-shared/guild'
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TTransaction
} from 'gambling-bot-shared/transactions'
import { Session } from 'next-auth'

import {
  OverviewDailyPoint,
  OverviewDateRange,
  OverviewPnLSeries,
  fillDailySeries,
  fillHourlySeries,
  resolveOverviewPnLGranularity
} from '@/features/general/overview/period'
import { connectToDatabase } from '@/lib/db'
import { guildDateRangeMatch } from '@/lib/guild/guildTimezone'
import { buildPnLTimeGroupStage } from '@/lib/overview/overviewPnLAggregation'
import {
  netProfitSum,
  periodTotalsGroup
} from '@/lib/overview/transactionTotals'
import {
  VolumeSlice,
  buildVolumeSlices,
  volumeAmountGroupStage
} from '@/lib/overview/volumeSlices'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import VipRoom from '@/models/VipRoom'
import { TTransactionDiscord } from '@/types/types'

import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'
import { getTransactions } from './transaction.action'

export type OverviewTopUser = {
  userId: string
  username: string
  nickname: string | null
  avatar: string
  balance: number
  netProfit: number
}

export type OverviewData = {
  globalSettings: GlobalSettings
  gamePnL: number
  cashFlow: number
  txCount: number
  typeCounts: Record<TTransaction['type'], number>
  sourceCounts: Record<TTransaction['source'], number>
  pnlSeries: OverviewPnLSeries
  sourceAmounts: VolumeSlice[]
  registeredUsers: number
  totalLiability: number
  vipRoomCount: number
  topByBalance: OverviewTopUser[]
  topByNetProfit: OverviewTopUser[]
  recentTransactions: TTransactionDiscord[]
}

async function enrichTopUsers(
  guildId: string,
  balanceLeaders: { userId: string; balance: number }[],
  netProfitLeaders: { userId: string; netProfit: number }[]
): Promise<{
  topByBalance: OverviewTopUser[]
  topByNetProfit: OverviewTopUser[]
}> {
  const userIds = Array.from(
    new Set([
      ...balanceLeaders.map((u) => u.userId),
      ...netProfitLeaders.map((u) => u.userId)
    ])
  )

  if (!userIds.length) {
    return { topByBalance: [], topByNetProfit: [] }
  }

  const [discordMembers, dbUsers] = await Promise.all([
    getDiscordGuildMembers(guildId),
    User.find({ guildId, userId: { $in: userIds } }).lean()
  ])

  const discordMap = new Map(
    (discordMembers ?? [])
      .filter((m) => userIds.includes(m.userId))
      .map((m) => [m.userId, m])
  )
  const balanceMap = new Map(dbUsers.map((u) => [u.userId, u.balance ?? 0]))
  const netProfitMap = new Map(
    netProfitLeaders.map((u) => [u.userId, u.netProfit])
  )

  const toOverviewUser = (
    userId: string,
    balance: number,
    netProfit: number
  ): OverviewTopUser => {
    const discord = discordMap.get(userId)
    return {
      userId,
      username: discord?.username ?? 'Unknown',
      nickname: discord?.nickname ?? null,
      avatar: discord?.avatarUrl ?? '/default-avatar.jpg',
      balance,
      netProfit
    }
  }

  return {
    topByBalance: balanceLeaders.map((u) =>
      toOverviewUser(u.userId, u.balance, netProfitMap.get(u.userId) ?? 0)
    ),
    topByNetProfit: netProfitLeaders.map((u) =>
      toOverviewUser(u.userId, balanceMap.get(u.userId) ?? 0, u.netProfit)
    )
  }
}

export async function getGuildOverviewTimezone(
  guildId: string
): Promise<string> {
  await connectToDatabase()
  const doc = await GuildConfiguration.findOne({ guildId })
    .select('globalSettings.timezone')
    .lean()
  return resolveGuildTimezone(doc?.globalSettings?.timezone)
}

export async function getOverviewData(
  guildId: string,
  session: Session,
  range: OverviewDateRange
): Promise<OverviewData | null> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const timezone = resolveGuildTimezone(guildConfig?.globalSettings?.timezone)

  const dateMatch = guildDateRangeMatch(
    guildId,
    range.dateFrom,
    range.dateTo,
    timezone
  )

  const pnlGranularity = resolveOverviewPnLGranularity(range, timezone)

  const [
    periodTotals,
    typeAgg,
    sourceAgg,
    dailyAgg,
    sourceAmountAgg,
    registeredUsers,
    liabilityAgg,
    vipRoomCount,
    topBalanceUsers,
    topNetProfitAgg,
    recentResult
  ] = await Promise.all([
    Transaction.aggregate([{ $match: dateMatch }, periodTotalsGroup]),
    Transaction.aggregate([
      { $match: dateMatch },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: dateMatch },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: dateMatch },
      buildPnLTimeGroupStage(timezone, pnlGranularity),
      { $sort: { _id: 1 } }
    ]),
    Transaction.aggregate([{ $match: dateMatch }, volumeAmountGroupStage]),
    User.countDocuments({ guildId }),
    User.aggregate([
      { $match: { guildId } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: ['$balance', '$bonusBalance', '$lockedBalance']
            }
          }
        }
      }
    ]),
    VipRoom.countDocuments({ guildId }),
    User.find({ guildId }).sort({ balance: -1 }).limit(5).lean(),
    Transaction.aggregate([
      {
        $match: {
          ...dateMatch,
          type: { $in: ['bet', 'win', 'bonus'] }
        }
      },
      {
        $group: {
          _id: '$userId',
          netProfit: netProfitSum
        }
      },
      { $sort: { netProfit: -1 } },
      { $limit: 5 }
    ]),
    getTransactions(
      guildId,
      session,
      1,
      10,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      range.dateFrom,
      range.dateTo
    )
  ])

  const totals = periodTotals[0]
  const gamePnL = totals?.gamePnL ?? 0
  const cashFlow = totals?.cashFlow ?? 0
  const txCount = totals?.txCount ?? 0

  const typeCounts = Object.fromEntries(
    TRANSACTION_TYPES.map((t) => [t, 0])
  ) as Record<TTransaction['type'], number>
  typeAgg.forEach((row) => {
    typeCounts[row._id as TTransaction['type']] = row.count
  })

  const sourceCounts = Object.fromEntries(
    TRANSACTION_SOURCES.map((s) => [s, 0])
  ) as Record<TTransaction['source'], number>
  sourceAgg.forEach((row) => {
    sourceCounts[row._id as TTransaction['source']] = row.count
  })

  const pnlPoints: OverviewDailyPoint[] = dailyAgg.map((row) => ({
    date: row._id as string,
    gamePnL: row.gamePnL ?? 0,
    cashFlow: row.cashFlow ?? 0,
    txCount: row.txCount ?? 0
  }))

  const pnlSeries: OverviewPnLSeries = {
    granularity: pnlGranularity,
    points:
      pnlGranularity === 'hour'
        ? fillHourlySeries(range, pnlPoints, timezone)
        : fillDailySeries(range, pnlPoints, timezone)
  }

  const sourceAmounts = buildVolumeSlices(sourceAmountAgg)

  const { topByBalance, topByNetProfit } = await enrichTopUsers(
    guildId,
    topBalanceUsers.map((u) => ({
      userId: u.userId,
      balance: u.balance ?? 0
    })),
    topNetProfitAgg.map((row) => ({
      userId: row._id as string,
      netProfit: row.netProfit ?? 0
    }))
  )

  return {
    globalSettings: normalizeGlobalSettings(
      guildConfig?.globalSettings as Partial<GlobalSettings> | undefined
    ),
    gamePnL,
    cashFlow,
    txCount,
    typeCounts,
    sourceCounts,
    pnlSeries,
    sourceAmounts,
    registeredUsers,
    totalLiability: liabilityAgg[0]?.total ?? 0,
    vipRoomCount,
    topByBalance,
    topByNetProfit,
    recentTransactions: recentResult.transactions
  }
}
