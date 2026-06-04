import { ReactNode } from 'react'

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
  return (
    <div className="flex w-full flex-col gap-6">
      <div className={cn(layoutClassName ?? 'flex flex-col gap-6')}>
        {children}
      </div>
      {actions}
    </div>
  )
}

export default SettingsFormLayout
