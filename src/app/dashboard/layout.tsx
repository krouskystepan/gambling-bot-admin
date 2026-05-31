import { Toaster } from 'sonner'

import DashboardFullPageState from '@/components/DashboardFullPageState'
import DashboardSidebar from '@/components/DashboardSidebar'
import RateLimited from '@/components/states/RateLimmited'
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
    <div className="flex h-full min-h-dvh overflow-hidden bg-linear-to-br from-black via-[#121212] to-[#0a0a0a]">
      <DashboardSidebar guilds={guildsResult.guilds} />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
        {children}
        <Toaster richColors position="bottom-right" theme="dark" />
      </div>
    </div>
  )
}

export default DashboardLayout
