'use client'

import { getReadableName, readableGameNames } from 'gambling-bot-shared'
import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import { useGameRtp } from './useGameRtp'

type Props = {
  game: keyof TCasinoSettingsValues
  form: UseFormReturn<TCasinoSettingsOutput>
  isActive: boolean
  onSelect: (game: keyof TCasinoSettingsValues) => void
  variant?: 'list' | 'tile'
}

const GameNavRtpStatus = ({ status }: { status: ReturnType<typeof useGameRtp>['status'] }) => {
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
        'relative flex w-full items-center justify-between gap-2 overflow-hidden rounded px-4 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-primary',
        isActive && 'bg-sidebar-accent/50 text-sidebar-primary'
      )}
    >
      {isActive ? (
        <div className="absolute left-0 h-full w-0.5 bg-primary" />
      ) : null}

      <span className="truncate text-left">{label}</span>
      {rtpStatus}
    </button>
  )
}

export default GameNavItem
