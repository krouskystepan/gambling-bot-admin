import { ColumnDef } from '@tanstack/react-table'
import { CircleQuestionMark } from 'lucide-react'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { TPredictionRow } from '@/types/types'

import PredictionActionsMenu from '../components/PredictionActionsMenu'

const statusBadgeClass: Record<TPredictionRow['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ended: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  paying: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  paid: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  canceled: 'bg-red-500/15 text-red-700 dark:text-red-400'
}

export const predictionColumns = (
  guildId: string,
  predictionFeatureBlocked: boolean,
  predictionFeatureBlockMessage: string | null,
  logsChannelConfigured: boolean
): ColumnDef<TPredictionRow>[] => [
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
    header: () => <span className="whitespace-nowrap">Title</span>,
    accessorKey: 'title',
    size: 180,
    minSize: 180,
    cell: ({ row }) => (
      <p>
        <span className="font-medium">{row.getValue('title')}</span>
        <br />
        <span className="text-xs text-muted-foreground line-clamp-1">
          {row.original.predictionId}
        </span>
      </p>
    )
  },
  {
    id: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    accessorKey: 'status',
    size: 88,
    minSize: 88,
    cell: ({ row }) => {
      const status = row.getValue('status') as TPredictionRow['status']
      return (
        <Badge className={`${statusBadgeClass[status]} px-2 capitalize`}>
          {status}
        </Badge>
      )
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Choices</span>,
    accessorKey: 'choicesEnriched',
    size: 112,
    minSize: 112,
    cell: ({ row }) => {
      const choices = row.getValue(
        'choicesEnriched'
      ) as TPredictionRow['choicesEnriched']

      return (
        <span className="flex items-center justify-start">
          <span>{choices.length}</span>
          <Tooltip>
            <TooltipTrigger className="ml-2 text-muted-foreground transition hover:text-foreground">
              <CircleQuestionMark size={16} />
            </TooltipTrigger>
            <TooltipContent>
              <ScrollArea className="h-fit p-1">
                {choices.map((choice) => (
                  <p key={choice.choiceName} className="text-sm">
                    {choice.choiceName} — {choice.odds}x
                  </p>
                ))}
              </ScrollArea>
            </TooltipContent>
          </Tooltip>
        </span>
      )
    }
  },
  {
    header: () => <span className="whitespace-nowrap">Total bets</span>,
    accessorKey: 'totalBetAmount',
    size: 104,
    minSize: 104,
    cell: ({ row }) => formatGuildMoney(row.getValue('totalBetAmount'))
  },
  {
    header: () => <span className="whitespace-nowrap">Bettors</span>,
    accessorKey: 'bettorCount',
    size: 88,
    minSize: 88
  },
  {
    header: () => <span className="whitespace-nowrap">Autolock</span>,
    accessorKey: 'autolock',
    size: 148,
    minSize: 148,
    cell: ({ row }) => {
      const autolock = row.original.autolock
      return autolock ? new Date(autolock).toLocaleString('cs-CZ') : '-'
    }
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
    id: 'actions',
    header: () => <span className="whitespace-nowrap">Actions</span>,
    size: 72,
    minSize: 72,
    enableSorting: false,
    cell: ({ row }) => (
      <PredictionActionsMenu
        guildId={guildId}
        prediction={row.original}
        predictionFeatureBlocked={predictionFeatureBlocked}
        predictionFeatureBlockMessage={predictionFeatureBlockMessage}
        logsChannelConfigured={logsChannelConfigured}
      />
    )
  }
]
