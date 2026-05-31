import { redirect } from 'next/navigation'

import { getGuildName } from '@/actions/discord/guilds.action'
import { isBotInGuild } from '@/actions/discord/utils.action'
import { getUserPermissions } from '@/actions/perms'
import GuildConfigSidebar from '@/components/GuildConfigSidebar'
import BotNotInGuild from '@/components/states/BotNotInGuild'
import NoPerms from '@/components/states/NoPerms'
import RateLimited from '@/components/states/RateLimmited'
import { requireSession } from '@/lib/requireSession'
import { loadUserGuildsResult } from '@/lib/userGuilds'

type GuildConfLayoutProps = {
  children: React.ReactNode
  params: Promise<{ guildId: string }>
}

const guildStateMain = (content: React.ReactNode) => (
  <main className="flex flex-1 justify-start overflow-auto p-6">{content}</main>
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

  const { isAdmin, isManager, rateLimited } = await getUserPermissions(
    guildId,
    session
  )
  const hasAccess = isAdmin || isManager

  if (rateLimited) {
    return guildStateMain(<RateLimited />)
  }

  if (!hasAccess) {
    return guildStateMain(<NoPerms />)
  }

  return (
    <div className="flex h-full">
      <GuildConfigSidebar
        guildId={guildId}
        guildName={guildName}
        isAdmin={isAdmin}
        isManager={isManager}
      />

      <main className="flex flex-1 justify-start overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}

export default GuildConfLayout
