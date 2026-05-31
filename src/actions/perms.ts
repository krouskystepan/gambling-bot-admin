'use server'

import { Session } from 'next-auth'

import { hasGuildManageAccess } from '@/lib/discordPermissions'
import { connectToDatabase } from '@/lib/db'
import { getSessionOrNull } from '@/lib/requireSession'
import GuildConfiguration from '@/models/GuildConfiguration'

import { resolveManagerStatus } from './discord/role.action'
import { fetchUserGuilds } from './discord/guilds.action'

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
      isAdmin = hasGuildManageAccess(guild)
    }

    await connectToDatabase()
    const config = await GuildConfiguration.findOne({ guildId }).lean()

    if (!config?.managerRoleId) {
      return { isAdmin, isManager }
    }

    isManager = await resolveManagerStatus(
      guildId,
      session.userId,
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

export async function requireGuildAccess(
  guildId: string,
  options?: { requireAdmin?: boolean }
): Promise<GuildAccess | GuildAccessError> {
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

export function assertManagerOrAdmin(access: GuildAccess): void {
  if (!access.isAdmin && !access.isManager) {
    throw new Error('Insufficient permissions')
  }
}

export function assertAdmin(access: GuildAccess): void {
  if (!access.isAdmin) {
    throw new Error('Insufficient permissions: Admin only')
  }
}
