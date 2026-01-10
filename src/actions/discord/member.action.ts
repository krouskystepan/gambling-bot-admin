'use server'

import { discordBotRequest } from '@/lib/discordReq'

type GuildMember = {
  userId: string
  username: string
  nickname: string | null
  avatarUrl: string
}

const guildMembersCache = new Map<
  string,
  {
    data: GuildMember[]
    expiresAt: number
  }
>()

const MEMBERS_CACHE_DURATION = 60_000 // 1 min

export const getDiscordGuildMembers = async (
  guildId: string
): Promise<GuildMember[]> => {
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
          : '/default-avatar.jpg'
      }))

    guildMembersCache.set(guildId, {
      data: mappedMembers,
      expiresAt: now + MEMBERS_CACHE_DURATION
    })

    return mappedMembers
  } catch {
    return []
  }
}
