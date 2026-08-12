'use server'

import { connectToDatabase } from '@/lib/db'
import { discordBotRequest } from '@/lib/discord/discordReq'
import { getDemoDiscordMembers, isDemoGuild } from '@/lib/presentation'
import MockUserProfile from '@/models/MockUserProfile'

export type GuildMember = {
  userId: string
  username: string
  nickname: string | null
  avatarUrl: string
  /** Discord role IDs from the members list payload. Empty for synthetic mock profiles. */
  roles: string[]
}

const guildMembersCache = new Map<
  string,
  {
    data: GuildMember[]
    expiresAt: number
  }
>()

const MEMBERS_CACHE_DURATION = 60_000 // 1 min

async function getMockGuildMembers(guildId: string): Promise<GuildMember[]> {
  await connectToDatabase()

  const rows = await MockUserProfile.find({ guildId })
    .select({ userId: 1, username: 1, nickname: 1, avatarUrl: 1 })
    .lean()

  return rows.map((row) => ({
    userId: row.userId,
    username: row.username,
    nickname: row.nickname ?? null,
    avatarUrl: row.avatarUrl,
    roles: []
  }))
}

function mergeGuildMembers(
  discordMembers: GuildMember[],
  mockMembers: GuildMember[]
): GuildMember[] {
  const byId = new Map<string, GuildMember>()

  for (const member of mockMembers) {
    byId.set(member.userId, member)
  }
  // Real Discord members always win over synthetic mock profiles.
  for (const member of discordMembers) {
    byId.set(member.userId, member)
  }

  return [...byId.values()]
}

export const getDiscordGuildMembers = async (
  guildId: string
): Promise<GuildMember[]> => {
  if (isDemoGuild(guildId)) {
    return getDemoDiscordMembers()
  }

  const now = Date.now()
  const cached = guildMembersCache.get(guildId)

  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  try {
    const members = await discordBotRequest<
      {
        user: {
          id: string
          username: string
          avatar: string | null
          bot?: boolean
        }
        nick?: string | null
        roles?: string[]
      }[]
    >({
      url: `/guilds/${guildId}/members`,
      method: 'GET',
      params: { limit: 1000 }
    })

    const mappedMembers: GuildMember[] = members
      .filter((m) => !m.user.bot)
      .map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        nickname: m.nick ?? null,
        avatarUrl: m.user.avatar
          ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=128`
          : '/default-avatar.jpg',
        roles: m.roles ?? []
      }))

    const mockMembers = await getMockGuildMembers(guildId)
    const merged = mergeGuildMembers(mappedMembers, mockMembers)

    guildMembersCache.set(guildId, {
      data: merged,
      expiresAt: now + MEMBERS_CACHE_DURATION
    })

    return merged
  } catch {
    try {
      const mockOnly = await getMockGuildMembers(guildId)
      if (mockOnly.length > 0) {
        guildMembersCache.set(guildId, {
          data: mockOnly,
          expiresAt: now + MEMBERS_CACHE_DURATION
        })
        return mockOnly
      }
    } catch {
      // Fall through to empty list.
    }
    return []
  }
}
