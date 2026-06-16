import { ColumnDef } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { TAtmRequestDiscord } from '@/types/types'

import AtmQueueActions from './AtmQueueActions'
import { statusBadgeMap, typeBadgeMap } from './atmQueueBadges'

export const atmQueueColumns = (
  guildId: string,
  globalSettings: GlobalSettings,
  isGuildAdmin: boolean
): ColumnDef<TAtmRequestDiscord>[] => [
  {
    id: 'userId',
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableColumnFilter: true
  },
  {
    header: 'Avatar',
    accessorKey: 'avatar',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    size: 45,
    cell: ({ row }) => (
      <Image
        className="ml-2 rounded-full"
        width={36}
        height={36}
        alt={row.original.username}
        src={row.original.avatar}
      />
    )
  },
  {
    header: 'Username',
    accessorKey: 'username',
    enableHiding: false,
    enableSorting: false,
    size: 130,
    cell: ({ row }) => (
      <div>
        {row.getValue('username')} <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.userId})
        </span>
      </div>
    )
  },
  {
    header: 'Nickname',
    accessorKey: 'nickname',
    enableHiding: false,
    enableSorting: false,
    size: 120,
    cell: ({ row }) => row.getValue('nickname') ?? '-'
  },
  {
    header: 'Type',
    accessorKey: 'type',
    enableSorting: false,
    size: 90,
    cell: ({ row }) => {
      const type = row.getValue('type') as TAtmRequestDiscord['type']
      return (
        <Badge className={`${typeBadgeMap[type]} px-2 select-none`}>
          {type.toUpperCase()}
        </Badge>
      )
    }
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
    enableHiding: false,
    size: 90,
    cell: ({ row }) =>
      formatGuildMoney(row.getValue('amount') as number, globalSettings)
  },
  {
    header: 'Account',
    accessorKey: 'account',
    enableSorting: false,
    size: 140,
    cell: ({ row }) => (
      <p className="wrap-anywhere">{row.getValue('account') as string}</p>
    )
  },
  {
    header: 'Status',
    accessorKey: 'status',
    enableSorting: false,
    size: 100,
    cell: ({ row }) => {
      const status = row.getValue('status') as TAtmRequestDiscord['status']
      return (
        <Badge className={`${statusBadgeMap[status]} px-2 select-none`}>
          {status.toUpperCase()}
        </Badge>
      )
    }
  },
  {
    header: 'Handled By',
    accessorKey: 'handledByUsername',
    enableSorting: false,
    size: 120,
    cell: ({ row }) =>
      row.getValue('handledByUsername') ? (
        <div>
          {row.getValue('handledByUsername')}
          <br />
          <span className="text-xs text-muted-foreground">
            ({row.original.handledBy})
          </span>
        </div>
      ) : (
        '-'
      )
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    size: 140,
    cell: ({ row }) =>
      new Date(row.getValue('createdAt') as string).toLocaleString('cs')
  },
  {
    header: 'Notes',
    accessorKey: 'notes',
    enableSorting: false,
    size: 160,
    cell: ({ row }) => (row.getValue('notes') as string | undefined) ?? '-'
  },
  {
    header: 'Audit',
    id: 'audit',
    enableSorting: false,
    size: 90,
    cell: ({ row }) =>
      row.original.status === 'approved' ? (
        <Link
          href={`/dashboard/g/${guildId}/transactions?adminSearch=${row.original.requestId}`}
          className="text-sm text-primary hover:underline"
        >
          View tx
        </Link>
      ) : (
        '-'
      )
  },
  {
    header: 'Actions',
    id: 'actions',
    enableSorting: false,
    enableHiding: false,
    size: 160,
    cell: ({ row }) => (
      <AtmQueueActions
        guildId={guildId}
        request={row.original}
        globalSettings={globalSettings}
        isGuildAdmin={isGuildAdmin}
      />
    )
  }
]
