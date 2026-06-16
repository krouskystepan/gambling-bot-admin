'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TChannelsFormValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

export async function getChannels(
  guildId: string
): Promise<TChannelsFormValues | null> {
  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return {
    atm: {
      actions: doc.atmChannelIds?.actions ?? '',
      logs: doc.atmChannelIds?.logs ?? ''
    },
    casino: {
      casinoChannelIds: doc.casinoChannelIds ?? [],
      winAnnouncementsChannelId: doc.winAnnouncementsChannelId ?? ''
    },
    prediction: {
      actions: doc.predictionChannelIds?.actions ?? '',
      logs: doc.predictionChannelIds?.logs ?? ''
    },
    raffle: {
      actions: doc.raffleChannelIds?.actions ?? '',
      logs: doc.raffleChannelIds?.logs ?? ''
    }
  }
}

export async function saveChannels(
  guildId: string,
  values: TChannelsFormValues
) {
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()
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
        'raffleChannelIds.logs': values.raffle.logs
      }
    },
    { new: true, upsert: true }
  )

  return {
    atm: {
      actions: updated.atmChannelIds.actions,
      logs: updated.atmChannelIds.logs
    },
    casino: {
      casinoChannelIds: updated.casinoChannelIds,
      winAnnouncementsChannelId: updated.winAnnouncementsChannelId ?? ''
    },
    prediction: {
      actions: updated.predictionChannelIds.actions,
      logs: updated.predictionChannelIds.logs
    },
    raffle: {
      actions: updated.raffleChannelIds.actions,
      logs: updated.raffleChannelIds.logs
    }
  }
}
