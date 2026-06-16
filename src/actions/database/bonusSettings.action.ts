'use server'

import { normalizeBonusSettings } from 'gambling-bot-shared/bonus'
import { bonusFormSchema } from 'gambling-bot-shared/bonus'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TBonusFormValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

const toFormValues = (bonus: Record<string, unknown>): TBonusFormValues => {
  const normalized = normalizeBonusSettings({
    rewardMode: (bonus.rewardMode ??
      'linear') as TBonusFormValues['rewardMode'],
    baseReward: Number(bonus.baseReward ?? 0),
    streakIncrement: Number(bonus.streakIncrement ?? 0),
    streakMultiplier: Number(bonus.streakMultiplier ?? 1),
    maxReward: Number(bonus.maxReward ?? 0),
    resetOnMax: Boolean(bonus.resetOnMax ?? false),
    milestoneBonus: {
      weekly: Number(
        (bonus.milestoneBonus as { weekly?: number } | undefined)?.weekly ?? 0
      ),
      monthly: Number(
        (bonus.milestoneBonus as { monthly?: number } | undefined)?.monthly ?? 0
      )
    }
  })

  return bonusFormSchema.parse(normalized)
}

export async function getBonusSettings(
  guildId: string
): Promise<TBonusFormValues | null> {
  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return toFormValues((doc.bonusSettings ?? {}) as Record<string, unknown>)
}

export async function saveBonusSettings(
  guildId: string,
  values: TBonusFormValues
) {
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  const parsed = bonusFormSchema.parse(normalizeBonusSettings(values))

  await connectToDatabase()

  const updatedDoc = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: { bonusSettings: parsed } },
    { new: true, upsert: true }
  )

  if (!updatedDoc) return null

  return toFormValues(
    (updatedDoc.bonusSettings ?? {}) as Record<string, unknown>
  )
}
