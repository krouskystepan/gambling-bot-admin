import type { TGuildMemberStatus } from '@/types/types'

import { DEMO_MEMBERS } from './demoGuild'
import { getDemoRawTransactions } from './demoTransactions'

export type DemoUserRecord = TGuildMemberStatus & {
  balance: number
  bonusBalance: number
  lockedBalance: number
  netProfit: number
  registered: boolean
  banned: boolean
}

// A few members are intentionally unregistered / banned for realism.
const UNREGISTERED = new Set(['100000000000000021', '100000000000000022'])
const BANNED = new Set(['100000000000000016'])

function buildRecords(): DemoUserRecord[] {
  const raw = getDemoRawTransactions()

  const netByUser = new Map<string, number>()
  const balByUser = new Map<string, number>()

  for (const row of raw) {
    const bal = balByUser.get(row.userId) ?? 0
    const net = netByUser.get(row.userId) ?? 0
    switch (row.type) {
      case 'deposit':
        balByUser.set(row.userId, bal + row.amount)
        break
      case 'withdraw':
        balByUser.set(row.userId, bal - row.amount)
        break
      case 'bet':
        balByUser.set(row.userId, bal - row.amount)
        netByUser.set(row.userId, net - row.amount)
        break
      case 'win':
        balByUser.set(row.userId, bal + row.amount)
        netByUser.set(row.userId, net + row.amount)
        break
      case 'bonus':
        balByUser.set(row.userId, bal + row.amount)
        netByUser.set(row.userId, net + row.amount)
        break
      case 'refund':
        balByUser.set(row.userId, bal + row.amount)
        break
      default:
        break
    }
  }

  const earliest = Date.now() - 150 * 24 * 60 * 60 * 1000

  return DEMO_MEMBERS.map((member, index) => {
    const registered = !UNREGISTERED.has(member.userId)
    const banned = BANNED.has(member.userId)
    const balance = Math.max(0, Math.round(balByUser.get(member.userId) ?? 0))
    const netProfit = Math.round(netByUser.get(member.userId) ?? 0)
    const bonusBalance = registered ? (index % 4) * 50 : 0
    const lockedBalance = registered && index % 5 === 0 ? 250 : 0

    return {
      userId: member.userId,
      username: member.username,
      nickname: member.nickname,
      avatar: member.avatar,
      registered,
      registeredAt: registered
        ? new Date(earliest + index * 4 * 24 * 60 * 60 * 1000)
        : null,
      banned,
      balance: registered ? balance : 0,
      bonusBalance,
      lockedBalance,
      netProfit: registered ? netProfit : 0
    }
  })
}

let cached: DemoUserRecord[] | null = null

function getRecords(): DemoUserRecord[] {
  cached ??= buildRecords()
  return cached
}

export function getDemoUserRecord(userId: string): DemoUserRecord | undefined {
  return getRecords().find((record) => record.userId === userId)
}

export type DemoUsersQuery = {
  page?: number
  limit?: number
  search?: string
  sort?: string
  registration?: 'all' | 'registered' | 'not_registered'
  banStatus?: 'all' | 'active' | 'banned'
}

function applyUsersSort(
  records: DemoUserRecord[],
  sort?: string
): DemoUserRecord[] {
  if (!sort) {
    return [...records].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
  }

  const [field, dir] = sort.split(':')
  const factor = dir === 'asc' ? 1 : -1

  return [...records].sort((a, b) => {
    let diff = 0
    switch (field) {
      case 'balance':
        diff = (a.balance ?? 0) - (b.balance ?? 0)
        break
      case 'netProfit':
        diff = (a.netProfit ?? 0) - (b.netProfit ?? 0)
        break
      case 'username':
        diff = a.username.localeCompare(b.username)
        break
      case 'registeredAt':
        diff =
          (a.registeredAt?.getTime() ?? 0) - (b.registeredAt?.getTime() ?? 0)
        break
      default:
        diff = (a.balance ?? 0) - (b.balance ?? 0)
        break
    }
    return diff * factor
  })
}

export function getDemoUsers(query: DemoUsersQuery): {
  users: TGuildMemberStatus[]
  total: number
  registeredUserIds: string[]
} {
  let records = getRecords()

  const registration = query.registration ?? 'all'
  if (registration === 'registered') {
    records = records.filter((r) => r.registered)
  } else if (registration === 'not_registered') {
    records = records.filter((r) => !r.registered)
  }

  const banStatus = query.banStatus ?? 'all'
  if (banStatus === 'active') {
    records = records.filter((r) => !r.banned)
  } else if (banStatus === 'banned') {
    records = records.filter((r) => r.banned)
  }

  if (query.search) {
    const term = query.search.toLowerCase()
    records = records.filter(
      (r) =>
        r.username.toLowerCase().includes(term) ||
        r.nickname?.toLowerCase().includes(term) ||
        r.userId.includes(term)
    )
  }

  const sorted = applyUsersSort(records, query.sort)
  const total = sorted.length
  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  const pageRecords = sorted.slice(start, start + limit)

  const users: TGuildMemberStatus[] = pageRecords.map((r) => ({
    userId: r.userId,
    username: r.username,
    nickname: r.nickname,
    registered: r.registered,
    registeredAt: r.registeredAt,
    avatar: r.avatar,
    balance: r.balance,
    netProfit: r.netProfit,
    banned: r.banned
  }))

  const registeredUserIds = getRecords()
    .filter((r) => r.registered)
    .map((r) => r.userId)

  return { users, total, registeredUserIds }
}

export function getDemoRegisteredCount(): number {
  return getRecords().filter((r) => r.registered).length
}

export function getDemoTotalLiability(): number {
  return getRecords().reduce(
    (sum, r) => sum + r.balance + r.bonusBalance + r.lockedBalance,
    0
  )
}
