'use client'

import { EllipsisIcon } from 'lucide-react'

import { useState } from 'react'

import Link from 'next/link'

import { getPredictionDetail } from '@/actions/database/predictionActions.action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TPredictionDetail, TPredictionRow } from '@/types/types'

import CancelPredictionDialog from './CancelPredictionDialog'
import EndPredictionDialog from './EndPredictionDialog'
import PayoutPredictionDialog from './PayoutPredictionDialog'
import PredictionDetailDialog from './PredictionDetailDialog'

type PredictionActionsMenuProps = {
  guildId: string
  prediction: TPredictionRow
  predictionFeatureBlocked: boolean
  predictionFeatureBlockMessage: string | null
  logsChannelConfigured: boolean
}

const PredictionActionsMenu = ({
  guildId,
  prediction,
  predictionFeatureBlocked,
  predictionFeatureBlockMessage,
  logsChannelConfigured
}: PredictionActionsMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<TPredictionDetail | null>(null)

  const discordUrl = `https://discord.com/channels/${guildId}/${prediction.channelId}/${prediction.predictionId}`
  const canMutate = !predictionFeatureBlocked
  const mutationTooltip = predictionFeatureBlocked
    ? predictionFeatureBlockMessage
    : null

  const openDetail = async () => {
    setMenuOpen(false)
    setDetailOpen(true)
    setLoadingDetail(true)
    setDetailError(null)

    try {
      const result = await getPredictionDetail(guildId, prediction.predictionId)
      if ('error' in result) {
        setDetailError(result.error)
        setDetail(null)
      } else {
        setDetail(result)
      }
    } catch {
      setDetailError('Failed to load prediction detail.')
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Prediction actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={openDetail}>View detail</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={discordUrl} target="_blank" rel="noopener noreferrer">
              Open in Discord
            </Link>
          </DropdownMenuItem>

          {prediction.status === 'active' ? (
            <>
              <DropdownMenuSeparator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      disabled={!canMutate}
                      onClick={() => {
                        if (!canMutate) return
                        setMenuOpen(false)
                        setEndOpen(true)
                      }}
                    >
                      End prediction
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                {mutationTooltip ? (
                  <TooltipContent className="max-w-xs">
                    <p>{mutationTooltip}</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={!canMutate}
                      onClick={() => {
                        if (!canMutate) return
                        setMenuOpen(false)
                        setCancelOpen(true)
                      }}
                    >
                      Cancel prediction
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                {mutationTooltip ? (
                  <TooltipContent className="max-w-xs">
                    <p>{mutationTooltip}</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </>
          ) : null}

          {prediction.status === 'ended' ? (
            <>
              <DropdownMenuSeparator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      disabled={!canMutate || !logsChannelConfigured}
                      onClick={() => {
                        if (!canMutate || !logsChannelConfigured) return
                        setMenuOpen(false)
                        setPayoutOpen(true)
                      }}
                    >
                      Payout winners
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                {mutationTooltip ? (
                  <TooltipContent className="max-w-xs">
                    <p>{mutationTooltip}</p>
                  </TooltipContent>
                ) : !logsChannelConfigured ? (
                  <TooltipContent className="max-w-xs">
                    <p>Configure the prediction logs channel first.</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={!canMutate}
                      onClick={() => {
                        if (!canMutate) return
                        setMenuOpen(false)
                        setCancelOpen(true)
                      }}
                    >
                      Cancel prediction
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                {mutationTooltip ? (
                  <TooltipContent className="max-w-xs">
                    <p>{mutationTooltip}</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <PredictionDetailDialog
        guildId={guildId}
        predictionId={prediction.predictionId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        detail={detail}
        loading={loadingDetail}
        error={detailError}
      />

      <EndPredictionDialog
        guildId={guildId}
        predictionId={prediction.predictionId}
        title={prediction.title}
        open={endOpen}
        onOpenChange={setEndOpen}
      />

      <PayoutPredictionDialog
        guildId={guildId}
        prediction={prediction}
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
      />

      <CancelPredictionDialog
        guildId={guildId}
        predictionId={prediction.predictionId}
        title={prediction.title}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </>
  )
}

export default PredictionActionsMenu
