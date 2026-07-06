'use server'

import { parseTimeToSeconds } from 'gambling-bot-shared/common'
import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import { type TVipRoom } from 'gambling-bot-shared/vip'

import { revalidatePath } from 'next/cache'

import { invalidateGuildChannelsCache } from '@/actions/discord/channel.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import {
  addGuildMemberRole,
  createGuildTextChannel,
  deleteChannelPermissionOverwrite,
  deleteGuildChannel,
  removeGuildMemberRole,
  sendChannelEmbed,
  sendChannelEmbedAndPin,
  setChannelPermissionOverwrite
} from '@/actions/discord/vipDiscord.action'
import { connectToDatabase } from '@/lib/db'
import {
  VIP_CHANNEL_ACCESS,
  VIP_CHANNEL_READ_ONLY
} from '@/lib/discord/vipChannelPermissions'
import { blockPanelFeatureAction } from '@/lib/panel/panelFeatureActionGuard.server'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import GuildConfiguration from '@/models/GuildConfiguration'
import User from '@/models/User'
import VipRoom from '@/models/VipRoom'
import {
  addVipMemberSchema,
  createVipRoomSchema,
  extendVipRoomSchema
} from '@/types/schemas'

import { requireGuildAccess } from '../perms'

const DISCORD_GREEN = 0x57f287
const DISCORD_RED = 0xed4245

type ActionResult = { success: boolean; message: string; rateLimited?: boolean }

function vipSettingsPath(guildId: string) {
  return `/dashboard/g/${guildId}/vip-settings`
}

function formatVipSettingsError(guildId: string) {
  return `VIP is not configured. Please set up VIP settings first at ${vipSettingsPath(guildId)}.`
}

function isVipConfigured(
  vipSettings?: {
    categoryId?: string | null
    roleOwnerId?: string | null
    roleMemberId?: string | null
    pricePerDay?: number
    maxMembers?: number
  } | null
): boolean {
  return Boolean(
    vipSettings?.categoryId &&
    vipSettings.roleOwnerId &&
    vipSettings.roleMemberId &&
    (vipSettings.pricePerDay ?? 0) > 0
  )
}

function handleActionError(err: unknown): ActionResult {
  if (err instanceof Error && err.message === 'DiscordRateLimited') {
    return {
      success: false,
      message: 'Discord rate limit reached. Please try again in a moment.',
      rateLimited: true
    }
  }

  console.error('VIP manage action failed:', err)
  return { success: false, message: 'Server error, please try again.' }
}

async function loadGuildVipContext(guildId: string) {
  await connectToDatabase()
  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const vipSettings = guildConfig?.vipSettings

  return { guildConfig, vipSettings }
}

async function getActiveVipByOwner(guildId: string, ownerId: string) {
  return VipRoom.findOne({
    guildId,
    ownerId,
    expiresAt: { $gt: new Date() }
  }).lean<TVipRoom>()
}

