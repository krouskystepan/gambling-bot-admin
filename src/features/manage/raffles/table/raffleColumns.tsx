import { ColumnDef } from '@tanstack/react-table'

import Link from 'next/link'

import ColoredBadge from '@/components/badges/ColoredBadge'
import { getRaffleStatusBadgeClass } from '@/components/badges/badgeStyles'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'
import { TRaffleRow } from '@/types/types'

import RaffleActionsMenu from './RaffleActionsMenu'

export const raffleColumns = (
  guildId: string,
  raffleFeatureBlocked: boolean,
  raffleFeatureBlockMessage: string | null
): ColumnDef<TRaffleRow>[] => [
  createHiddenFilterColumn<TRaffleRow>('search'),
  createHiddenFilterColumn<TRaffleRow>('userId'),
  {
    id: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    accessorKey: 'status',
    size: 88,
    minSize: 88,
    cell: ({ row }) => {
      const status = row.getValue('status') as TRaffleRow['status']
      return (
        <ColoredBadge
          colorClass={getRaffleStatusBadgeClass(status)}
          className="capitalize"
        >
          {status}
        </ColoredBadge>
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
    accessorKey: 'participantCount',
    size: 112,
    minSize: 112,
    cell: ({ row }) => {
      const count = row.getValue('participantCount') as number

      return count > 0 ? (
        <span>{count}</span>
      ) : (
        <span className="text-sm italic text-muted-foreground">None</span>
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
          href={`${guildBasePath(guildId)}/users/${row.original.creatorId}`}
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
