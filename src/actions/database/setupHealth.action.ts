'use server'

import { type TGuildConfiguration } from 'gambling-bot-shared/guild'

import { connectToDatabase } from '@/lib/db'
import {
  type SetupHealthCheck,
  buildSetupHealth,
  countSetupHealthIssues
} from '@/lib/overview/setupHealth'
import GuildConfiguration from '@/models/GuildConfiguration'

export type { SetupHealthCheck }

export const getSetupHealthChecks = async (
  guildId: string
): Promise<SetupHealthCheck[]> => {
  await connectToDatabase()
  const config = await GuildConfiguration.findOne({ guildId }).lean()
  return buildSetupHealth(guildId, config as TGuildConfiguration | null)
}

export const getSetupHealthIssueCount = async (
  guildId: string
): Promise<number> => {
  const checks = await getSetupHealthChecks(guildId)
  return countSetupHealthIssues(checks)
}
