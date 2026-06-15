import { cache } from 'react'

import { getUserGuilds } from '@/actions/discord/guilds.action'
import { requireSession } from '@/lib/auth/requireSession'
import type { IGuild } from '@/types/types'

export type UserGuildsResult =
  | { ok: true; guilds: IGuild[] }
  | { ok: false; reason: 'rate-limited' }

export const loadUserGuilds = cache(async () => {
  const session = await requireSession()
  return getUserGuilds(session)
})

export async function loadUserGuildsResult(): Promise<UserGuildsResult> {
  try {
    const guilds = await loadUserGuilds()
    return { ok: true, guilds }
  } catch (err) {
    if (err instanceof Error && err.message === 'DiscordRateLimited') {
      return { ok: false, reason: 'rate-limited' }
    }
    throw err
  }
}
