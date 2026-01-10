'use server'

import { Session } from 'next-auth'

import { connectToDatabase } from '@/lib/db'
import { discordBotRequest } from '@/lib/discordReq'
import GuildConfiguration from '@/models/GuildConfiguration'

import { fetchUserGuilds } from './discord/guilds.action'

type PermissionsResult = {
  isAdmin: boolean
  isManager: boolean
  rateLimited?: boolean
}

const DISCORD_ADMIN_FLAG = 0x8

export const getUserPermissions = async (
  guildId: string,
  session: Session | null
): Promise<PermissionsResult> => {
  if (!session?.accessToken || !session.userId) {
    return { isAdmin: false, isManager: false }
  }

  let isAdmin = false
  let isManager = false

  try {
    const userGuilds = await fetchUserGuilds(session)
    const guild = userGuilds.find((g) => g.id === guildId)

    if (guild) {
      const permissions = Number(guild.permissions) || 0
      isAdmin = (permissions & DISCORD_ADMIN_FLAG) === DISCORD_ADMIN_FLAG
    }

    await connectToDatabase()
    const config = await GuildConfiguration.findOne({ guildId }).lean()

    if (!config?.managerRoleId) {
      return { isAdmin, isManager }
    }

    const member = await discordBotRequest<{ roles: string[] }>({
      method: 'GET',
      url: `/guilds/${guildId}/members/${session.userId}`
    })

    isManager = member.roles.includes(config.managerRoleId.toString())
  } catch (err) {
    if (err instanceof Error && err.message === 'DiscordRateLimited') {
      return { isAdmin, isManager, rateLimited: true }
    }

    console.error('Failed to fetch guild permissions', err)
  }

  return { isAdmin, isManager }
}
