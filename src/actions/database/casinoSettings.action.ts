'use server'

import { normalizePlinkoBinMultipliers } from 'gambling-bot-shared'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

const normalizeCasinoSettings = (
  settings: TCasinoSettingsValues
): TCasinoSettingsValues => ({
  ...settings,
  plinko: {
    ...settings.plinko,
    binMultipliers: normalizePlinkoBinMultipliers(settings.plinko.binMultipliers)
  }
})

export async function getCasinoSettings(
  guildId: string
): Promise<TCasinoSettingsValues | null> {
  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc?.casinoSettings) return null

  return normalizeCasinoSettings(doc.casinoSettings)
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

  return updated.casinoSettings
}
