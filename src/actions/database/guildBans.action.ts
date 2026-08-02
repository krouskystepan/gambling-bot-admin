'use server'

import { Session } from 'next-auth'

import type { UserProfileBanRecord } from '@/actions/database/userProfile.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { requireGuildAccess } from '@/actions/perms'
import { connectToDatabase } from '@/lib/db'
import { mapUserBanRecord } from '@/lib/moderation/mapUserBanRecord'
import { getDemoGuildBans, isDemoGuild } from '@/lib/presentation'
import UserBan from '@/models/UserBan'

export type GuildBanStatusFilter = 'active' | 'ended' | 'all'

export type GuildBanRow = UserProfileBanRecord & {
  userId: string
  username?: string
  avatar?: string
}

type GuildBanQuery = {
  guildId: string
  userId?: string
  unbannedAt?: null | { $ne: null }
}

function parseBannedAtSort(sort?: string): 1 | -1 {
  if (!sort) return -1

  for (const part of sort.split(',')) {
    const [field, dir] = part.split(':')
    if (field === 'bannedAt') {
      return dir === 'asc' ? 1 : -1
    }
  }

  return -1
}

export async function getGuildBans(
  guildId: string,
  _session: Session,
  page = 1,
  limit = 10,
  status: GuildBanStatusFilter = 'active',
  userId?: string,
  sort?: string
): Promise<{ bans: GuildBanRow[]; total: number }> {
  if (isDemoGuild(guildId)) {
    return getDemoGuildBans({ page, limit, status, userId, sort })
  }

  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { bans: [], total: 0 }
  }

  await connectToDatabase()

  const query: GuildBanQuery = { guildId }

  if (status === 'active') {
    query.unbannedAt = null
  } else if (status === 'ended') {
    query.unbannedAt = { $ne: null }
  }

  if (userId) {
    query.userId = userId
  }

  const sortDir = parseBannedAtSort(sort)

  const [docs, total, discordMembers] = await Promise.all([
    UserBan.find(query)
      .sort({ bannedAt: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserBan.countDocuments(query),
    getDiscordGuildMembers(guildId)
  ])

  const membersMap = new Map((discordMembers ?? []).map((m) => [m.userId, m]))
  const resolveUsername = (id: string | null | undefined) =>
    id ? membersMap.get(id)?.username : undefined

  const bans: GuildBanRow[] = docs.map((ban) => {
    const member = membersMap.get(ban.userId)
    return {
      ...mapUserBanRecord(ban, resolveUsername),
      userId: ban.userId,
      username: member?.username ?? 'Unknown',
      avatar: member?.avatarUrl ?? '/default-avatar.jpg'
    }
  })

  return { bans, total }
}
