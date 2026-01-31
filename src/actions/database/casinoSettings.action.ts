'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'
import { casinoSettingsSchema } from '@/types/schemas'
import { TCasinoSettingsValues } from '@/types/types'

import { getUserPermissions } from '../perms'

export async function getCasinoSettings(
  guildId: string
): Promise<TCasinoSettingsValues | null> {
  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return doc.casinoSettings ?? null
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
