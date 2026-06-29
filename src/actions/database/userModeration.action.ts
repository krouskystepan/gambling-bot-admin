'use server'

import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import {
  appendStaffNote,
  closeLatestBanHistoryEntry,
  normalizeStaffNote,
  startBanHistoryEntry
} from 'gambling-bot-shared/user'

import { revalidatePath } from 'next/cache'

import {
  addGuildMemberRole,
  removeGuildMemberRole
} from '@/actions/discord/vipDiscord.action'
import { connectToDatabase } from '@/lib/db'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import GuildConfiguration from '@/models/GuildConfiguration'
import User from '@/models/User'

import { requireGuildAccess } from '../perms'

type ActionResult = { success: boolean; message: string; rateLimited?: boolean }

function profilePath(guildId: string, userId: string) {
  return `/dashboard/g/${guildId}/users/${userId}`
}

function handleActionError(err: unknown): ActionResult {
  if (err instanceof Error && err.message === 'DiscordRateLimited') {
    return {
      success: false,
      message: 'Discord rate limit reached. Please try again in a moment.',
      rateLimited: true
    }
  }

  console.error('User moderation action failed:', err)
  return { success: false, message: 'Server error, please try again.' }
}

async function syncBannedRole({
  guildId,
  userId,
  roleId,
  add
}: {
  guildId: string
  userId: string
  roleId: string
  add: boolean
}) {
  if (!roleId) return

  const reason = add
    ? 'Player banned via admin panel'
    : 'Player unbanned via admin panel'

  if (add) {
    await addGuildMemberRole(guildId, userId, roleId, reason)
    return
  }

  await removeGuildMemberRole(guildId, userId, roleId, reason)
}

export async function banUser(
  guildId: string,
  userId: string,
  reason?: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const managerId = access.session.userId!

  try {
    await connectToDatabase()

    const [user, guildConfig] = await Promise.all([
      User.findOne({ guildId, userId }),
      GuildConfiguration.findOne({ guildId }).lean()
    ])

    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    if (user.banned) {
      return { success: false, message: 'User is already banned.' }
    }

    const normalizedReason = reason ? normalizeStaffNote(reason) : null
    const now = new Date()
    const staffNotes = normalizedReason
      ? appendStaffNote(user.staffNotes ?? [], {
          text: `[Ban] ${normalizedReason}`,
          authorId: managerId,
          createdAt: now
        })
      : (user.staffNotes ?? [])

    user.banned = true
    user.bannedAt = now
    user.bannedBy = managerId
    user.staffNotes = staffNotes
    user.banHistory = startBanHistoryEntry({
      history: user.banHistory ?? [],
      bannedBy: managerId,
      reason: normalizedReason ?? undefined
    })

    await user.save()

    await recordStaffAudit({
      guildId,
      userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.USER_BAN,
      notes: normalizedReason ?? undefined
    })

    await syncBannedRole({
      guildId,
      userId,
      roleId: guildConfig?.bannedRoleId ?? '',
      add: true
    })

    revalidatePath(profilePath(guildId, userId))
    revalidatePath(`/dashboard/g/${guildId}/users`)

    return { success: true, message: 'User banned successfully.' }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function unbanUser(
  guildId: string,
  userId: string,
  reason?: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const managerId = access.session.userId!

  try {
    await connectToDatabase()

    const [user, guildConfig] = await Promise.all([
      User.findOne({ guildId, userId }),
      GuildConfiguration.findOne({ guildId }).lean()
    ])

    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    if (!user.banned) {
      return { success: false, message: 'User is not banned.' }
    }

    const normalizedReason = reason ? normalizeStaffNote(reason) : null
    const now = new Date()
    const staffNotes = normalizedReason
      ? appendStaffNote(user.staffNotes ?? [], {
          text: `[Unban] ${normalizedReason}`,
          authorId: managerId,
          createdAt: now
        })
      : (user.staffNotes ?? [])

    user.banned = false
    user.bannedAt = null
    user.bannedBy = null
    user.staffNotes = staffNotes
    user.banHistory = closeLatestBanHistoryEntry({
      history: user.banHistory ?? [],
      unbannedBy: managerId
    })

    await user.save()

    await recordStaffAudit({
      guildId,
      userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.USER_UNBAN,
      notes: normalizedReason ?? undefined
    })

    await syncBannedRole({
      guildId,
      userId,
      roleId: guildConfig?.bannedRoleId ?? '',
      add: false
    })

    revalidatePath(profilePath(guildId, userId))
    revalidatePath(`/dashboard/g/${guildId}/users`)

    return { success: true, message: 'User unbanned successfully.' }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function addUserStaffNote(
  guildId: string,
  userId: string,
  text: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const managerId = access.session.userId!
  const normalized = normalizeStaffNote(text)

  if (!normalized) {
    return { success: false, message: 'Note cannot be empty.' }
  }

  try {
    await connectToDatabase()

    const user = await User.findOne({ guildId, userId })
    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    user.staffNotes = appendStaffNote(user.staffNotes ?? [], {
      text: normalized,
      authorId: managerId,
      createdAt: new Date()
    })

    await user.save()

    await recordStaffAudit({
      guildId,
      userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE,
      notes: normalized
    })

    revalidatePath(profilePath(guildId, userId))

    return { success: true, message: 'Note added.' }
  } catch (err) {
    console.error('Failed to add staff note:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}
