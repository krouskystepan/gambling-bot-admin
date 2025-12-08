import DashboardSidebar from '@/components/DashboardSidebar'
import { Toaster } from 'sonner'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full bg-linear-to-br from-black via-[#121212] to-[#0a0a0a] overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 overflow-x-auto">
        {children}
        <Toaster richColors position="bottom-right" theme="dark" />
      </div>
    </div>
  )
}

export default DashboardLayout
