'use client'

import { getReadableName, readableGameNames } from 'gambling-bot-shared'
import { CheckCircle2, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

import { useGameRtp } from './useGameRtp'

type Props = {
  game: keyof TCasinoSettingsValues
  form: TCasinoSettingsForm
  isActive: boolean
  onSelect: (game: keyof TCasinoSettingsValues) => void
  variant?: 'list' | 'tile'
}

const GameNavRtpStatus = ({
  status
}: {
  status: ReturnType<typeof useGameRtp>['status']
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
        aria-label="RTP at or below 90%"
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
  form,
  isActive,
  onSelect,
  variant = 'list'
}: Props) => {
  const { hidden, status } = useGameRtp(game, form)
  const label = getReadableName(game, readableGameNames)
  const rtpStatus = !hidden ? <GameNavRtpStatus status={status} /> : null

  if (variant === 'tile') {
    return (
      <button
        type="button"
        onClick={() => onSelect(game)}
        className={cn(
          'flex items-start justify-between gap-2 rounded-lg border p-2.5 text-left transition',
          isActive
            ? 'border-primary bg-sidebar-accent/50 text-sidebar-primary'
            : 'border-border hover:bg-muted/50'
        )}
      >
        <span className="truncate text-sm font-medium">{label}</span>
        {rtpStatus}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(game)}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded px-4 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-primary',
        isActive && 'bg-sidebar-accent/50 font-medium text-sidebar-primary'
      )}
    >
      <span className="truncate">{label}</span>
      {rtpStatus}
    </button>
  )
}

export default GameNavItem
