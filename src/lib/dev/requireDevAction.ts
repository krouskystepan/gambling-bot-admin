'use server'

import { hasDevAccess } from 'gambling-bot-shared/dev'

import { getSessionOrNull } from '@/lib/auth/requireSession'
import { getPresentationSession, isDemoGuild } from '@/lib/presentation'

export type DevActionError = { ok: false; error: string }

export type DevActionAccess = {
  ok: true
  userId: string
  session: NonNullable<Awaited<ReturnType<typeof getSessionOrNull>>>
}

export async function requireDevAction(
  guildId: string
): Promise<DevActionAccess | DevActionError> {
  // The demo guild grants read-only dev access without Discord auth. Mutating
  // dev actions guard against the sentinel guild separately.
  if (isDemoGuild(guildId)) {
    const session = getPresentationSession()
    return { ok: true, userId: session.userId ?? '', session }
  }

  const session = await getSessionOrNull()
  const userId = session?.userId

  if (!session || !userId || !hasDevAccess(userId, guildId)) {
    return { ok: false, error: 'Forbidden' }
  }

  return { ok: true, userId, session }
}
