import { ColumnDef } from '@tanstack/react-table'

import Image from 'next/image'
import Link from 'next/link'

import type { GuildBanRow } from '@/actions/database/guildBans.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getBanLogStatusBadgeClass } from '@/components/badges/badgeStyles'
import ModerationEventLine from '@/features/manage/moderation/ModerationEventLine'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'

import BanActionsMenu from './BanActionsMenu'

export const banColumns = (guildId: string): ColumnDef<GuildBanRow>[] => [
  createHiddenFilterColumn<GuildBanRow>('userId'),
  {
    id: 'user',
    header: () => <span className="whitespace-nowrap">User</span>,
    accessorKey: 'username',
    enableSorting: false,
    size: 180,
    minSize: 160,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Image
          className="rounded-full"
          width={36}
          height={36}
          alt={row.original.username ?? row.original.userId}
          src={row.original.avatar ?? '/default-avatar.jpg'}
        />
        <p>
          <Link
            href={`${guildBasePath(guildId)}/users/${row.original.userId}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {row.original.username ?? 'Unknown'}
          </Link>
          <br />
          <span className="text-xs text-muted-foreground">
            ({row.original.userId})
          </span>
        </p>
      </div>
    )
  },
  {
    id: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    accessorFn: (row) => (row.unbannedAt ? 'ended' : 'active'),
    enableSorting: false,
    size: 96,
    minSize: 88,
    cell: ({ row }) => {
      const status = row.original.unbannedAt ? 'ended' : 'active'
      return (
        <ColoredBadge
          colorClass={getBanLogStatusBadgeClass(status)}
          className="capitalize"
        >
          {status}
        </ColoredBadge>
      )
    }
  },
  {
    id: 'bannedAt',
    header: () => <span className="whitespace-nowrap">Banned</span>,
    accessorKey: 'bannedAt',
    size: 280,
    minSize: 220,
    cell: ({ row }) => (
      <ModerationEventLine
        label="Ban"
        when={row.original.bannedAt}
        staffName={row.original.bannedByUsername}
        staffId={row.original.bannedBy}
        detail={row.original.banReason}
        tone="ban"
      />
    )
  },
  {
    id: 'unbannedAt',
    header: () => <span className="whitespace-nowrap">Unbanned</span>,
    accessorKey: 'unbannedAt',
    enableSorting: false,
    size: 280,
    minSize: 220,
    cell: ({ row }) =>
      row.original.unbannedAt ? (
        <ModerationEventLine
          label="Unban"
          when={row.original.unbannedAt}
          staffName={row.original.unbannedByUsername}
          staffId={row.original.unbannedBy ?? '-'}
          detail={row.original.unbanReason}
          tone="unban"
        />
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
  },
  {
    id: 'actions',
    header: () => <span className="whitespace-nowrap">Actions</span>,
    size: 72,
    minSize: 72,
    enableSorting: false,
    cell: ({ row }) => <BanActionsMenu guildId={guildId} ban={row.original} />
  }
]
