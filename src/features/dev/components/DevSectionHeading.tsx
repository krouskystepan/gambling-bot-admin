type DevSectionHeadingProps = {
  title: string
  description?: string
}

const DevSectionHeading = ({ title, description }: DevSectionHeadingProps) => {
  return (
    <div className="space-y-1">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export default DevSectionHeading
