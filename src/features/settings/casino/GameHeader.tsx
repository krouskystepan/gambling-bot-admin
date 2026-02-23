'use client'

import { calculateRTP, readableGameNames } from 'gambling-bot-shared'
import { UseFormReturn, useWatch } from 'react-hook-form'

import { getReadableName } from '@/lib/utils'
import { TCasinoSettingsOutput, TCasinoSettingsValues } from '@/types/types'

import { MultiRTP, SingleRTP } from './RTP'

type Props = {
  game: keyof TCasinoSettingsValues
  form: UseFormReturn<TCasinoSettingsOutput>
}

const GameHeader = ({ game, form }: Props) => {
  const settings = useWatch({
    control: form.control,
    name: game
  })

  if (!settings) return null

  const rtp = calculateRTP(game, settings as TCasinoSettingsValues[typeof game])

  const HIDDEN_RTP_GAMES: Array<keyof TCasinoSettingsValues> = [
    'blackjack',
    'raffle',
    'prediction'
  ]

  return (
    <div className="flex w-full gap-2 items-center justify-start pr-4">
      <span className="group-hover:underline">
        {getReadableName(game, readableGameNames)}
      </span>

      {!HIDDEN_RTP_GAMES.includes(game) &&
        (typeof rtp === 'number' ? (
          <SingleRTP value={rtp} />
        ) : (
          <MultiRTP rtpMap={rtp} />
        ))}
    </div>
  )
}

export default GameHeader
