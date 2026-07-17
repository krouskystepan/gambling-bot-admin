'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { RaffleParticipantRow } from '@/actions/database/raffleActions.action'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { guildBasePath } from '@/lib/guild/guildBasePath'

type RaffleParticipantsDialogProps = {
  guildId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  raffleId: string | null
  drawId: string | null
  participants: RaffleParticipantRow[]
  loading: boolean
  error: string | null
}

const RaffleParticipantsDialog = ({
  guildId,
  open,
  onOpenChange,
  raffleId,
  drawId,
  participants,
  loading,
  error
}: RaffleParticipantsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raffle participants</DialogTitle>
          <DialogDescription>
            {raffleId ? (
              <>
                Message ID: {raffleId}
                {drawId ? ` · Reference ID: ${drawId}` : null}
              </>
            ) : (
              'Ticket holders for this raffle.'
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading participants…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has bought tickets yet.
          </p>
        ) : (
          <ScrollArea className="max-h-80 pr-3">
            <ul className="space-y-3">
              {participants.map((participant) => (
                <li
                  key={participant.userId}
                  className="flex items-center justify-between gap-3"
                >
                  <Link
                    href={`${guildBasePath(guildId)}/users/${participant.userId}`}
                    className="flex min-w-0 items-center gap-2 hover:text-primary"
                  >
                    <Image
                      className="rounded-full"
                      width={28}
                      height={28}
                      alt={participant.username}
                      src={participant.avatar}
                    />
                    <span className="truncate text-sm font-medium">
                      {participant.username}
                    </span>
                  </Link>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {participant.tickets} ticket
                    {participant.tickets === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RaffleParticipantsDialog
