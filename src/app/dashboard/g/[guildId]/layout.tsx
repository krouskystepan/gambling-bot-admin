import { getServerSession } from 'next-auth'

import { redirect } from 'next/navigation'

import { getGuildName } from '@/actions/discord/guilds.action'
import { isBotInGuild } from '@/actions/discord/utils.action'
import { getUserPermissions } from '@/actions/perms'
import GuildConfigSidebar from '@/components/GuildConfigSidebar'
import BotNotInGuild from '@/components/states/BotNotInGuild'
import NoPerms from '@/components/states/NoPerms'
import RateLimited from '@/components/states/RateLimmited'
import { authOptions } from '@/lib/authOptions'

type GuildConfLayoutProps = {
  children: React.ReactNode
  params: Promise<{ guildId: string }>
}

const GuildConfLayout = async ({ children, params }: GuildConfLayoutProps) => {
  const { guildId } = await params

  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect('/')

  const isInGuild = await isBotInGuild(guildId)
  if (!isInGuild) return <BotNotInGuild />

  const guildName = await getGuildName(guildId)
  if (!guildName) return <BotNotInGuild />

  const { isAdmin, isManager, rateLimited } = await getUserPermissions(
    guildId,
    session
  )

  return (
    <div className="flex h-full">
      <GuildConfigSidebar
        guildId={guildId}
        guildName={guildName}
        isAdmin={isAdmin}
      />

      <main className="flex flex-1 justify-start overflow-auto p-6">
        <>
          {rateLimited ? (
            <RateLimited />
          ) : !isAdmin && !isManager ? (
            <NoPerms />
          ) : (
            children
          )}
        </>
      </main>
    </div>
  )
}

export default GuildConfLayout
