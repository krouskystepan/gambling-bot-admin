'use server'

import {
  defaultGlobalSettings,
  normalizeGlobalSettings
} from 'gambling-bot-shared/guild'
import { globalSettingsFormSchema } from 'gambling-bot-shared/guild'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import {
  assertNotDemoMutation,
  getDemoGlobalSettings,
  isDemoGuild
} from '@/lib/presentation'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TGlobalSettingsFormValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getGlobalSettings(
  guildId: string
): Promise<TGlobalSettingsFormValues> {
  if (isDemoGuild(guildId)) return getDemoGlobalSettings()

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) {
    return defaultGlobalSettings as TGlobalSettingsFormValues
  }

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  const normalized = normalizeGlobalSettings(
    (doc?.globalSettings ?? {}) as Partial<TGlobalSettingsFormValues>
  )

  return globalSettingsFormSchema.parse(normalized)
}

export async function saveGlobalSettings(
  guildId: string,
  values: TGlobalSettingsFormValues
) {
  assertNotDemoMutation(guildId)

  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  const parsed = globalSettingsFormSchema.parse(normalizeGlobalSettings(values))

  await connectToDatabase()

  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    {
      guildId,
      $set: { globalSettings: parsed }
    },
    { new: true, upsert: true }
  )

  return globalSettingsFormSchema.parse(
    normalizeGlobalSettings(
      (updated?.globalSettings ?? parsed) as Partial<TGlobalSettingsFormValues>
    )
  )
}
