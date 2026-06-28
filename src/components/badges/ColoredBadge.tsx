import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ColoredBadgeProps = React.ComponentProps<typeof Badge> & {
  colorClass: string
}

const ColoredBadge = ({
  colorClass,
  className,
  children,
  ...props
}: ColoredBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn('px-2 select-none', colorClass, className)}
      {...props}
    >
      {children}
    </Badge>
  )
}

export default ColoredBadge
