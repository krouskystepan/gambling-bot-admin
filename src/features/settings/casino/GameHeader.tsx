'use client'

import { readableGameNames } from 'gambling-bot-shared/casino'
import { getReadableName } from 'gambling-bot-shared/common'
import { CircleQuestionMark, TriangleAlert } from 'lucide-react'

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
  const { rtp, hidden, settings, configWarning } = useGameRtp(game, form)

  if (!settings) return null

  const title = DETAIL_TITLES[game] ?? getReadableName(game, readableGameNames)

  const rtpBlock =
    !hidden &&
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
              Static RTP assumes a full draw. Single-participant raffles refund
              100%.
            </TooltipContent>
          </Tooltip>
        ) : null}
      </span>
    ) : rtp ? (
      <MultiRTP rtpMap={rtp} />
    ) : null)

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 py-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-base leading-none font-semibold">{title}</h2>
        {rtpBlock}
      </div>

      {configWarning ? (
        <div className="flex items-start gap-2 rounded-md border border-brand/25 bg-brand/10 px-2.5 py-1.5 text-xs text-brand">
          <TriangleAlert size={14} className="mt-0.5 shrink-0 opacity-90" />
          <span className="min-w-0 leading-snug">{configWarning}</span>
        </div>
      ) : null}
    </div>
  )
}

export default GameHeader