export async function createVipRoom(
  guildId: string,
  ownerId: string,
  duration: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return {
      success: false,
      message: access.error,
      rateLimited: access.rateLimited
    }
  }

  const blocked = await blockPanelFeatureAction(guildId, 'vip', access)
  if (blocked) return blocked

  const parsed = createVipRoomSchema.safeParse({ guildId, ownerId, duration })
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid input.'
    }
  }

  const managerId = access.session.userId!
  const { vipSettings } = await loadGuildVipContext(guildId)

  if (!isVipConfigured(vipSettings)) {
    return { success: false, message: formatVipSettingsError(guildId) }
  }

  const registeredUser = await User.findOne({ userId: ownerId, guildId })
  if (!registeredUser) {
    return {
      success: false,
      message: `User is not registered. Register them first at /dashboard/g/${guildId}/users/${ownerId}.`
    }
  }

  const existingVip = await getActiveVipByOwner(guildId, ownerId)
  if (existingVip) {
    return {
      success: false,
      message: `User already has an active VIP channel (${existingVip.channelId}).`
    }
  }

  const durationSeconds = parseTimeToSeconds(duration)
  const expiresAt = new Date(Date.now() + durationSeconds * 1000)
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')

  const members = await getDiscordGuildMembers(guildId)
  const actor = members.find((member) => member.userId === managerId)
  const actorName = actor?.username ?? 'admin'
  const channelName = `vip-${actorName}-${day}-${month}`

  let channelId: string | null = null

  try {
    const channel = await createGuildTextChannel(
      guildId,
      channelName,
      vipSettings!.categoryId!
    )
    channelId = channel.id

    await setChannelPermissionOverwrite(channelId, ownerId, VIP_CHANNEL_ACCESS)

    await VipRoom.create({
      ownerId,
      guildId,
      channelId,
      expiresAt
    })

    await recordStaffAudit({
      guildId,
      userId: ownerId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.VIP_BUY,
      meta: {
        durationDays: Math.floor(durationSeconds / 86400)
      }
    })
  } catch (err) {
    if (channelId) {
      await deleteGuildChannel(channelId).catch(() => null)
    }
    return handleActionError(err)
  }

  try {
    await sendChannelEmbedAndPin(
      channelId,
      'VIP Channel Ready',
      `Your channel <#${channelId}> is valid until <t:${Math.floor(expiresAt.getTime() / 1000)}:f>`,
      DISCORD_GREEN,
      {
        content: `Welcome to your VIP channel, <@${ownerId}>! 🎉`
      }
    )

    await addGuildMemberRole(
      guildId,
      ownerId,
      vipSettings!.roleOwnerId!,
      `VIP created by admin ${managerId}`
    )
  } catch (err) {
    return handleActionError(err)
  }

  await invalidateGuildChannelsCache(guildId)
  revalidatePath(`/dashboard/g/${guildId}/vips`)

  return {
    success: true,
    message: `VIP room created for user. Expires ${expiresAt.toLocaleDateString()}.`
  }
}

export async function extendVipRoom(
  guildId: string,
  ownerId: string,
  duration: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return {
      success: false,
      message: access.error,
      rateLimited: access.rateLimited
    }
  }

  const blocked = await blockPanelFeatureAction(guildId, 'vip', access)
  if (blocked) return blocked

  const parsed = extendVipRoomSchema.safeParse({ guildId, ownerId, duration })
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid input.'
    }
  }

  const managerId = access.session.userId!
  const durationSeconds = parseTimeToSeconds(duration)

  await connectToDatabase()

  const existingVip = await getActiveVipByOwner(guildId, ownerId)
  if (!existingVip) {
    return { success: false, message: 'User does not have an active VIP room.' }
  }

  const newExpiry = new Date(
    existingVip.expiresAt.getTime() + durationSeconds * 1000
  )

  const updatedVip = await VipRoom.findOneAndUpdate(
    { ownerId, guildId },
    { $set: { expiresAt: newExpiry, expiryWarningsSent: [] } }
  )

  if (!updatedVip) {
    return { success: false, message: 'User does not have an active VIP room.' }
  }

  await recordStaffAudit({
    guildId,
    userId: ownerId,
    handledBy: managerId,
    adminAction: STAFF_ADMIN_ACTIONS.VIP_EXTEND,
    meta: {
      durationDays: Math.floor(durationSeconds / 86400)
    }
  })

  try {
    await sendChannelEmbedAndPin(
      existingVip.channelId,
      'VIP Channel Extended',
      `Your VIP now expires on <t:${Math.floor(newExpiry.getTime() / 1000)}:f>.`,
      DISCORD_GREEN,
      { pingUserId: ownerId }
    )
  } catch (err) {
    return handleActionError(err)
  }

  revalidatePath(`/dashboard/g/${guildId}/vips`)

  return {
    success: true,
    message: `VIP extended by ${Math.floor(durationSeconds / 86400)} day(s).`
  }
}

