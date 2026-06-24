type DevCardRowProps = {
  label: string
  children: React.ReactNode
}

const DevCardRow = ({ label, children }: DevCardRowProps) => {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

export default DevCardRow
