import { ThemeToggle } from '@/components/ThemeToggle'

type DashboardFullPageStateProps = {
  children: React.ReactNode
}

const DashboardFullPageState = ({ children }: DashboardFullPageStateProps) => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-background">
      <header className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  )
}

export default DashboardFullPageState