export async function removeVipRoom(
  guildId: string,
  ownerId: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return {
      success: false,
      message: access.error,
      rateLimited: access.rateLimited
    }
  }

  const blocked = await blockPanelFeatureAction(guildId, 'vip', access)
  if (blocked) return blocked

  const managerId = access.session.userId!
  await connectToDatabase()

  const { vipSettings } = await loadGuildVipContext(guildId)
  const existingVip = await getActiveVipByOwner(guildId, ownerId)

  if (!existingVip) {
    return { success: false, message: 'User does not have an active VIP room.' }
  }

  const vipRoleOwnerId = vipSettings?.roleOwnerId
  const vipRoleMemberId = vipSettings?.roleMemberId

  try {
    await setChannelPermissionOverwrite(
      existingVip.channelId,
      ownerId,
      VIP_CHANNEL_READ_ONLY.allow,
      VIP_CHANNEL_READ_ONLY.deny
    )

    await sendChannelEmbed(
      existingVip.channelId,
      'VIP Channel Removed',
      '⏰ Your VIP access has been removed. You no longer have permission to send messages in this channel. You will keep **read-only access**',
      DISCORD_RED,
      ownerId
    )

    if (vipRoleOwnerId) {
      await removeGuildMemberRole(
        guildId,
        ownerId,
        vipRoleOwnerId,
        'VIP Owner removed by admin'
      )
    }

    if (vipRoleMemberId) {
      for (const memberId of existingVip.memberIds) {
        await deleteChannelPermissionOverwrite(existingVip.channelId, memberId)
        await removeGuildMemberRole(
          guildId,
          memberId,
          vipRoleMemberId,
          'VIP Member removed by admin'
        )
        await setChannelPermissionOverwrite(
          existingVip.channelId,
          ownerId,
          VIP_CHANNEL_READ_ONLY.allow,
          VIP_CHANNEL_READ_ONLY.deny
        )
      }
    }

    await VipRoom.findOneAndDelete({ ownerId, guildId })

    await recordStaffAudit({
      guildId,
      userId: ownerId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.VIP_REMOVE
    })
  } catch (err) {
    return handleActionError(err)
  }

  revalidatePath(`/dashboard/g/${guildId}/vips`)

  return {
    success: true,
    message: 'VIP room removed. Owner keeps read-only channel access.'
  }
}

export async function addVipMember(
  guildId: string,
  ownerId: string,
  memberId: string,
  bypassLimit = false
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return {
      success: false,
      message: access.error,
      rateLimited: access.rateLimited
    }
  }

  const blocked = await blockPanelFeatureAction(guildId, 'vip', access)
  if (blocked) return blocked

  const parsed = addVipMemberSchema.safeParse({
    guildId,
    ownerId,
    memberId,
    bypassLimit
  })
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid input.'
    }
  }

  const managerId = access.session.userId!
  const { vipSettings } = await loadGuildVipContext(guildId)

  if (!isVipConfigured(vipSettings)) {
    return { success: false, message: formatVipSettingsError(guildId) }
  }

  const vipRoom = await getActiveVipByOwner(guildId, ownerId)
  if (!vipRoom) {
    return {
      success: false,
      message: 'Owner does not have an active VIP room.'
    }
  }

  if (memberId === ownerId) {
    return {
      success: false,
      message: 'The owner is already part of the VIP room.'
    }
  }

  if (vipRoom.memberIds.includes(memberId)) {
    return {
      success: false,
      message: 'User is already a member of this VIP room.'
    }
  }

  if (
    !bypassLimit &&
    vipRoom.memberIds.length >= (vipSettings?.maxMembers ?? 0)
  ) {
    return {
      success: false,
      message: `This VIP room is full. Max members allowed: ${vipSettings?.maxMembers ?? 0}.`
    }
  }

  try {
    await VipRoom.findOneAndUpdate(
      { ownerId, guildId },
      { $addToSet: { memberIds: memberId } }
    )

    if (vipSettings?.roleMemberId) {
      await addGuildMemberRole(
        guildId,
        memberId,
        vipSettings.roleMemberId,
        'VIP Member added by admin'
      )
    }

    await setChannelPermissionOverwrite(
      vipRoom.channelId,
      memberId,
      VIP_CHANNEL_ACCESS
    )

    await recordStaffAudit({
      guildId,
      userId: ownerId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.VIP_ADD_MEMBER,
      meta: {
        addedUserId: memberId,
        bypassUsed: bypassLimit
      }
    })
  } catch (err) {
    return handleActionError(err)
  }

  revalidatePath(`/dashboard/g/${guildId}/vips`)

  return {
    success: true,
    message: bypassLimit
      ? 'Member added (member limit bypassed).'
      : 'Member added to VIP room.'
  }
}
