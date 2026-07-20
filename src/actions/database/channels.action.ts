'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  assertNotDemoMutation,
  getDemoChannels,
  isDemoGuild
} from '@/lib/presentation'
import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import { channelsSliceFromDoc } from '@/lib/settingsAudit/settingsSlices'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TChannelsFormValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getChannels(
  guildId: string
): Promise<TChannelsFormValues | null> {
  if (isDemoGuild(guildId)) return getDemoChannels()

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return channelsSliceFromDoc(doc)
}

export async function saveChannels(
  guildId: string,
  values: TChannelsFormValues
) {
  assertNotDemoMutation(guildId)

  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()

  const existing = await GuildConfiguration.findOne({ guildId }).lean()
  const before = channelsSliceFromDoc(existing)

  const updated = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    {
      guildId,
      $set: {
        'atmChannelIds.actions': values.atm.actions,
        'atmChannelIds.logs': values.atm.logs,
        casinoChannelIds: values.casino.casinoChannelIds,
        winAnnouncementsChannelId: values.casino.winAnnouncementsChannelId,
        'predictionChannelIds.actions': values.prediction.actions,
        'predictionChannelIds.logs': values.prediction.logs,
        'raffleChannelIds.actions': values.raffle.actions,
        'raffleChannelIds.logs': values.raffle.logs,
        workerLogChannelId: values.workerLogChannelId
      }
    },
    { new: true, upsert: true }
  )

  const after = channelsSliceFromDoc(updated) ?? values

  await recordSettingsChange({
    guildId,
    changedBy: session!.userId!,
    section: 'channels',
    before,
    after
  })

  revalidateGuildHealth(guildId)

  return after
}
