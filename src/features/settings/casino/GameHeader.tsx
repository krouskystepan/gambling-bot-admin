'use client'

import { getReadableName, readableGameNames } from 'gambling-bot-shared'

import { TCasinoSettingsForm, TCasinoSettingsValues } from '@/types/types'

import { MultiRTP, SingleRTP } from './RTP'
import { useGameRtp } from './useGameRtp'

type Props = {
  game: keyof TCasinoSettingsValues
  form: TCasinoSettingsForm
}

const DETAIL_TITLES: Partial<Record<keyof TCasinoSettingsValues, string>> = {
  winAnnouncements: 'Big win announcements'
}

const GameHeader = ({ game, form }: Props) => {
  const { rtp, hidden, settings } = useGameRtp(game, form)

  if (!settings) return null

  const title =
    DETAIL_TITLES[game] ?? getReadableName(game, readableGameNames)

  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="text-base leading-none font-semibold">{title}</h2>

      {!hidden &&
        (typeof rtp === 'number' ? (
          <SingleRTP value={rtp} />
        ) : rtp ? (
          <MultiRTP rtpMap={rtp} />
        ) : null)}
    </div>
  )
}

export default GameHeader
