import { hasDevAccess } from 'gambling-bot-shared/dev'

import { redirect } from 'next/navigation'

import { requireSession } from '@/lib/auth/requireSession'
import { isDemoGuild } from '@/lib/presentation'

export async function requireDevPage(guildId: string) {
  const session = await requireSession()

  if (isDemoGuild(guildId)) {
    return session
  }

  const userId = session.userId ?? ''

  if (!hasDevAccess(userId, guildId)) {
    redirect(`/dashboard/g/${guildId}/overview`)
  }

  return session
}
