'use server'

import { generateId } from 'gambling-bot-shared/common'
import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import {
  MODERATION_MANAGER_TARGET_ERROR,
  MODERATION_SELF_ERROR,
  appendStaffNote,
  canModerateUserTarget,
  createStaffNoteEntry,
  normalizeBanReason,
  normalizeStaffNotes,
  removeStaffNote,
  updateStaffNote
} from 'gambling-bot-shared/user'

import { revalidatePath } from 'next/cache'

import { resolveManagerStatus } from '@/actions/discord/role.action'
import {
  addGuildMemberRole,
  removeGuildMemberRole
} from '@/actions/discord/vipDiscord.action'
import { connectToDatabase } from '@/lib/db'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import GuildConfiguration from '@/models/GuildConfiguration'
import User from '@/models/User'
import UserBan from '@/models/UserBan'

import { requireGuildAccess } from '../perms'

type ActionResult = { success: boolean; message: string; rateLimited?: boolean }

function setStaffNotes(
  user: {
    staffNotes?: unknown
    set: (path: string, value: unknown) => void
    markModified: (path: string) => void
  },
  notes: ReturnType<typeof normalizeStaffNotes>
) {
  user.set('staffNotes', notes)
  user.markModified('staffNotes')
}

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

    const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
    const targetHasManagerRole = await resolveManagerStatus(
      guildId,
      userId,
      guildConfig?.managerRoleId
    )

    const moderationGuard = canModerateUserTarget({
      actorUserId: managerId,
      actorIsElevated: access.isAdmin,
      targetUserId: userId,
      targetHasManagerRole
    })

    if (!moderationGuard.ok) {
      return {
        success: false,
        message:
          moderationGuard.code === 'SELF'
            ? MODERATION_SELF_ERROR
            : MODERATION_MANAGER_TARGET_ERROR
      }
    }

    const [user] = await Promise.all([User.findOne({ guildId, userId })])

    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    if (user.banned) {
      return { success: false, message: 'User is already banned.' }
    }

    const banReason = normalizeBanReason(reason)
    const now = new Date()

    await UserBan.create({
      banId: generateId(),
      guildId,
      userId,
      bannedAt: now,
      bannedBy: managerId,
      banReason,
      unbannedAt: null,
      unbannedBy: null
    })

    user.banned = true
    user.bannedAt = now
    user.bannedBy = managerId
    await user.save()

    await syncBannedRole({
      guildId,
      userId,
      roleId: guildConfig?.bannedRoleId ?? '',
      add: true
    })

    revalidatePath(profilePath(guildId, userId))
    revalidatePath(`/dashboard/g/${guildId}/users`)
    revalidatePath(`/dashboard/g/${guildId}/staff-actions`)

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

    const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
    const targetHasManagerRole = await resolveManagerStatus(
      guildId,
      userId,
      guildConfig?.managerRoleId
    )

    const moderationGuard = canModerateUserTarget({
      actorUserId: managerId,
      actorIsElevated: access.isAdmin,
      targetUserId: userId,
      targetHasManagerRole
    })

    if (!moderationGuard.ok) {
      return {
        success: false,
        message:
          moderationGuard.code === 'SELF'
            ? MODERATION_SELF_ERROR
            : MODERATION_MANAGER_TARGET_ERROR
      }
    }

    const [user, activeBan] = await Promise.all([
      User.findOne({ guildId, userId }),
      UserBan.findOne({ guildId, userId, unbannedAt: null }).sort({
        bannedAt: -1
      })
    ])

    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    if (!user.banned) {
      return { success: false, message: 'User is not banned.' }
    }

    const unbanReason = normalizeBanReason(reason)
    const now = new Date()

    if (activeBan) {
      activeBan.unbannedAt = now
      activeBan.unbannedBy = managerId
      activeBan.unbanReason = unbanReason
      await activeBan.save()
    }

    user.banned = false
    user.bannedAt = null
    user.bannedBy = null
    await user.save()

    await syncBannedRole({
      guildId,
      userId,
      roleId: guildConfig?.bannedRoleId ?? '',
      add: false
    })

    revalidatePath(profilePath(guildId, userId))
    revalidatePath(`/dashboard/g/${guildId}/users`)
    revalidatePath(`/dashboard/g/${guildId}/staff-actions`)

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
  const entry = createStaffNoteEntry(text, managerId)

  if (!entry) {
    return { success: false, message: 'Note cannot be empty.' }
  }

  try {
    await connectToDatabase()

    const user = await User.findOne({ guildId, userId })
    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    setStaffNotes(
      user,
      appendStaffNote(normalizeStaffNotes(user.staffNotes ?? []), entry)
    )

    await user.save()

    await recordStaffAudit({
      guildId,
      userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_CREATE,
      notes: entry.text
    })

    revalidatePath(profilePath(guildId, userId))

    return { success: true, message: 'Note added.' }
  } catch (err) {
    console.error('Failed to add staff note:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

function canManageStaffNote({
  note,
  managerId,
  isGuildAdmin
}: {
  note: { authorId: string }
  managerId: string
  isGuildAdmin: boolean
}) {
  return isGuildAdmin || note.authorId === managerId
}

export async function updateUserStaffNote(
  guildId: string,
  userId: string,
  noteId: string,
  text: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const managerId = access.session.userId!

  try {
    await connectToDatabase()

    const user = await User.findOne({ guildId, userId })
    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    const existing = normalizeStaffNotes(user.staffNotes ?? []).find(
      (note) => note.noteId === noteId
    )

    if (!existing) {
      return { success: false, message: 'Note not found.' }
    }

    if (
      !canManageStaffNote({
        note: existing,
        managerId,
        isGuildAdmin: access.isAdmin
      })
    ) {
      return { success: false, message: 'You can only edit your own notes.' }
    }

    const nextNotes = updateStaffNote(
      normalizeStaffNotes(user.staffNotes ?? []),
      noteId,
      text
    )
    if (!nextNotes) {
      return { success: false, message: 'Note cannot be empty.' }
    }

    setStaffNotes(user, nextNotes)
    await user.save()

    await recordStaffAudit({
      guildId,
      userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_UPDATE,
      notes: text
    })

    revalidatePath(profilePath(guildId, userId))

    return { success: true, message: 'Note updated.' }
  } catch (err) {
    console.error('Failed to update staff note:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}

export async function deleteUserStaffNote(
  guildId: string,
  userId: string,
  noteId: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const managerId = access.session.userId!

  try {
    await connectToDatabase()

    const user = await User.findOne({ guildId, userId })
    if (!user) {
      return { success: false, message: 'User is not registered.' }
    }

    const existing = normalizeStaffNotes(user.staffNotes ?? []).find(
      (note) => note.noteId === noteId
    )

    if (!existing) {
      return { success: false, message: 'Note not found.' }
    }

    if (
      !canManageStaffNote({
        note: existing,
        managerId,
        isGuildAdmin: access.isAdmin
      })
    ) {
      return { success: false, message: 'You can only delete your own notes.' }
    }

    const nextNotes = removeStaffNote(
      normalizeStaffNotes(user.staffNotes ?? []),
      noteId
    )
    if (!nextNotes) {
      return { success: false, message: 'Note not found.' }
    }

    setStaffNotes(user, nextNotes)
    await user.save()

    await recordStaffAudit({
      guildId,
      userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_DELETE,
      notes: existing.text
    })

    revalidatePath(profilePath(guildId, userId))

    return { success: true, message: 'Note deleted.' }
  } catch (err) {
    console.error('Failed to delete staff note:', err)
    return { success: false, message: 'Server error, please try again.' }
  }
}
