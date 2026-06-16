import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  className?: string
  size?: 'page' | 'section'
}

export function PageHeader({
  title,
  className,
  size = 'section'
}: PageHeaderProps) {
  return (
    <h4
      className={cn(
        'font-semibold text-primary',
        size === 'page' ? 'mb-4 text-3xl' : 'text-xl',
        className
      )}
    >
      {title}
    </h4>
  )
}
