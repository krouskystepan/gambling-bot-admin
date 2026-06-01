import { type VariantProps } from 'class-variance-authority'

import * as React from 'react'

import { fieldControlVariants } from '@/components/ui/field-styles'
import { cn } from '@/lib/utils'

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof fieldControlVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldControlVariants({ variant }),
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex px-3 py-1 text-base md:text-sm',
        className
      )}
      {...props}
    />
  )
}

export { Input }
