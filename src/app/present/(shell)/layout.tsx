import PresentationBanner from '@/components/presentation/PresentationBanner'
import GuildConfigSidebar from '@/components/shell/guild-config/GuildConfigSidebar'
import { DEMO_GUILD_ID, DEMO_GUILD_NAME } from '@/lib/presentation'

const PresentationShellLayout = ({
  children
}: {
  children: React.ReactNode
}) => (
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
    <PresentationBanner />
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <GuildConfigSidebar
        guildId={DEMO_GUILD_ID}
        guildName={DEMO_GUILD_NAME}
        isAdmin
        isManager
        isDev
        basePath="/present"
        activeSegmentIndex={2}
        pendingAtmCount={3}
        needsAttentionCount={4}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-6">
        {children}
      </main>
    </div>
  </div>
)

export default PresentationShellLayout
