'use server'

import {
  TGuildConfiguration,
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TTransaction,
  calculateRTP,
  defaultCasinoSettings,
  getReadableName,
  readableGameNames,
  resolveGuildTimezone
} from 'gambling-bot-shared'
import { Session } from 'next-auth'

import {
  OverviewDailyPoint,
  OverviewDateRange,
  fillDailySeries
} from '@/features/general/overview/period'
import { guildDateRangeMatch } from '@/lib/guildTimezone'
import { connectToDatabase } from '@/lib/db'
import { getRtpStatus } from '@/lib/rtpWarnings'
import {
  cashFlowSum,
  gamePnLSum,
  netProfitSum,
  periodTotalsGroup
} from '@/lib/transactionTotals'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import VipRoom from '@/models/VipRoom'
import { TTransactionDiscord } from '@/types/types'

import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'
import { getTransactions } from './transaction.action'

const HIDDEN_RTP_GAMES = new Set(['blackjack', 'prediction', 'raffle'])

export type OverviewTopUser = {
  userId: string
  username: string
  nickname: string | null
  avatar: string
  balance: number
  netProfit: number
}

export type SetupHealthCheck = {
  id: string
  label: string
  ok: boolean
  href?: string
  warning?: boolean
  rtpStatus?: 'high' | 'low'
}

export type OverviewData = {
  gamePnL: number
  cashFlow: number
  txCount: number
  typeCounts: Record<TTransaction['type'], number>
  sourceCounts: Record<TTransaction['source'], number>
  dailySeries: OverviewDailyPoint[]
  sourceAmounts: { source: TTransaction['source']; amount: number }[]
  registeredUsers: number
  totalLiability: number
  vipRoomCount: number
  topByBalance: OverviewTopUser[]
  topByNetProfit: OverviewTopUser[]
  recentTransactions: TTransactionDiscord[]
  setupHealth: SetupHealthCheck[]
}

function buildSetupHealth(
  guildId: string,
  config: TGuildConfiguration | null
): SetupHealthCheck[] {
  const settingsBase = `/dashboard/g/${guildId}`
  const checks: SetupHealthCheck[] = [
    {
      id: 'atm-actions',
      label: 'ATM actions channel',
      ok: Boolean(config?.atmChannelIds?.actions),
      href: `${settingsBase}/channel-settings`
    },
    {
      id: 'atm-logs',
      label: 'ATM logs channel',
      ok: Boolean(config?.atmChannelIds?.logs),
      href: `${settingsBase}/channel-settings`
    },
    {
      id: 'manager-role',
      label: 'Manager role',
      ok: Boolean(config?.managerRoleId),
      href: `${settingsBase}/manager-settings`
    },
    {
      id: 'casino-channels',
      label: 'Casino channels',
      ok: (config?.casinoChannelIds?.length ?? 0) > 0,
      href: `${settingsBase}/channel-settings`
    },
    {
      id: 'vip-owner-role',
      label: 'VIP owner role',
      ok: Boolean(config?.vipSettings?.roleOwnerId),
      href: `${settingsBase}/vip-settings`
    },
    {
      id: 'vip-member-role',
      label: 'VIP member role',
      ok: Boolean(config?.vipSettings?.roleMemberId),
      href: `${settingsBase}/vip-settings`
    },
    {
      id: 'vip-category',
      label: 'VIP category',
      ok: Boolean(config?.vipSettings?.categoryId),
      href: `${settingsBase}/vip-settings`
    }
  ]

  const casinoSettings = config?.casinoSettings ?? defaultCasinoSettings
  const games = Object.keys(casinoSettings) as Array<
    keyof typeof defaultCasinoSettings
  >

  for (const game of games) {
    if (HIDDEN_RTP_GAMES.has(game)) continue

    const settings = casinoSettings[game]
    if (!settings) continue

    const rtp = calculateRTP(
      game,
      settings as (typeof defaultCasinoSettings)[typeof game]
    )

    const status = getRtpStatus(rtp, false)
    if (status !== 'high' && status !== 'low') continue

    const rtpLabel =
      typeof rtp === 'number'
        ? `${rtp.toFixed(1)}%`
        : Object.entries(rtp)
            .map(([k, v]) => `${k}: ${v.toFixed(1)}%`)
            .join(', ')

    checks.push({
      id: `rtp-${game}`,
      label: `${getReadableName(game, readableGameNames)} RTP out of range (${rtpLabel})`,
      ok: false,
      warning: true,
      rtpStatus: status,
      href: `${settingsBase}/casino-settings`
    })
  }

  return checks
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

export async function getGuildOverviewTimezone(guildId: string): Promise<string> {
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
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone
            }
          },
          gamePnL: gamePnLSum,
          cashFlow: cashFlowSum,
          txCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Transaction.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: '$source',
          amount: { $sum: { $abs: '$amount' } }
        }
      }
    ]),
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

  const dailyPoints: OverviewDailyPoint[] = dailyAgg.map((row) => ({
    date: row._id as string,
    gamePnL: row.gamePnL ?? 0,
    cashFlow: row.cashFlow ?? 0,
    txCount: row.txCount ?? 0
  }))

  const sourceAmounts = TRANSACTION_SOURCES.map((source) => {
    const row = sourceAmountAgg.find((r) => r._id === source)
    return { source, amount: row?.amount ?? 0 }
  }).filter((row) => row.amount > 0)

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
    gamePnL,
    cashFlow,
    txCount,
    typeCounts,
    sourceCounts,
    dailySeries: fillDailySeries(range, dailyPoints, timezone),
    sourceAmounts,
    registeredUsers,
    totalLiability: liabilityAgg[0]?.total ?? 0,
    vipRoomCount,
    topByBalance,
    topByNetProfit,
    recentTransactions: recentResult.transactions,
    setupHealth: buildSetupHealth(
      guildId,
      guildConfig as TGuildConfiguration | null
    )
  }
}
