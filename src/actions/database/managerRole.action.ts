'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'

import { getUserPermissions } from '../perms'

export async function getManagerRole(
  guildId: string
): Promise<{ managerRoleId: string } | null> {
  await connectToDatabase()
  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null
  return { managerRoleId: doc.managerRoleId ?? '' }
}

export async function saveManagerRole(guildId: string, managerRoleId: string) {
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()
  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: { managerRoleId } },
    { new: true, upsert: true }
  )
  return updated?.managerRoleId ?? ''
}
