'use server'

import { normalizeCasinoSettings } from 'gambling-bot-shared/casino'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  assertNotDemoMutation,
  getDemoCasinoSettings,
  isDemoGuild
} from '@/lib/presentation'
import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import GuildConfiguration from '@/models/GuildConfiguration'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getCasinoSettings(
  guildId: string
): Promise<TCasinoSettingsValues | null> {
  if (isDemoGuild(guildId)) return getDemoCasinoSettings()

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc?.casinoSettings) return null

  return casinoSettingsSchema.parse(normalizeCasinoSettings(doc.casinoSettings))
}

export async function saveCasinoSettings(
  guildId: string,
  values: TCasinoSettingsValues
) {
  assertNotDemoMutation(guildId)

  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  const parsed = casinoSettingsSchema.parse(values)

  await connectToDatabase()

  const existing = await GuildConfiguration.findOne({ guildId }).lean()
  const before = existing?.casinoSettings ?? null

  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    {
      guildId,
      $set: {
        casinoSettings: parsed
      }
    },
    { new: true, upsert: true }
  )

  await recordSettingsChange({
    guildId,
    changedBy: session!.userId!,
    section: 'casino',
    before,
    after: updated.casinoSettings
  })

  revalidateGuildHealth(guildId)

  return updated.casinoSettings
}
