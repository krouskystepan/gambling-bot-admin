import { cva } from 'class-variance-authority'

export const fieldControlVariants = cva(
  'w-full min-w-0 rounded-md text-sm transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'h-9 border border-input bg-transparent shadow-xs dark:bg-input/30',
        muted: 'h-9 border border-transparent bg-muted shadow-none'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type FieldControlVariant = NonNullable<
  Parameters<typeof fieldControlVariants>[0]
>['variant']
