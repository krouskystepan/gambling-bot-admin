'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/authOptions'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  assertNotDemoMutation,
  getDemoVipSettings,
  isDemoGuild
} from '@/lib/presentation'
import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import GuildConfiguration from '@/models/GuildConfiguration'
import { TVipSettingsValues } from '@/types/types'

import { getUserPermissions, requireGuildAccess } from '../perms'

function vipSliceFromDoc(
  doc: {
    vipSettings?: Partial<TVipSettingsValues> | null
  } | null
): TVipSettingsValues | null {
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

export async function getVipSettings(
  guildId: string
): Promise<TVipSettingsValues | null> {
  if (isDemoGuild(guildId)) return getDemoVipSettings()

  const access = await requireGuildAccess(guildId, { requireAdmin: true })
  if ('error' in access) return null

  await connectToDatabase()

  const doc = await GuildConfiguration.findOne({ guildId })
  if (!doc) return null

  return vipSliceFromDoc(doc)
}

export async function saveVipSettings(
  guildId: string,
  values: TVipSettingsValues
) {
  assertNotDemoMutation(guildId)

  const session = await getServerSession(authOptions)
  const { isAdmin } = await getUserPermissions(guildId, session)
  if (!isAdmin) throw new Error('Insufficient permissions: Admin only')

  await connectToDatabase()

  const existing = await GuildConfiguration.findOne({ guildId }).lean()
  const before = vipSliceFromDoc(existing)

  const updatedDoc = await GuildConfiguration.findOneAndUpdate(
    { guildId },
    { $set: { vipSettings: values } },
    { new: true, upsert: true }
  )

  if (!updatedDoc) return null

  const after = vipSliceFromDoc(updatedDoc)

  await recordSettingsChange({
    guildId,
    changedBy: session!.userId!,
    section: 'vip',
    before,
    after
  })

  revalidateGuildHealth(guildId)

  return after
}
