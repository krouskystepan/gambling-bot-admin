'use server'

import { authOptions } from '@/lib/authOptions'
import { connectToDatabase } from '@/lib/utils'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TVipSettingsValues } from '@/types/types'
import { getServerSession } from 'next-auth'
import { getUserPermissions } from '../perms'

export async function getVipSettings(
  guildId: string
): Promise<TVipSettingsValues | null> {
  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return {
    roleOwnerId: doc.vipSettings?.roleOwnerId ?? '',
    roleMemberId: doc.vipSettings?.roleMemberId ?? '',
    categoryId: doc.vipSettings?.categoryId ?? '',
    pricePerAdditionalMember: doc.vipSettings?.pricePerAdditionalMember ?? 0,
    maxMembers: doc.vipSettings?.maxMembers ?? 0,
    pricePerDay: doc.vipSettings?.pricePerDay ?? 0,
    pricePerCreate: doc.vipSettings?.pricePerCreate ?? 0
  }
}

export async function saveVipSettings(
  guildId: string,
  values: TVipSettingsValues
) {
  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()

  const updatedDoc = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: { vipSettings: values } },
    { new: true, upsert: true }
  )

  if (!updatedDoc) return null

  return {
    roleOwnerId: updatedDoc.vipSettings?.roleOwnerId ?? '',
    roleMemberId: updatedDoc.vipSettings?.roleMemberId ?? '',
    categoryId: updatedDoc.vipSettings?.categoryId ?? '',
    pricePerAdditionalMember:
      updatedDoc.vipSettings?.pricePerAdditionalMember ?? 0,
    maxMembers: updatedDoc.vipSettings?.maxMembers ?? 0,
    pricePerDay: updatedDoc.vipSettings?.pricePerDay ?? 0,
    pricePerCreate: updatedDoc.vipSettings?.pricePerCreate ?? 0
  }
}
