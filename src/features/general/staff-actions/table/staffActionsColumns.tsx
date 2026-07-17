import { ColumnDef } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { CircleQuestionMark } from 'lucide-react'

import Image from 'next/image'
import Link from 'next/link'

import type { StaffActionRow } from '@/actions/database/staffActions.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { formatOptionalText } from '@/lib/table/formatOptionalText'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'

import { getStaffActionBadgeStyle } from './staffActionsBadges'

const metaFormatters: Record<string, (value: unknown) => string> = {
  action: (value) => `Action: ${value}`,
  durationDays: (value) => `Duration: ${value} days`,
  adminAction: (value) => `Admin Action: ${value}`,
  bonusStreak: (value) => `Streak: ${value} days`,
  bypassUsed: (value) => `Bypass Used: ${value ? 'Yes' : 'No'}`,
  purchaseId: (value) => `Purchase ID: ${value}`,
  channelId: (value) => `Channel ID: ${value}`,
  addedUserId: (value) => `Added User ID: ${value}`,
  removedUserId: (value) => `Removed User ID: ${value}`,
  requestId: (value) => `Request ID: ${value}`,
  drawId: (value) => `Draw ID: ${value}`,
  raffleId: (value) => `Raffle ID: ${value}`,
  predictionId: (value) => `Prediction ID: ${value}`,
  title: (value) => `Title: ${value}`,
  winnerChoice: (value) => `Winner: ${value}`,
  refundCount: (value) => `Refunds: ${value}`,
  requestedAmount: (value) => `Requested Amount: ${value}`,
  type: (value) => `Type: ${value}`,
  notes: (value) => `Notes: ${value}`
}

export const staffActionsColumns = (
  guildId: string,
  globalSettings: GlobalSettings
): ColumnDef<StaffActionRow>[] => [
  createHiddenFilterColumn<StaffActionRow>('search'),
  createHiddenFilterColumn<StaffActionRow>('staffId'),
  createHiddenFilterColumn<StaffActionRow>('category'),
  createHiddenFilterColumn<StaffActionRow>('occurredAt'),
  {
    header: 'Time',
    accessorKey: 'occurredAt',
    enableSorting: false,
    size: 160,
    cell: ({ row }) => new Date(row.getValue('occurredAt')).toLocaleString('cs')
  },
  {
    header: 'Handled By',
    accessorKey: 'actorUsername',
    enableSorting: false,
    size: 130,
    cell: ({ row }) => (
      <div>
        {row.original.actorUsername ?? 'Unknown'}
        <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.actorId})
        </span>
      </div>
    )
  },
  {
    header: 'Type',
    accessorKey: 'actionBadge',
    enableSorting: false,
    size: 80,
    cell: ({ row }) => {
      const meta = row.original.meta ?? {}
      const isNoteAction = row.original.actionBadge === 'NOTE'
      const tooltipMeta = Object.entries(meta).filter(
        ([key]) => !isNoteAction || key !== 'notes'
      )
      const hasMeta = tooltipMeta.length > 0
      const sublabel = row.original.actionSublabel
      const showTooltip = hasMeta || Boolean(sublabel)

      return (
        <div className="flex items-center justify-start gap-1 select-none">
          <ColoredBadge
            colorClass={getStaffActionBadgeStyle(row.original.actionBadge)}
          >
            {row.original.actionBadge}
          </ColoredBadge>

          {showTooltip ? (
            <Tooltip>
              <TooltipTrigger className="text-muted-foreground">
                <CircleQuestionMark size={16} />
              </TooltipTrigger>
              <TooltipContent>
                {sublabel && !hasMeta ? <p>Action: {sublabel}</p> : null}
                {tooltipMeta.map(([key, value]) => {
                  const formatter = metaFormatters[key]
                  if (formatter) return <p key={key}>{formatter(value)}</p>

                  return (
                    <p key={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:{' '}
                      {String(value)}
                    </p>
                  )
                })}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      )
    }
  },
  {
    header: 'Avatar',
    accessorKey: 'subjectAvatar',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    size: 45,
    cell: ({ row }) => (
      <Image
        className="ml-2 rounded-full"
        width={36}
        height={36}
        alt={row.original.subjectUsername ?? 'User'}
        src={row.original.subjectAvatar ?? '/default-avatar.jpg'}
      />
    )
  },
  {
    header: 'Username',
    accessorKey: 'subjectUsername',
    enableHiding: false,
    enableSorting: false,
    size: 130,
    cell: ({ row }) => (
      <div>
        <Link
          href={`${guildBasePath(guildId)}/users/${row.original.subjectUserId}`}
          className="hover:underline"
        >
          {row.original.subjectUsername ?? 'Unknown'}
        </Link>
        <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.subjectUserId})
        </span>
      </div>
    )
  },
  {
    header: 'Nickname',
    accessorKey: 'subjectNickname',
    enableHiding: false,
    enableSorting: false,
    size: 120,
    cell: ({ row }) => formatOptionalText(row.original.subjectNickname)
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
    enableSorting: false,
    size: 100,
    cell: ({ row }) => {
      const amount = row.original.amount
      if (amount == null || amount === 0) return '-'
      return formatGuildMoney(amount, globalSettings)
    }
  },
  {
    header: 'Notes',
    accessorKey: 'notes',
    enableSorting: false,
    size: 180,
    cell: ({ row }) => {
      const notes = row.original.notes
      if (!notes) return '-'

      const truncated = notes.length > 48 ? `${notes.slice(0, 48)}…` : notes

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="line-clamp-2 cursor-default text-sm">
              {truncated}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">{notes}</TooltipContent>
        </Tooltip>
      )
    }
  },
  {
    header: 'Details',
    id: 'details',
    enableSorting: false,
    size: 90,
    cell: ({ row }) =>
      row.original.detailHref ? (
        <Link
          href={row.original.detailHref}
          className="text-sm text-primary hover:underline"
        >
          View
        </Link>
      ) : (
        '-'
      )
  }
]
