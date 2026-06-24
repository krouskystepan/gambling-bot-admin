'use server'

import { hasDevAccess } from 'gambling-bot-shared/dev'

import { getSessionOrNull } from '@/lib/auth/requireSession'

export type DevActionError = { ok: false; error: string }

export type DevActionAccess = {
  ok: true
  userId: string
  session: NonNullable<Awaited<ReturnType<typeof getSessionOrNull>>>
}

export async function requireDevAction(
  guildId: string
): Promise<DevActionAccess | DevActionError> {
  const session = await getSessionOrNull()
  const userId = session?.userId

  if (!session || !userId || !hasDevAccess(userId, guildId)) {
    return { ok: false, error: 'Forbidden' }
  }

  return { ok: true, userId, session }
}
