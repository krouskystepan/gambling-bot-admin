type DashboardFullPageStateProps = {
  children: React.ReactNode
}

const DashboardFullPageState = ({ children }: DashboardFullPageStateProps) => {
  return (
    <div className="flex h-full min-h-screen w-full overflow-hidden bg-linear-to-br from-black via-[#121212] to-[#0a0a0a]">
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  )
}

export default DashboardFullPageState
