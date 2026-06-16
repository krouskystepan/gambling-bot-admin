import { ColumnDef } from '@tanstack/react-table'
import { CircleQuestionMark } from 'lucide-react'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { TRaffleRow } from '@/types/types'

import RaffleActionsMenu from './RaffleActionsMenu'

const statusBadgeClass: Record<TRaffleRow['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  canceled: 'bg-red-500/15 text-red-700 dark:text-red-400'
}

export const raffleColumns = (
  guildId: string,
  raffleFeatureBlocked: boolean,
  raffleFeatureBlockMessage: string | null
): ColumnDef<TRaffleRow>[] => [
  {
    id: 'search',
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableColumnFilter: true,
    enableHiding: false,
    size: 0
  },
  {
    id: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    accessorKey: 'status',
    size: 88,
    minSize: 88,
    cell: ({ row }) => {
      const status = row.getValue('status') as TRaffleRow['status']
      return (
        <Badge className={`${statusBadgeClass[status]} px-2 capitalize`}>
          {status}
        </Badge>
      )
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Channel</span>,
    accessorKey: 'channelName',
    size: 150,
    minSize: 150,
    cell: ({ row }) => (
      <p>
        {row.getValue('channelName')}
        <br />
        <span className="text-xs text-muted-foreground line-clamp-1">
          ({row.original.channelId})
        </span>
      </p>
    )
  },
  {
    header: () => <span className="whitespace-nowrap">Price</span>,
    accessorKey: 'ticketPrice',
    size: 96,
    minSize: 96,
    cell: ({ row }) => formatGuildMoney(row.getValue('ticketPrice'))
  },
  {
    header: () => <span className="whitespace-nowrap">Max tickets</span>,
    accessorKey: 'maxTicketsPerUser',
    size: 104,
    minSize: 104
  },
  {
    header: () => <span className="whitespace-nowrap">Pot</span>,
    accessorKey: 'totalPot',
    size: 96,
    minSize: 96,
    cell: ({ row }) => formatGuildMoney(row.getValue('totalPot'))
  },
  {
    header: () => <span className="whitespace-nowrap">Participants</span>,
    accessorKey: 'participantsEnriched',
    size: 112,
    minSize: 112,
    cell: ({ row }) => {
      const participants = row.getValue(
        'participantsEnriched'
      ) as TRaffleRow['participantsEnriched']

      return (
        <span className="flex items-center justify-start">
          {participants.length > 0 ? (
            <>
              <span>{participants.length}</span>
              <Tooltip>
                <TooltipTrigger className="ml-2 text-muted-foreground transition hover:text-foreground">
                  <CircleQuestionMark size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <ScrollArea className="h-fit p-1">
                    {participants.map((participant) => (
                      <Link
                        key={participant.userId}
                        href={`/dashboard/g/${guildId}/users/${participant.userId}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Image
                          className="rounded-full"
                          width={20}
                          height={20}
                          alt={participant.username}
                          src={participant.avatar}
                        />
                        <span>
                          {participant.username} — {participant.tickets} ticket
                          {participant.tickets === 1 ? '' : 's'}
                        </span>
                      </Link>
                    ))}
                  </ScrollArea>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <span className="text-sm italic text-muted-foreground">None</span>
          )}
        </span>
      )
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Next draw</span>,
    accessorKey: 'nextDrawAt',
    size: 148,
    minSize: 148,
    cell: ({ row }) => {
      const date = row.getValue('nextDrawAt') as Date | string
      return date ? new Date(date).toLocaleString('cs-CZ') : '-'
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Interval</span>,
    accessorKey: 'intervalLabel',
    size: 112,
    minSize: 112
  },
  {
    header: () => <span className="whitespace-nowrap">Creator</span>,
    accessorKey: 'creatorUsername',
    size: 150,
    minSize: 150,
    cell: ({ row }) => (
      <p>
        <Link
          href={`/dashboard/g/${guildId}/users/${row.original.creatorId}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {row.getValue('creatorUsername')}
        </Link>
        <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.creatorId})
        </span>
      </p>
    )
  },
  {
    header: () => <span className="whitespace-nowrap">Created</span>,
    accessorKey: 'createdAt',
    size: 104,
    minSize: 104,
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date | string
      return date ? new Date(date).toLocaleDateString('cs-CZ') : '-'
    }
  },
  {
    id: 'actions',
    header: () => <span className="whitespace-nowrap">Actions</span>,
    size: 72,
    minSize: 72,
    enableSorting: false,
    cell: ({ row }) => (
      <RaffleActionsMenu
        guildId={guildId}
        raffle={row.original}
        raffleFeatureBlocked={raffleFeatureBlocked}
        raffleFeatureBlockMessage={raffleFeatureBlockMessage}
      />
    )
  }
]
