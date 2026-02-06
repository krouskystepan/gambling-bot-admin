'use client'

import { Checkbox as CheckboxPrimitive } from 'radix-ui'

import * as React from 'react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex size-4 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center w-full h-full text-current"
      >
        {props.checked === 'indeterminate' ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            className="translate-y-[0.6px] translate-x-[0.5px]"
            fill="currentColor"
          >
            <rect x="2" y="5.25" width="8" height="1.5" rx="0.75" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            className="translate-y-[0.6px] translate-x-[0.5px]"
            fill="currentColor"
          >
            <path d="M10.28 2.72a.75.75 0 0 1 0 1.06L5.53 8.53a.75.75 0 0 1-1.06 0L1.72 5.78a.75.75 0 1 1 1.06-1.06L5 6.94l4.22-4.22a.75.75 0 0 1 1.06 0z" />
          </svg>
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
