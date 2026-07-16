import { getEffectiveStreak } from 'gambling-bot-shared/bonus'

import type { UserProfileData } from '@/actions/database/userProfile.action'
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
  DEMO_STAFF_MEMBERS,
  DEMO_TIMEZONE,
  demoGlobalSettings,
  getDemoAvatar,
  getDemoNickname,
  getDemoUsername
} from './demoGuild'
import { type DemoRawTx, getDemoRawTransactions } from './demoTransactions'
import { getDemoUserRecord } from './demoUsers'

function gamePnLOf(row: DemoRawTx): number {
  if (row.type === 'bet' || row.type === 'vip') return row.amount
  if (row.type === 'win' || row.type === 'bonus' || row.type === 'refund') {
    return -row.amount
  }
  return 0
}

function inRange(row: DemoRawTx, range: OverviewDateRange): boolean {
  const from = new Date(`${range.dateFrom}T00:00:00`)
  const to = new Date(`${range.dateTo}T23:59:59.999`)
  return row.createdAt >= from && row.createdAt <= to
}

function buildPnlSeries(
  rows: DemoRawTx[],
  range: OverviewDateRange
): OverviewPnLSeries {
  const granularity = resolveOverviewPnLGranularity(range, DEMO_TIMEZONE)
  const byBucket = new Map<string, OverviewDailyPoint>()

  for (const row of rows) {
    const iso = row.createdAt.toISOString()
    const key =
      granularity === 'hour' ? `${iso.slice(0, 13)}:00` : iso.slice(0, 10)
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

export function getDemoUserProfile(
  userId: string,
  range: OverviewDateRange
): UserProfileData | null {
  const record = getDemoUserRecord(userId)
  if (!record) return null

  const userRows = getDemoRawTransactions().filter(
    (row) => row.userId === userId
  )
  const rangeRows = userRows.filter((row) => inRange(row, range))

  const now = new Date()
  const lastDailyClaim = record.registered
    ? new Date(now.getTime() - 20 * 60 * 60 * 1000)
    : null

  return {
    globalSettings: demoGlobalSettings,
    userId,
    username: getDemoUsername(userId),
    nickname: getDemoNickname(userId),
    avatar: getDemoAvatar(userId),
    registered: record.registered,
    registeredAt: record.registeredAt,
    banned: record.banned,
    bannedAt: record.banned ? new Date(now.getTime() - 6 * 86400000) : null,
    bannedBy: record.banned ? '100000000000000001' : null,
    bannedByUsername: record.banned
      ? getDemoUsername('100000000000000001')
      : undefined,
    hasManagerRole: DEMO_STAFF_MEMBERS.some((m) => m.userId === userId),
    bans: record.banned
      ? [
          {
            banId: `demo-ban-${userId}`,
            bannedAt: new Date(now.getTime() - 6 * 86400000),
            bannedBy: '100000000000000001',
            bannedByUsername: getDemoUsername('100000000000000001'),
            banReason: 'Chargeback abuse.',
            unbannedAt: null,
            unbannedBy: null
          }
        ]
      : [],
    staffNotes: record.registered
      ? [
          {
            noteId: `demo-note-${userId}`,
            text: 'Verified account owner during onboarding.',
            authorId: '100000000000000002',
            authorUsername: getDemoUsername('100000000000000002'),
            createdAt: new Date(now.getTime() - 12 * 86400000)
          }
        ]
      : [],
    balance: record.balance,
    bonusBalance: record.bonusBalance,
    lockedBalance: record.lockedBalance,
    dailyStreak: record.registered
      ? getEffectiveStreak(lastDailyClaim, now, 5)
      : 0,
    lastDailyClaim,
    lifetimeNetProfit: record.netProfit,
    pnlSeries: buildPnlSeries(rangeRows, range),
    sourceAmounts: buildSourceAmounts(rangeRows),
    vips: []
  }
}
