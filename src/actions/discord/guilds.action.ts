'use server'

import { Session } from 'next-auth'

import { hasGuildManageAccess } from '@/lib/discord/discordPermissions'
import { discordApiRequest, discordBotRequest } from '@/lib/discord/discordReq'
import { DEMO_GUILD_NAME, isDemoGuild } from '@/lib/presentation'
import type { ICacheEntry, IGuild } from '@/types/types'

import { getAllGuildConfigsWithManagers } from '../database/guild.action'
import { resolveManagerStatus } from './role.action'

const guildCache = new Map<string, ICacheEntry<IGuild[]>>()
const GUILD_CACHE_DURATION = 5 * 60_000 // 5 min

export const fetchUserGuilds = async (
  session: Session | null
): Promise<IGuild[]> => {
  if (!session?.userId) {
    throw new Error('Unauthenticated')
  }

  const key = session.userId
  const cached = guildCache.get(key)
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const data = await discordApiRequest<IGuild[]>(session, {
    url: '/users/@me/guilds',
    method: 'GET'
  })

  guildCache.set(key, {
    data,
    expiresAt: now + GUILD_CACHE_DURATION
  })

  return data
}

export const getUserGuilds = async (
  session: Session | null
): Promise<IGuild[]> => {
  if (!session?.accessToken || !session.userId) {
    throw new Error('Unauthenticated')
  }

  const userGuilds = await fetchUserGuilds(session)

  const allGuildConfigs = await getAllGuildConfigsWithManagers()
  const accessibleGuilds: IGuild[] = []

  for (const guild of userGuilds) {
    if (hasGuildManageAccess(guild)) {
      accessibleGuilds.push(guild)
      continue
    }

    const dbConfig = allGuildConfigs.find((c) => c.guildId === guild.id)
    if (!dbConfig?.managerRoleId) {
      continue
    }

    const isManager = await resolveManagerStatus(
      guild.id,
      session.userId,
      dbConfig.managerRoleId.toString()
    )

    if (isManager) {
      accessibleGuilds.push(guild)
    }
  }

  return accessibleGuilds
}

export const getGuildName = async (guildId: string): Promise<string | null> => {
  if (isDemoGuild(guildId)) {
    return DEMO_GUILD_NAME
  }

  try {
    const guild = await discordBotRequest<{
      id: string
      name: string
    }>({
      url: `/guilds/${guildId}`,
      method: 'GET'
    })

    return guild.name
  } catch {
    return null
  }
}
