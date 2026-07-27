import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  className?: string
  size?: 'page' | 'section'
}

export function PageHeader({
  title,
  description,
  className,
  size = 'section'
}: PageHeaderProps) {
  const heading = (
    <h4
      className={cn(
        'font-semibold text-primary',
        size === 'page' ? 'text-3xl' : 'text-xl',
        !description && size === 'page' && 'mb-4',
        !description && className
      )}
    >
      {title}
    </h4>
  )

  if (!description) {
    return heading
  }

  return (
    <div className={cn('space-y-1', size === 'page' && 'mb-4', className)}>
      <h4
        className={cn(
          'font-semibold text-primary',
          size === 'page' ? 'text-3xl' : 'text-xl'
        )}
      >
        {title}
      </h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
