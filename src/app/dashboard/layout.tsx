import { Toaster } from 'sonner'

import DashboardSidebar from '@/components/DashboardSidebar'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full overflow-hidden bg-linear-to-br from-black via-[#121212] to-[#0a0a0a]">
      <DashboardSidebar />
      <div className="flex-1 overflow-x-auto">
        {children}
        <Toaster richColors position="bottom-right" theme="dark" />
      </div>
    </div>
  )
}

export default DashboardLayout
