import { PreferencesToaster } from '@/components/providers/PreferencesToaster'
import DashboardFullPageState from '@/components/shell/dashboard/DashboardFullPageState'
import DashboardSidebar from '@/components/shell/dashboard/DashboardSidebar'
import RateLimited from '@/components/states/RateLimmited'
import { getSessionOrNull } from '@/lib/auth/requireSession'
import { loadUserGuildsResult } from '@/lib/guild/userGuilds'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const [guildsResult, session] = await Promise.all([
    loadUserGuildsResult(),
    getSessionOrNull()
  ])

  if (!guildsResult.ok) {
    return (
      <DashboardFullPageState>
        <RateLimited />
      </DashboardFullPageState>
    )
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      <DashboardSidebar
        guilds={guildsResult.guilds}
        userName={session?.user?.name ?? null}
        userImage={session?.user?.image ?? null}
      />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
        <PreferencesToaster />
      </div>
    </div>
  )
}

export default DashboardLayout
