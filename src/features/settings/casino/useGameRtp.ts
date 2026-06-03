'use client'

import { calculateRTP } from 'gambling-bot-shared'
import { UseFormReturn, useWatch } from 'react-hook-form'

import {
  getRtpStatus,
  hasRtpWarning,
  isRtpOutOfRange
} from '@/lib/rtpWarnings'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

export { getRtpStatus, hasRtpWarning, isRtpOutOfRange }
export type { RtpStatus } from '@/lib/rtpWarnings'

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
