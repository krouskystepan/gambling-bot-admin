import {
  type GlobalSettings,
  normalizeGlobalSettings
} from 'gambling-bot-shared/guild'
import 'server-only'

import { connectToDatabase } from '@/lib/db'
import { demoGlobalSettings, isDemoGuild } from '@/lib/presentation'
import GuildConfiguration from '@/models/GuildConfiguration'

export async function getGuildGlobalSettings(
  guildId: string
): Promise<GlobalSettings> {
  if (isDemoGuild(guildId)) {
    return demoGlobalSettings
  }

  await connectToDatabase()
  const doc = await GuildConfiguration.findOne({ guildId })
    .select('globalSettings')
    .lean()
  return normalizeGlobalSettings(
    doc?.globalSettings as Partial<GlobalSettings> | undefined
  )
}
