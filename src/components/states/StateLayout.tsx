import React from 'react'

import { cn } from '@/lib/utils'

import { type StateTitleTone, stateTitleToneClass } from './stateTitleStyles'

interface StateLayoutProps {
  Icon: React.ReactNode
  titleText: string
  titleTone?: StateTitleTone
  description: string
  button?: React.ReactNode
}

const StateLayout = ({
  Icon,
  titleText,
  titleTone = 'brand',
  description,
  button
}: StateLayoutProps) => {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 text-center">
      {Icon}

      <h1
        className={cn(
          'text-4xl font-extrabold',
          stateTitleToneClass[titleTone]
        )}
      >
        {titleText}
      </h1>

      <p className="max-w-sm text-muted-foreground">{description}</p>

      {button ? button : null}
    </div>
  )
}

export default StateLayout
