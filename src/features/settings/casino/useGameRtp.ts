'use client'

import { calculateRTP } from 'gambling-bot-shared'
import { UseFormReturn, useWatch } from 'react-hook-form'

import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

export const HIDDEN_RTP_GAMES: Array<keyof TCasinoSettingsValues> = [
  'blackjack',
  'prediction',
  'raffle'
]

export const sortCasinoGamesForNav = (
  games: Array<keyof TCasinoSettingsValues>
): Array<keyof TCasinoSettingsValues> => {
  const withRtp = games.filter((game) => !HIDDEN_RTP_GAMES.includes(game))
  const withoutRtp = HIDDEN_RTP_GAMES.filter((game) => games.includes(game))

  return [...withRtp, ...withoutRtp]
}

export const isRtpOutOfRange = (value: number) => value >= 100 || value <= 90

export const hasRtpWarning = (
  rtp: number | Record<string, number> | null | undefined
): boolean => {
  if (rtp == null) return false
  if (typeof rtp === 'number') return isRtpOutOfRange(rtp)
  return Object.values(rtp).some(isRtpOutOfRange)
}

export type RtpStatus = 'hidden' | 'ok' | 'high' | 'low'

export const getRtpStatus = (
  rtp: number | Record<string, number> | null | undefined,
  hidden: boolean
): RtpStatus => {
  if (hidden || rtp == null) return 'hidden'

  const values = typeof rtp === 'number' ? [rtp] : Object.values(rtp)
  if (values.some((value) => value >= 100)) return 'high'
  if (values.some((value) => value <= 90)) return 'low'
  return 'ok'
}

export const useGameRtp = (
  game: keyof TCasinoSettingsValues,
  form: UseFormReturn<TCasinoSettingsOutput>
) => {
  const settings = useWatch({
    control: form.control,
    name: game
  })

  const hidden = HIDDEN_RTP_GAMES.includes(game)
  const rtp =
    settings && !hidden
      ? calculateRTP(game, settings as TCasinoSettingsValues[typeof game])
      : null

  return {
    settings,
    rtp,
    hidden,
    hasWarning: hidden ? false : hasRtpWarning(rtp),
    status: getRtpStatus(rtp, hidden)
  }
}
