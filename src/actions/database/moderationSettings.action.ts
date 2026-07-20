'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  assertNotDemoMutation,
  getDemoModerationSettings,
  isDemoGuild
} from '@/lib/presentation'
import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import { moderationSliceFromDoc } from '@/lib/settingsAudit/settingsSlices'
import GuildConfiguration from '@/models/GuildConfiguration'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getModerationSettings(
  guildId: string
): Promise<{ managerRoleId: string; bannedRoleId: string } | null> {
  if (isDemoGuild(guildId)) return getDemoModerationSettings()

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()
  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null
  return moderationSliceFromDoc(doc)
}

export async function saveModerationSettings(
  guildId: string,
  values: { managerRoleId: string; bannedRoleId: string }
) {
  assertNotDemoMutation(guildId)

  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()

  const existing = await GuildConfiguration.findOne({ guildId }).lean()
  const before = moderationSliceFromDoc(existing)

  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: values },
    { new: true, upsert: true }
  )

  const after = moderationSliceFromDoc(updated) ?? values

  await recordSettingsChange({
    guildId,
    changedBy: session!.userId!,
    section: 'moderation',
    before,
    after
  })

  revalidateGuildHealth(guildId)
  return after
}
