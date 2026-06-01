'use client'

import { getReadableName, readableGameNames } from 'gambling-bot-shared'
import { UseFormReturn } from 'react-hook-form'

import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import { MultiRTP, SingleRTP } from './RTP'
import { useGameRtp } from './useGameRtp'

type Props = {
  game: keyof TCasinoSettingsValues
  form: UseFormReturn<TCasinoSettingsOutput>
}

const GameHeader = ({ game, form }: Props) => {
  const { rtp, hidden, settings } = useGameRtp(game, form)

  if (!settings) return null

  return (
    <div className="mb-4 flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-center sm:gap-3">
      <h2 className="text-lg font-semibold">
        {getReadableName(game, readableGameNames)}
      </h2>

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
