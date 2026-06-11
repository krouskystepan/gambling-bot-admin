'use client'

import { getReadableName, readableGameNames } from 'gambling-bot-shared'
import { CircleQuestionMark } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
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

  const title = DETAIL_TITLES[game] ?? getReadableName(game, readableGameNames)

  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
      <h2 className="text-base leading-none font-semibold">{title}</h2>

      {!hidden &&
        (typeof rtp === 'number' ? (
          <span className="inline-flex items-center gap-1.5">
            <SingleRTP value={rtp} />
            {game === 'raffle' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleQuestionMark
                    size={16}
                    className="cursor-pointer text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Static RTP assumes a full draw. Single-participant raffles
                  refund 100%.
                </TooltipContent>
              </Tooltip>
            ) : null}
          </span>
        ) : rtp ? (
          <MultiRTP rtpMap={rtp} />
        ) : null)}
    </div>
  )
}

export default GameHeader
