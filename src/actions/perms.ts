'use server'

import { Session } from 'next-auth'

import { cache } from 'react'

import { getSessionOrNull } from '@/lib/auth/requireSession'
import { connectToDatabase } from '@/lib/db'
import { hasGuildManageAccess } from '@/lib/discord/discordPermissions'
import { DEMO_MUTATION_MESSAGE, isDemoGuild } from '@/lib/presentation'
import GuildConfiguration from '@/models/GuildConfiguration'

import { fetchUserGuilds } from './discord/guilds.action'
import { resolveManagerStatus } from './discord/role.action'

type PermissionsResult = {
  isAdmin: boolean
  isManager: boolean
  rateLimited?: boolean
}

export type GuildAccess = {
  session: Session
  isAdmin: boolean
  isManager: boolean
}

export type GuildAccessError = {
  error: string
  rateLimited?: boolean
}

const fetchUserPermissions = cache(
  async (
    guildId: string,
    userId: string,
    accessToken: string
  ): Promise<PermissionsResult> => {
    let isAdmin = false
    let isManager = false

    const session = { userId, accessToken } as Session

    try {
      const userGuilds = await fetchUserGuilds(session)
      const guild = userGuilds.find((g) => g.id === guildId)

      if (guild) {
        isAdmin = hasGuildManageAccess(guild)
      }

      await connectToDatabase()
      const config = await GuildConfiguration.findOne({ guildId }).lean()

      if (!config?.managerRoleId) {
        return { isAdmin, isManager }
      }

      isManager = await resolveManagerStatus(
        guildId,
        userId,
        config.managerRoleId.toString()
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'DiscordRateLimited') {
        return { isAdmin, isManager, rateLimited: true }
      }

      console.error('Failed to fetch guild permissions', err)
    }

    return { isAdmin, isManager }
  }
)

export const getUserPermissions = async (
  guildId: string,
  session: Session | null
): Promise<PermissionsResult> => {
  if (isDemoGuild(guildId)) {
    return { isAdmin: true, isManager: true }
  }

  if (!session?.accessToken || !session.userId) {
    return { isAdmin: false, isManager: false }
  }

  return fetchUserPermissions(guildId, session.userId, session.accessToken)
}

export async function requireGuildAccess(
  guildId: string,
  options?: { requireAdmin?: boolean }
): Promise<GuildAccess | GuildAccessError> {
  // Demo reads short-circuit to fixtures before ever reaching here, so anything
  // that gets this far for the sentinel guild is a write — block it (read-only).
  if (isDemoGuild(guildId)) {
    return { error: DEMO_MUTATION_MESSAGE }
  }

  const session = await getSessionOrNull()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const { isAdmin, isManager, rateLimited } = await getUserPermissions(
    guildId,
    session
  )

  if (rateLimited) {
    return { error: 'Rate limited', rateLimited: true }
  }

  if (options?.requireAdmin) {
    if (!isAdmin) {
      return { error: 'Insufficient permissions' }
    }
  } else if (!isAdmin && !isManager) {
    return { error: 'Insufficient permissions' }
  }

  return { session, isAdmin, isManager }
}
