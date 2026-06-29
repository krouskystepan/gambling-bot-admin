'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import GuildConfiguration from '@/models/GuildConfiguration'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getModerationSettings(
  guildId: string
): Promise<{ managerRoleId: string; bannedRoleId: string } | null> {
  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()
  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null
  return {
    managerRoleId: doc.managerRoleId ?? '',
    bannedRoleId: doc.bannedRoleId ?? ''
  }
}

export async function saveModerationSettings(
  guildId: string,
  values: { managerRoleId: string; bannedRoleId: string }
) {
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()
  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: values },
    { new: true, upsert: true }
  )
  revalidateGuildHealth(guildId)
  return {
    managerRoleId: updated?.managerRoleId ?? '',
    bannedRoleId: updated?.bannedRoleId ?? ''
  }
}
