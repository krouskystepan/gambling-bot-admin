'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/authOptions'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TBonusFormValues } from '@/types/types'

import { getUserPermissions } from '../perms'

export async function getBonusSettings(
  guildId: string
): Promise<TBonusFormValues | null> {
  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  const bonus = doc.bonusSettings ?? {}

  return {
    rewardMode: bonus.rewardMode ?? 'linear',
    baseReward: bonus.baseReward ?? 0,
    streakIncrement: bonus.streakIncrement ?? 0,
    streakMultiplier: bonus.streakMultiplier ?? 1,
    maxReward: bonus.maxReward ?? 0,
    resetOnMax: bonus.resetOnMax ?? false,
    milestoneBonus: {
      weekly: bonus.milestoneBonus?.weekly ?? 0,
      monthly: bonus.milestoneBonus?.monthly ?? 0
    }
  }
}

export async function saveBonusSettings(
  guildId: string,
  values: TBonusFormValues
) {
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()

  const updatedDoc = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: { bonusSettings: values } },
    { new: true, upsert: true }
  )

  if (!updatedDoc) return null

  const bonus = updatedDoc.bonusSettings ?? {}

  return {
    rewardMode: bonus.rewardMode ?? 'linear',
    baseReward: bonus.baseReward ?? 0,
    streakIncrement: bonus.streakIncrement ?? 0,
    streakMultiplier: bonus.streakMultiplier ?? 1,
    maxReward: bonus.maxReward ?? 0,
    resetOnMax: bonus.resetOnMax ?? false,
    milestoneBonus: {
      weekly: bonus.milestoneBonus?.weekly ?? 0,
      monthly: bonus.milestoneBonus?.monthly ?? 0
    }
  }
}
