'use client'

import { EllipsisIcon } from 'lucide-react'

import { useState } from 'react'

import Link from 'next/link'

import { getRaffleParticipants } from '@/actions/database/raffleActions.action'
import type { RaffleParticipantRow } from '@/actions/database/raffleActions.action'
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
import { TRaffleRow } from '@/types/types'

import CancelRaffleDialog from '../CancelRaffleDialog'
import RaffleParticipantsDialog from '../RaffleParticipantsDialog'

type RaffleActionsMenuProps = {
  guildId: string
  raffle: TRaffleRow
  raffleFeatureBlocked: boolean
  raffleFeatureBlockMessage: string | null
}

const RaffleActionsMenu = ({
  guildId,
  raffle,
  raffleFeatureBlocked,
  raffleFeatureBlockMessage
}: RaffleActionsMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [participantsError, setParticipantsError] = useState<string | null>(
    null
  )
  const [participants, setParticipants] = useState<RaffleParticipantRow[]>([])

  const discordUrl = `https://discord.com/channels/${guildId}/${raffle.channelId}/${raffle.raffleId}`

  const openParticipants = async () => {
    setMenuOpen(false)
    setParticipantsOpen(true)
    setLoadingParticipants(true)
    setParticipantsError(null)

    try {
      const result = await getRaffleParticipants(guildId, raffle.raffleId)
      if ('error' in result) {
        setParticipantsError(result.error)
        setParticipants([])
      } else {
        setParticipants(result.participants)
      }
    } catch {
      setParticipantsError('Failed to load participants.')
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
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
          <DropdownMenuLabel>Raffle actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={openParticipants}>
            View participants
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={discordUrl} target="_blank" rel="noopener noreferrer">
              Open in Discord
            </Link>
          </DropdownMenuItem>
          {raffle.status === 'active' ? (
            <>
              <DropdownMenuSeparator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={raffleFeatureBlocked}
                      onClick={() => {
                        if (raffleFeatureBlocked) return
                        setMenuOpen(false)
                        setCancelOpen(true)
                      }}
                    >
                      Cancel raffle
                    </DropdownMenuItem>
                  </span>
                </TooltipTrigger>
                {raffleFeatureBlocked && raffleFeatureBlockMessage ? (
                  <TooltipContent className="max-w-xs">
                    <p>{raffleFeatureBlockMessage}</p>
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <RaffleParticipantsDialog
        guildId={guildId}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        raffleId={raffle.raffleId}
        drawId={raffle.drawId}
        participants={participants}
        loading={loadingParticipants}
        error={participantsError}
      />

      <CancelRaffleDialog
        guildId={guildId}
        raffleId={raffle.raffleId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </>
  )
}

export default RaffleActionsMenu
