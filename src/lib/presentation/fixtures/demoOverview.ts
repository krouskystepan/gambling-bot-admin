import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  type TTransaction
} from 'gambling-bot-shared/transactions'

import type {
  OverviewData,
  OverviewTopUser
} from '@/actions/database/overview.action'
import {
  type OverviewDailyPoint,
  type OverviewDateRange,
  type OverviewPnLSeries,
  fillDailySeries,
  fillHourlySeries,
  resolveOverviewPnLGranularity
} from '@/features/general/overview/period'
import { buildVolumeSlices } from '@/lib/overview/volumeSlices'

import {
  DEMO_TIMEZONE,
  demoGlobalSettings,
  getDemoAvatar,
  getDemoNickname,
  getDemoUsername
} from './demoGuild'
import {
  type DemoRawTx,
  getDemoRawTransactions,
  getDemoRecentTransactions
} from './demoTransactions'
import {
  getDemoRegisteredCount,
  getDemoTotalLiability,
  getDemoUsers
} from './demoUsers'

function gamePnLOf(row: DemoRawTx): number {
  if (row.type === 'bet' || row.type === 'vip') return row.amount
  if (row.type === 'win' || row.type === 'bonus' || row.type === 'refund') {
    return -row.amount
  }
  return 0
}

function withinRange(row: DemoRawTx, range: OverviewDateRange): boolean {
  const from = new Date(`${range.dateFrom}T00:00:00`)
  const to = new Date(`${range.dateTo}T23:59:59.999`)
  return row.createdAt >= from && row.createdAt <= to
}

function buildPnlSeries(
  rows: DemoRawTx[],
  range: OverviewDateRange
): OverviewPnLSeries {
  const granularity = resolveOverviewPnLGranularity(range, DEMO_TIMEZONE)
  const bucketFormat = granularity === 'hour' ? 'hour' : 'day'
  const byBucket = new Map<string, OverviewDailyPoint>()

  for (const row of rows) {
    const iso = row.createdAt.toISOString()
    const key =
      bucketFormat === 'hour' ? `${iso.slice(0, 13)}:00` : iso.slice(0, 10)
    const point = byBucket.get(key) ?? {
      date: key,
      gamePnL: 0,
      cashFlow: 0,
      txCount: 0
    }
    point.gamePnL += gamePnLOf(row)
    if (row.type === 'deposit') point.cashFlow += row.amount
    if (row.type === 'withdraw') point.cashFlow -= row.amount
    point.txCount += 1
    byBucket.set(key, point)
  }

  const points = Array.from(byBucket.values())
  return {
    granularity,
    points:
      granularity === 'hour'
        ? fillHourlySeries(range, points, DEMO_TIMEZONE)
        : fillDailySeries(range, points, DEMO_TIMEZONE)
  }
}

function buildSourceAmounts(rows: DemoRawTx[]) {
  const map = new Map<string, { amount: number; netAmount: number }>()
  for (const row of rows) {
    const key = row.source === 'casino' ? (row.game ?? 'casino') : row.source
    const entry = map.get(key) ?? { amount: 0, netAmount: 0 }
    entry.amount += Math.abs(row.amount)
    entry.netAmount += gamePnLOf(row)
    map.set(key, entry)
  }
  return buildVolumeSlices(
    Array.from(map.entries()).map(([_id, value]) => ({ _id, ...value }))
  )
}

function buildTopUsers(): {
  topByBalance: OverviewTopUser[]
  topByNetProfit: OverviewTopUser[]
} {
  const { users: byBalance } = getDemoUsers({
    page: 1,
    limit: 5,
    sort: 'balance:desc',
    registration: 'registered'
  })
  const { users: byNet } = getDemoUsers({
    page: 1,
    limit: 5,
    sort: 'netProfit:desc',
    registration: 'registered'
  })

  const toTop = (u: (typeof byBalance)[number]): OverviewTopUser => ({
    userId: u.userId,
    username: getDemoUsername(u.userId),
    nickname: getDemoNickname(u.userId),
    avatar: getDemoAvatar(u.userId),
    balance: u.balance ?? 0,
    netProfit: u.netProfit ?? 0
  })

  return {
    topByBalance: byBalance.map(toTop),
    topByNetProfit: byNet.map(toTop)
  }
}

export function getDemoOverviewData(range: OverviewDateRange): OverviewData {
  const rows = getDemoRawTransactions().filter((row) => withinRange(row, range))

  let gamePnL = 0
  let cashFlow = 0
  const typeCounts = Object.fromEntries(
    TRANSACTION_TYPES.map((t) => [t, 0])
  ) as Record<TTransaction['type'], number>
  const sourceCounts = Object.fromEntries(
    TRANSACTION_SOURCES.map((s) => [s, 0])
  ) as Record<TTransaction['source'], number>

  for (const row of rows) {
    gamePnL += gamePnLOf(row)
    if (row.type === 'deposit') cashFlow += row.amount
    if (row.type === 'withdraw') cashFlow -= row.amount
    typeCounts[row.type] += 1
    sourceCounts[row.source] += 1
  }

  const { topByBalance, topByNetProfit } = buildTopUsers()

  return {
    globalSettings: demoGlobalSettings,
    gamePnL,
    cashFlow,
    txCount: rows.length,
    typeCounts,
    sourceCounts,
    pnlSeries: buildPnlSeries(rows, range),
    sourceAmounts: buildSourceAmounts(rows),
    registeredUsers: getDemoRegisteredCount(),
    totalLiability: getDemoTotalLiability(),
    vipRoomCount: 3,
    topByBalance,
    topByNetProfit,
    recentTransactions: getDemoRecentTransactions(10)
  }
}
