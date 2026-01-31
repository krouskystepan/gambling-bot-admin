'use server'

import { Session } from 'next-auth'

import { discordApiRequest, discordBotRequest } from '@/lib/discordReq'
import type { ICacheEntry, IGuild } from '@/types/types'

import { getAllGuildConfigsWithManagers } from '../database/guild.action'
import { fetchMemberRoles } from './role.action'

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
    let includeGuild = false

    const isAdmin = (Number(guild.permissions) & 0x8) === 0x8
    if (isAdmin) {
      includeGuild = true
    }

    const dbConfig = allGuildConfigs.find((c) => c.guildId === guild.id)

    if (dbConfig && !includeGuild) {
      try {
        const roles = await fetchMemberRoles(guild.id, session.userId)

        if (roles.includes(dbConfig.managerRoleId)) {
          includeGuild = true
        }
      } catch (err) {
        if (
          err instanceof Error &&
          'response' in err &&
          (err as { response?: { status?: number } }).response?.status &&
          [403, 404].includes(
            (err as { response: { status: number } }).response.status
          )
        ) {
          continue
        }

        throw err
      }
    }

    if (includeGuild) {
      accessibleGuilds.push(guild)
    }
  }

  return accessibleGuilds
}

export const getGuildName = async (guildId: string): Promise<string | null> => {
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
