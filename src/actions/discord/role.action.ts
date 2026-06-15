'use server'

import { discordBotRequest } from '@/lib/discord/discordReq'
import type { IGuildRole, IMemberCacheEntry } from '@/types/types'

const memberCache = new Map<string, IMemberCacheEntry>()
const MEMBER_ROLE_CACHE_DURATION = 60_000 // 1 min

export const fetchMemberRoles = async (
  guildId: string,
  userId: string
): Promise<string[]> => {
  const cacheKey = `${guildId}:${userId}`
  const cached = memberCache.get(cacheKey)
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return cached.roles
  }

  try {
    const member = await discordBotRequest<{
      roles: string[]
    }>({
      url: `/guilds/${guildId}/members/${userId}`,
      method: 'GET'
    })

    memberCache.set(cacheKey, {
      roles: member.roles,
      expiresAt: now + MEMBER_ROLE_CACHE_DURATION
    })

    return member.roles
  } catch (err) {
    if (err instanceof Error && err.message === 'DiscordRateLimited') {
      throw err
    }
    return []
  }
}

export const resolveManagerStatus = async (
  guildId: string,
  userId: string,
  managerRoleId: string | null | undefined
): Promise<boolean> => {
  if (!managerRoleId) return false

  const roles = await fetchMemberRoles(guildId, userId)
  return roles.includes(managerRoleId.toString())
}

export const getGuildRoles = async (guildId: string): Promise<IGuildRole[]> => {
  try {
    const roles = await discordBotRequest<IGuildRole[]>({
      url: `/guilds/${guildId}/roles`,
      method: 'GET'
    })

    return roles
      .filter((r) => r.id !== guildId && !r.managed)
      .sort((a, b) => b.position - a.position)
  } catch {
    return []
  }
}
