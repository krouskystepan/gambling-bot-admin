import type { GuildBanRow } from '@/actions/database/guildBans.action'

import { DEMO_MEMBERS, getDemoAvatar, getDemoUsername } from './demoGuild'

export type GuildBanStatusFilter = 'active' | 'ended' | 'all'

export type DemoGuildBansQuery = {
  page?: number
  limit?: number
  status?: GuildBanStatusFilter
  userId?: string
  sort?: string
}

function buildDemoGuildBans(): GuildBanRow[] {
  const now = Date.now()
  const staffId = '100000000000000001'
  const staffUsername = getDemoUsername(staffId)
  const staff2Id = '100000000000000002'
  const staff2Username = getDemoUsername(staff2Id)

  const bannedUserId = '100000000000000016'
  const endedUserA = '100000000000000004'
  const endedUserB = '100000000000000007'
  const endedUserC = '100000000000000010'

  const rows: GuildBanRow[] = [
    {
      banId: `demo-ban-${bannedUserId}`,
      userId: bannedUserId,
      username: getDemoUsername(bannedUserId),
      avatar: getDemoAvatar(bannedUserId),
      bannedAt: new Date(now - 6 * 86400000),
      bannedBy: staffId,
      bannedByUsername: staffUsername,
      banReason: 'Chargeback abuse.',
      unbannedAt: null,
      unbannedBy: null
    },
    {
      banId: 'demo-ban-ended-a',
      userId: endedUserA,
      username: getDemoUsername(endedUserA),
      avatar: getDemoAvatar(endedUserA),
      bannedAt: new Date(now - 40 * 86400000),
      bannedBy: staffId,
      bannedByUsername: staffUsername,
      banReason: 'Spam in ATM channel.',
      unbannedAt: new Date(now - 35 * 86400000),
      unbannedBy: staff2Id,
      unbannedByUsername: staff2Username,
      unbanReason: 'Appealed successfully.'
    },
    {
      banId: 'demo-ban-ended-b',
      userId: endedUserB,
      username: getDemoUsername(endedUserB),
      avatar: getDemoAvatar(endedUserB),
      bannedAt: new Date(now - 20 * 86400000),
      bannedBy: staff2Id,
      bannedByUsername: staff2Username,
      banReason: 'Multi-accounting.',
      unbannedAt: new Date(now - 12 * 86400000),
      unbannedBy: staffId,
      unbannedByUsername: staffUsername,
      unbanReason: 'Verified same household.'
    },
    {
      banId: 'demo-ban-ended-c',
      userId: endedUserC,
      username: getDemoUsername(endedUserC),
      avatar: getDemoAvatar(endedUserC),
      bannedAt: new Date(now - 90 * 86400000),
      bannedBy: staffId,
      bannedByUsername: staffUsername,
      banReason: 'Toxicity in VIP.',
      unbannedAt: new Date(now - 80 * 86400000),
      unbannedBy: staffId,
      unbannedByUsername: staffUsername
    },
    {
      banId: 'demo-ban-active-extra',
      userId: '100000000000000012',
      username: getDemoUsername('100000000000000012'),
      avatar: getDemoAvatar('100000000000000012'),
      bannedAt: new Date(now - 2 * 86400000),
      bannedBy: staff2Id,
      bannedByUsername: staff2Username,
      banReason: 'Pending investigation.',
      unbannedAt: null,
      unbannedBy: null
    }
  ]

  // Keep usernames aligned with the demo roster if IDs exist.
  for (const row of rows) {
    const member = DEMO_MEMBERS.find((m) => m.userId === row.userId)
    if (member) {
      row.username = member.username
      row.avatar = member.avatar
    }
  }

  return rows.sort(
    (a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime()
  )
}

let cached: GuildBanRow[] | null = null

function demoGuildBans(): GuildBanRow[] {
  cached ??= buildDemoGuildBans()
  return cached
}

export function getDemoGuildBans(query: DemoGuildBansQuery = {}): {
  bans: GuildBanRow[]
  total: number
} {
  let rows = demoGuildBans()
  const status = query.status ?? 'active'

  if (status === 'active') {
    rows = rows.filter((row) => row.unbannedAt == null)
  } else if (status === 'ended') {
    rows = rows.filter((row) => row.unbannedAt != null)
  }

  if (query.userId) {
    rows = rows.filter((row) => row.userId === query.userId)
  }

  if (query.sort) {
    for (const part of query.sort.split(',').reverse()) {
      const [field, dir] = part.split(':')
      if (field !== 'bannedAt') continue
      rows = [...rows].sort((a, b) => {
        const av = new Date(a.bannedAt).getTime()
        const bv = new Date(b.bannedAt).getTime()
        if (av < bv) return dir === 'asc' ? -1 : 1
        if (av > bv) return dir === 'asc' ? 1 : -1
        return 0
      })
    }
  }

  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit

  return { bans: rows.slice(start, start + limit), total: rows.length }
}
