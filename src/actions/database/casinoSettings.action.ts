'use server'

import { normalizeCasinoSettings } from 'gambling-bot-shared/casino'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import GuildConfiguration from '@/models/GuildConfiguration'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getCasinoSettings(
  guildId: string
): Promise<TCasinoSettingsValues | null> {
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
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  const parsed = casinoSettingsSchema.parse(values)

  await connectToDatabase()

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

  revalidateGuildHealth(guildId)

  return updated.casinoSettings
}
