import { redirect } from 'next/navigation'

import { getAtmRequestCounts } from '@/actions/database/atmRequest.action'
import { getHealthAttentionCount } from '@/actions/database/health.action'
import { getGuildName } from '@/actions/discord/guilds.action'
import { isBotInGuild } from '@/actions/discord/utils.action'
import { getUserPermissions } from '@/actions/perms'
import GuildConfigSidebar from '@/components/GuildConfigSidebar'
import BotNotInGuild from '@/components/states/BotNotInGuild'
import NoPerms from '@/components/states/NoPerms'
import RateLimited from '@/components/states/RateLimmited'
import { requireSession } from '@/lib/auth/requireSession'
import { loadUserGuildsResult } from '@/lib/guild/userGuilds'

type GuildConfLayoutProps = {
  children: React.ReactNode
  params: Promise<{ guildId: string }>
}

const guildMainClassName =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-6'

const guildStateMain = (content: React.ReactNode) => (
  <div className="flex h-full min-h-0 flex-1 overflow-hidden">
    <main className={guildMainClassName}>{content}</main>
  </div>
)

const GuildConfLayout = async ({ children, params }: GuildConfLayoutProps) => {
  const { guildId } = await params
  const session = await requireSession()

  const isInGuild = await isBotInGuild(guildId)
  if (!isInGuild) return guildStateMain(<BotNotInGuild />)

  const guildName = await getGuildName(guildId)
  if (!guildName) return guildStateMain(<BotNotInGuild />)

  const guildsResult = await loadUserGuildsResult()
  if (!guildsResult.ok) {
    return guildStateMain(<RateLimited />)
  }

  const { guilds: userGuilds } = guildsResult

  if (!userGuilds.some((guild) => guild.id === guildId)) {
    redirect('/dashboard')
  }

  const [{ isAdmin, isManager, rateLimited }, atmCounts, needsAttentionCount] =
    await Promise.all([
      getUserPermissions(guildId, session),
      getAtmRequestCounts(guildId, session),
      getHealthAttentionCount(guildId, session)
    ])
  const hasAccess = isAdmin || isManager

  if (rateLimited) {
    return guildStateMain(<RateLimited />)
  }

  if (!hasAccess) {
    return guildStateMain(<NoPerms />)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <GuildConfigSidebar
        guildId={guildId}
        guildName={guildName}
        isAdmin={isAdmin}
        isManager={isManager}
        pendingAtmCount={atmCounts.pending}
        needsAttentionCount={needsAttentionCount}
      />

      <main className={guildMainClassName}>{children}</main>
    </div>
  )
}

export default GuildConfLayout
