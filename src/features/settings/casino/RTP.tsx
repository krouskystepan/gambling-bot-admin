import { readableGameValueNames } from 'gambling-bot-shared/casino'
import { getReadableName } from 'gambling-bot-shared/common'
import { TriangleAlert } from 'lucide-react'

import { RTP_LOW_WARNING_MAX } from '@/lib/overview/rtpWarnings'
import { cn } from '@/lib/utils'

const rtpToneClass = (value: number): string | undefined => {
  if (value >= 100) return 'text-destructive'
  if (value <= RTP_LOW_WARNING_MAX) return 'text-brand'
  return undefined
}

const RTPWarning = ({ value }: { value: number }) => {
  if (value >= 100) {
    return (
      <span className="inline-flex items-center gap-1">
        <TriangleAlert size={14} className="shrink-0" />≥ 100%
      </span>
    )
  }

  if (value <= RTP_LOW_WARNING_MAX) {
    return (
      <span className="inline-flex items-center gap-1">
        <TriangleAlert size={14} className="shrink-0" />≤ {RTP_LOW_WARNING_MAX}%
      </span>
    )
  }

  return null
}

export const MultiRTP = ({ rtpMap }: { rtpMap: Record<string, number> }) => (
  <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
    <span className="font-medium text-foreground/80">RTPs</span>
    {Object.entries(rtpMap).map(([bet, value], index) => {
      const tone = rtpToneClass(value)
      return (
        <span
          key={bet}
          className={cn('inline-flex items-center gap-1.5', tone)}
        >
          {index > 0 ? (
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
          ) : null}
          <span>
            {getReadableName(bet, readableGameValueNames)}{' '}
            <span className={cn('tabular-nums', !tone && 'text-foreground/90')}>
              {value.toFixed(2)}%
            </span>
          </span>
          <RTPWarning value={value} />
        </span>
      )
    })}
  </div>
)

export const SingleRTP = ({ value }: { value: number }) => {
  const tone = rtpToneClass(value)
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground',
        tone
      )}
    >
      <span className={cn('font-medium', !tone && 'text-foreground/80')}>
        RTP
      </span>
      <span className={cn('tabular-nums', !tone && 'text-foreground/90')}>
        {value.toFixed(2)}%
      </span>
      <RTPWarning value={value} />
    </div>
  )
}
