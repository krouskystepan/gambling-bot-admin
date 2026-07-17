import type { StaffActionCategory } from 'gambling-bot-shared/transactions'

import type {
  StaffActionCounts,
  StaffActionEntityFacets,
  StaffActionRow
} from '@/actions/database/staffActions.action'

import {
  DEMO_MEMBERS,
  DEMO_STAFF_MEMBERS,
  getDemoAvatar,
  getDemoNickname,
  getDemoUsername
} from './demoGuild'
import { createDemoRng, pick, randInt } from './demoRng'

type Template = {
  category: StaffActionCategory
  label: string
  badge: string
  withAmount?: boolean
  note?: string
}

const TEMPLATES: Template[] = [
  {
    category: 'balance',
    label: 'Manual deposit',
    badge: 'DEPOSIT',
    withAmount: true
  },
  {
    category: 'balance',
    label: 'Manual withdraw',
    badge: 'WITHDRAW',
    withAmount: true
  },
  { category: 'balance', label: 'Balance reset', badge: 'RESET' },
  {
    category: 'balance',
    label: 'Bonus granted',
    badge: 'BONUS',
    withAmount: true
  },
  {
    category: 'atm',
    label: 'ATM request rejected',
    badge: 'ATM',
    note: 'Details did not match records.'
  },
  {
    category: 'ban',
    label: 'User banned',
    badge: 'BAN',
    note: 'Chargeback abuse.'
  },
  { category: 'unban', label: 'User unbanned', badge: 'UNBAN' },
  { category: 'vip', label: 'VIP room created', badge: 'VIP' },
  { category: 'prediction', label: 'Prediction ended', badge: 'PREDICTION' },
  { category: 'raffle', label: 'Raffle cancelled', badge: 'RAFFLE' },
  {
    category: 'user',
    label: 'Staff note added',
    badge: 'NOTE',
    note: 'Verified account owner.'
  }
]

function buildRows(): StaffActionRow[] {
  const rng = createDemoRng(0x57aff)
  const now = Date.now()
  const rows: StaffActionRow[] = []

  for (let i = 0; i < 34; i++) {
    const template = pick(rng, TEMPLATES)
    const actor = pick(rng, DEMO_STAFF_MEMBERS)
    const subject = pick(rng, DEMO_MEMBERS)
    const occurredAt = new Date(now - i * randInt(rng, 3, 20) * 60 * 60 * 1000)

    rows.push({
      id: `demo-audit-${i}`,
      occurredAt,
      actorId: actor.userId,
      actorUsername: actor.username,
      actorAvatar: getDemoAvatar(actor.userId),
      subjectUserId: subject.userId,
      subjectUsername: getDemoUsername(subject.userId),
      subjectNickname: getDemoNickname(subject.userId),
      subjectAvatar: getDemoAvatar(subject.userId),
      actionLabel: template.label,
      actionBadge: template.badge,
      actionSublabel: null,
      category: template.category,
      amount: template.withAmount ? randInt(rng, 2, 40) * 100 : null,
      notes: template.note ?? null,
      meta: undefined,
      detailHref: `/present/users/${subject.userId}`
    })
  }

  return rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
}

let cached: StaffActionRow[] | null = null
function getRows(): StaffActionRow[] {
  cached ??= buildRows()
  return cached
}

export type DemoStaffActionsQuery = {
  page?: number
  limit?: number
  search?: string
  staffId?: string
  filterAction?: StaffActionCategory[]
}

function matches(row: StaffActionRow, query: DemoStaffActionsQuery): boolean {
  if (query.staffId && row.actorId !== query.staffId) return false
  if (query.search && row.subjectUserId !== query.search) return false
  if (
    query.filterAction?.length &&
    !query.filterAction.includes(row.category)
  ) {
    return false
  }
  return true
}

export function getDemoStaffActions(query: DemoStaffActionsQuery): {
  actions: StaffActionRow[]
  total: number
} {
  const filtered = getRows().filter((row) => matches(row, query))
  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  return {
    actions: filtered.slice(start, start + limit),
    total: filtered.length
  }
}

export function getDemoStaffActionCounts(): StaffActionCounts {
  const counts = {
    balance: 0,
    atm: 0,
    vip: 0,
    raffle: 0,
    prediction: 0,
    ban: 0,
    unban: 0,
    user: 0
  } satisfies StaffActionCounts

  for (const row of getRows()) {
    counts[row.category] += 1
  }
  return counts
}

export function getDemoStaffActionEntityFacets(): StaffActionEntityFacets {
  const staff: Record<string, number> = {}
  const users: Record<string, number> = {}
  for (const row of getRows()) {
    staff[row.actorId] = (staff[row.actorId] ?? 0) + 1
    users[row.subjectUserId] = (users[row.subjectUserId] ?? 0) + 1
  }
  return { staff, users }
}
