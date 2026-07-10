import type { TAtmRequest } from 'gambling-bot-shared/atm'

import type { TAtmRequestDiscord } from '@/types/types'

import {
  DEMO_MEMBERS,
  DEMO_STAFF_MEMBERS,
  getDemoAvatar,
  getDemoNickname,
  getDemoUsername
} from './demoGuild'
import { createDemoRng, pick, randInt } from './demoRng'

type DemoAtmRow = {
  requestId: string
  userId: string
  type: TAtmRequest['type']
  amount: number
  account: string
  status: TAtmRequest['status']
  handledBy?: string
  notes?: string
  createdAt: Date
  handledAt?: Date
}

function maskAccount(rng: () => number): string {
  return `CZ** **** ${randInt(rng, 1000, 9999)}`
}

function buildRows(): DemoAtmRow[] {
  const rng = createDemoRng(0xa7c0de)
  const now = Date.now()
  const rows: DemoAtmRow[] = []

  // 3 pending (matches sidebar badge count).
  for (let i = 0; i < 3; i++) {
    const member = pick(rng, DEMO_MEMBERS)
    rows.push({
      requestId: `demo-atm-p${i}`,
      userId: member.userId,
      type: rng() < 0.5 ? 'deposit' : 'withdraw',
      amount: randInt(rng, 2, 30) * 100,
      account: maskAccount(rng),
      status: 'pending',
      createdAt: new Date(now - randInt(rng, 1, 40) * 60 * 60 * 1000)
    })
  }

  // History (approved / rejected).
  for (let i = 0; i < 22; i++) {
    const member = pick(rng, DEMO_MEMBERS)
    const staff = pick(rng, DEMO_STAFF_MEMBERS)
    const status: TAtmRequest['status'] = rng() < 0.78 ? 'approved' : 'rejected'
    const createdAt = new Date(
      now - (i + 1) * randInt(rng, 6, 30) * 60 * 60 * 1000
    )
    rows.push({
      requestId: `demo-atm-h${i}`,
      userId: member.userId,
      type: rng() < 0.5 ? 'deposit' : 'withdraw',
      amount: randInt(rng, 2, 24) * 100,
      account: maskAccount(rng),
      status,
      handledBy: staff.userId,
      handledAt: new Date(
        createdAt.getTime() + randInt(rng, 5, 90) * 60 * 1000
      ),
      notes:
        status === 'rejected' ? 'Details did not match records.' : undefined,
      createdAt
    })
  }

  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

let cached: DemoAtmRow[] | null = null
function getRows(): DemoAtmRow[] {
  cached ??= buildRows()
  return cached
}

function toDiscord(row: DemoAtmRow): TAtmRequestDiscord {
  return {
    requestId: row.requestId,
    guildId: '',
    userId: row.userId,
    type: row.type,
    amount: row.amount,
    account: row.account,
    status: row.status,
    handledBy: row.handledBy,
    handledAt: row.handledAt,
    notes: row.notes,
    logChannelId: undefined,
    logMessageId: undefined,
    meta: undefined,
    createdAt: row.createdAt,
    updatedAt: row.handledAt ?? row.createdAt,
    id: row.requestId,
    username: getDemoUsername(row.userId),
    nickname: getDemoNickname(row.userId),
    avatar: getDemoAvatar(row.userId),
    handledByUsername: row.handledBy ? getDemoUsername(row.handledBy) : null,
    linkedTransactionId:
      row.status === 'approved' ? `demo-tx-atm-${row.requestId}` : null
  }
}

export type DemoAtmQuery = {
  page?: number
  limit?: number
  search?: string
  filterStatus?: string[]
  filterType?: string[]
  sort?: string
}

function matches(row: DemoAtmRow, query: DemoAtmQuery): boolean {
  if (query.search && row.userId !== query.search) return false
  if (query.filterStatus?.length && !query.filterStatus.includes(row.status)) {
    return false
  }
  if (query.filterType?.length && !query.filterType.includes(row.type)) {
    return false
  }
  return true
}

export function getDemoAtmRequests(query: DemoAtmQuery): {
  requests: TAtmRequestDiscord[]
  total: number
} {
  const filtered = getRows().filter((row) => matches(row, query))
  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  return {
    requests: filtered.slice(start, start + limit).map(toDiscord),
    total: filtered.length
  }
}

export function getDemoAtmRequestCounts() {
  const rows = getRows()
  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: rows.length,
    type: { deposit: 0, withdraw: 0 },
    amount: { pendingDeposits: 0, pendingWithdraws: 0 },
    users: {} as Record<string, number>
  }

  for (const row of rows) {
    counts[row.status] += 1
    counts.type[row.type] += 1
    counts.users[row.userId] = (counts.users[row.userId] ?? 0) + 1
    if (row.status === 'pending') {
      if (row.type === 'deposit') counts.amount.pendingDeposits += row.amount
      else counts.amount.pendingWithdraws += row.amount
    }
  }

  return counts
}
