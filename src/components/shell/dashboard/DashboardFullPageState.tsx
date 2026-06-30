type DashboardFullPageStateProps = {
  children: React.ReactNode
}

const DashboardFullPageState = ({ children }: DashboardFullPageStateProps) => {
  return (
    <div className="flex items-center justify-center size-full overflow-hidden bg-background">
      {children}
    </div>
  )
}

export default DashboardFullPageState
