import { ColumnDef, Row } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'

import Image from 'next/image'
import Link from 'next/link'

import ColoredBadge from '@/components/badges/ColoredBadge'
import { getUserProfileBadgeClass } from '@/components/badges/badgeStyles'
import UserActionsMenu from '@/features/manage/users/profile/UserActionsMenu'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { formatOptionalText } from '@/lib/table/formatOptionalText'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'
import { cn } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

const multiColumnFilter = (
  row: Row<TGuildMemberStatus>,
  columnId: string,
  filterValue: string
) => {
  const searchableContent = `${row.original.username} ${
    row.original.nickname ?? ''
  } ${row.original.userId}`.toLowerCase()
  return searchableContent.includes(filterValue.toLowerCase())
}

interface UserColumnsDeps {
  guildId: string
  managerId: string
  globalSettings: GlobalSettings
  isGuildAdmin: boolean
  onUserUpdated: () => void
}

export const userColumns = ({
  guildId,
  managerId,
  globalSettings,
  isGuildAdmin,
  onUserUpdated
}: UserColumnsDeps): ColumnDef<TGuildMemberStatus>[] => [
  createHiddenFilterColumn<TGuildMemberStatus>('search'),
  {
    header: 'Avatar',
    accessorKey: 'avatar',
    enableSorting: false,
    enableColumnFilter: false,
    size: 45,
    cell: ({ row }) => (
      <Image
        className="rounded-full"
        width={36}
        height={36}
        alt={row.getValue('username')}
        src={row.getValue('avatar')}
      />
    )
  },
  {
    header: 'Username',
    accessorKey: 'username',
    size: 120,
    filterFn: multiColumnFilter,
    cell: ({ row }) => (
      <p>
        <Link
          href={`/dashboard/g/${guildId}/users/${row.original.userId}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {row.getValue('username')}
        </Link>
        <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.userId})
        </span>
      </p>
    )
  },
  {
    header: 'Nickname',
    accessorKey: 'nickname',
    size: 140,
    filterFn: multiColumnFilter,
    cell: ({ row }) => formatOptionalText(row.original.nickname)
  },
  {
    header: 'Balance',
    accessorKey: 'balance',
    size: 70,
    cell: ({ row }) =>
      row.original.registered
        ? formatGuildMoney(row.getValue('balance') as number, globalSettings)
        : '-'
  },
  {
    header: 'Profit/Loss',
    accessorKey: 'netProfit',
    size: 70,
    cell: ({ row }) => {
      if (!row.original.registered) return '-'

      const netProfit = row.getValue('netProfit') as number

      let netClass = ''
      if (netProfit > 0) {
        netClass = 'text-green-600'
      } else if (netProfit < 0) {
        netClass = 'text-red-600'
      } else {
        netClass = 'text-foreground'
      }

      return (
        <span className={cn('font-medium', netClass)}>
          {formatGuildMoney(netProfit, globalSettings)}
        </span>
      )
    }
  },
  {
    header: 'Registered At',
    accessorKey: 'registeredAt',
    size: 110,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => {
      const dateString = row.getValue('registeredAt') as string | null
      return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
    }
  },
  {
    header: 'Registered',
    accessorKey: 'registered',
    size: 90,
    cell: ({ row }) => {
      const isRegistered = row.getValue('registered')
      return (
        <ColoredBadge
          colorClass={getUserProfileBadgeClass(
            isRegistered ? 'registered' : 'notRegistered'
          )}
        >
          {isRegistered ? 'Registered' : 'Not Registered'}
        </ColoredBadge>
      )
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 60,
    cell: ({ row }) => (
      <UserActionsMenu
        guildId={guildId}
        managerId={managerId}
        user={row.original}
        globalSettings={globalSettings}
        isGuildAdmin={isGuildAdmin}
        onUserUpdated={onUserUpdated}
      />
    )
  }
]
