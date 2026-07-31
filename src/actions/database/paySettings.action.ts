'use server'

import {
  normalizePaySettings,
  paySettingsSchema
} from 'gambling-bot-shared/pay'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  assertNotDemoMutation,
  getDemoPaySettings,
  isDemoGuild
} from '@/lib/presentation'
import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TPaySettingsValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getPaySettings(
  guildId: string
): Promise<TPaySettingsValues | null> {
  if (isDemoGuild(guildId)) return getDemoPaySettings()

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return paySettingsSchema.parse(normalizePaySettings(doc.paySettings))
}

export async function savePaySettings(
  guildId: string,
  values: TPaySettingsValues
) {
  assertNotDemoMutation(guildId)

  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  const parsed = paySettingsSchema.parse(values)

  await connectToDatabase()

  const existing = await GuildConfiguration.findOne({ guildId }).lean()
  const before = existing?.paySettings
    ? paySettingsSchema.parse(normalizePaySettings(existing.paySettings))
    : null

  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    {
      guildId,
      $set: {
        paySettings: parsed
      }
    },
    { new: true, upsert: true }
  )

  await recordSettingsChange({
    guildId,
    changedBy: session!.userId!,
    section: 'pay',
    before,
    after: updated.paySettings
  })

  revalidateGuildHealth(guildId)

  return updated.paySettings
}
