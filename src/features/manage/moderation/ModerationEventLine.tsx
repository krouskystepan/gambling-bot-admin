import { cn } from '@/lib/utils'

import { formatModerationWhen } from './formatModerationWhen'

type ModerationEventLineProps = {
  label: string
  when: Date | string
  staffName?: string
  staffId: string
  detail?: string
  tone?: 'ban' | 'unban' | 'neutral'
}

const toneClass = {
  ban: 'text-destructive',
  unban: 'text-foreground',
  neutral: 'text-muted-foreground'
} as const

const ModerationEventLine = ({
  label,
  when,
  staffName,
  staffId,
  detail,
  tone = 'neutral'
}: ModerationEventLineProps) => {
  return (
    <p className="text-sm leading-snug">
      <span className={cn('font-medium', toneClass[tone])}>{label}</span>
      <span className="text-muted-foreground tabular-nums">
        {' '}
        {formatModerationWhen(when)} · {staffName ?? staffId}
      </span>
      {detail ? (
        <>
          <span className="text-muted-foreground"> · </span>
          <span className="whitespace-pre-wrap">{detail}</span>
        </>
      ) : null}
    </p>
  )
}

export default ModerationEventLine
