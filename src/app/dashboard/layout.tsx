import DashboardFullPageState from '@/components/DashboardFullPageState'
import DashboardSidebar from '@/components/DashboardSidebar'
import RateLimited from '@/components/states/RateLimmited'
import { Toaster } from '@/components/ui/sonner'
import { loadUserGuildsResult } from '@/lib/userGuilds'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const guildsResult = await loadUserGuildsResult()

  if (!guildsResult.ok) {
    return (
      <DashboardFullPageState>
        <RateLimited />
      </DashboardFullPageState>
    )
  }

  return (
    <div className="flex h-full min-h-dvh overflow-hidden bg-background">
      <DashboardSidebar guilds={guildsResult.guilds} />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
        {children}
        <Toaster richColors position="bottom-right" />
      </div>
    </div>
  )
}

export default DashboardLayout
