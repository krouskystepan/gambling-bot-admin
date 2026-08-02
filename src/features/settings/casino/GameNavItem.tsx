'use client'

import { readableGameNames } from 'gambling-bot-shared/casino'
import { getReadableName } from 'gambling-bot-shared/common'
import { CheckCircle2, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

import { useGameRtp } from './useGameRtp'

type Props = {
  game: keyof TCasinoSettingsValues
  label?: string
  form: TCasinoSettingsForm
  isActive: boolean
  onSelect: (game: keyof TCasinoSettingsValues) => void
  variant?: 'list' | 'tile'
}

const GameNavRtpStatus = ({
  status,
  hasConfigWarning
}: {
  status: ReturnType<typeof useGameRtp>['status']
  hasConfigWarning: boolean
}) => {
  if (status === 'hidden') return null

  if (status === 'high') {
    return (
      <TriangleAlert
        size={14}
        className="shrink-0 text-destructive"
        aria-label="RTP at or above 100%"
      />
    )
  }

  if (status === 'low') {
    return (
      <TriangleAlert
        size={14}
        className="shrink-0 text-brand"
        aria-label="RTP at or below 80%"
      />
    )
  }

  if (hasConfigWarning) {
    return (
      <TriangleAlert
        size={14}
        className="shrink-0 text-amber-600 dark:text-amber-400"
        aria-label="Blackjack side bet config warning"
      />
    )
  }

  return (
    <CheckCircle2
      size={14}
      className="shrink-0 text-green-500"
      aria-label="RTP within target range"
    />
  )
}

const GameNavItem = ({
  game,
  label: labelOverride,
  form,
  isActive,
  onSelect,
  variant = 'list'
}: Props) => {
  const { hidden, status, configWarning } = useGameRtp(game, form)
  const label = labelOverride ?? getReadableName(game, readableGameNames)
  const rtpStatus = !hidden ? (
    <GameNavRtpStatus
      status={status}
      hasConfigWarning={Boolean(configWarning)}
    />
  ) : null
  const gameValues = form.watch(game)
  const isDisabled =
    game !== 'winAnnouncements' &&
    typeof gameValues === 'object' &&
    gameValues !== null &&
    'enabled' in gameValues &&
    gameValues.enabled === false

  if (variant === 'tile') {
    return (
      <button
        type="button"
        onClick={() => onSelect(game)}
        className={cn(
          'flex items-start justify-between gap-2 rounded-lg border p-2.5 text-left transition',
          isActive
            ? 'border-primary bg-sidebar-accent/50 text-sidebar-primary'
            : 'border-border hover:bg-muted/50',
          isDisabled && 'opacity-60'
        )}
      >
        <span
          className={cn(
            'truncate text-sm font-medium',
            isDisabled && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {rtpStatus}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(game)}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-primary',
        isActive && 'bg-sidebar-accent/50 font-medium text-sidebar-primary',
        isDisabled && 'opacity-60'
      )}
    >
      <span className={cn('truncate', isDisabled && 'text-muted-foreground')}>
        {label}
      </span>
      {rtpStatus}
    </button>
  )
}

export default GameNavItem
