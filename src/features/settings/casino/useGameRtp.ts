'use client'

import {
  calculateRTP,
  getBlackjackPlusThreeConfigWarning
} from 'gambling-bot-shared/casino'
import { useWatch } from 'react-hook-form'

import {
  getRtpStatus,
  hasRtpWarning,
  isRtpOutOfRange
} from '@/lib/overview/rtpWarnings'
import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

export { getRtpStatus, hasRtpWarning, isRtpOutOfRange }
export type { RtpStatus } from '@/lib/overview/rtpWarnings'

export const HIDDEN_RTP_GAMES: Array<keyof TCasinoSettingsValues> = [
  'prediction'
]

/** Non-game casino config (no RTP); listed after games in the sidebar. */
export const NON_GAME_CASINO_SECTIONS: Array<keyof TCasinoSettingsValues> = [
  'winAnnouncements'
]

const skipsRtp = (game: keyof TCasinoSettingsValues) =>
  HIDDEN_RTP_GAMES.includes(game) || NON_GAME_CASINO_SECTIONS.includes(game)

export const sortCasinoGamesForNav = (
  games: Array<keyof TCasinoSettingsValues>
): Array<keyof TCasinoSettingsValues> => {
  const withRtp = games.filter((game) => !HIDDEN_RTP_GAMES.includes(game))
  const withoutRtp = HIDDEN_RTP_GAMES.filter((game) => games.includes(game))

  return [...withRtp, ...withoutRtp]
}

type TRtpGame = Parameters<typeof calculateRTP>[0]

const getGameRtp = <G extends TRtpGame>(
  game: G,
  gameSettings: Parameters<typeof calculateRTP>[1]
) => calculateRTP(game, gameSettings)

export const useGameRtp = <G extends keyof TCasinoSettingsValues>(
  game: G,
  form: TCasinoSettingsForm
) => {
  const settings = useWatch({
    control: form.control,
    name: game
  })

  const hidden = skipsRtp(game)
  const rtp =
    settings && !hidden
      ? getGameRtp(
          game as TRtpGame,
          settings as Parameters<typeof calculateRTP>[1]
        )
      : null

  const configWarning =
    game === 'blackjack' &&
    settings &&
    typeof settings === 'object' &&
    'deckCount' in settings &&
    'plusThreeMultipliers' in settings
      ? getBlackjackPlusThreeConfigWarning({
          deckCount: settings.deckCount,
          plusThreeMultipliers: settings.plusThreeMultipliers
        })
      : null

  const rtpWarning = hidden ? false : hasRtpWarning(rtp)

  return {
    settings,
    rtp,
    hidden,
    configWarning,
    hasWarning: rtpWarning || Boolean(configWarning),
    status: getRtpStatus(rtp, hidden)
  }
}
