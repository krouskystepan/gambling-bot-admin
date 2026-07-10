'use client'

import { ReactNode } from 'react'

import { usePresentationReadOnly } from '@/components/presentation/PresentationProvider'
import { cn } from '@/lib/utils'

type SettingsFormLayoutProps = {
  children: ReactNode
  actions?: ReactNode
  layoutClassName?: string
}

const SettingsFormLayout = ({
  children,
  actions,
  layoutClassName
}: SettingsFormLayoutProps) => {
  const readOnly = usePresentationReadOnly()
  const contentClassName = layoutClassName ?? 'flex flex-col gap-6'

  return (
    <div className="flex w-full flex-col gap-6">
      {readOnly ? (
        // A disabled <fieldset> greys out and blocks every form control (native
        // inputs plus Radix buttons/switches/selects) while leaving charts,
        // tooltips, and scroll containers fully interactive — so the demo stays
        // read-only but still explorable.
        <fieldset
          disabled
          className={cn(contentClassName, 'min-w-0 border-0 p-0 opacity-90')}
        >
          {children}
        </fieldset>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
      {actions}
    </div>
  )
}

export default SettingsFormLayout
