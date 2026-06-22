import { ColumnDef } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { CircleQuestionMark } from 'lucide-react'

import Image from 'next/image'

import ColoredBadge from '@/components/badges/ColoredBadge'
import {
  getTransactionSourceBadgeClass,
  getTransactionTypeBadgeClass
} from '@/components/badges/badgeStyles'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { formatOptionalText } from '@/lib/table/formatOptionalText'
import {
  createHiddenFilterColumn,
  createManualTableFilterFn
} from '@/lib/table/manualFilterColumn'
import { TTransactionDiscord } from '@/types/types'

export const transactionsColumns = (
  globalSettings: GlobalSettings,
  options?: { hideUserColumns?: boolean }
): ColumnDef<TTransactionDiscord>[] => {
  const columns: ColumnDef<TTransactionDiscord>[] = [
    createHiddenFilterColumn<TTransactionDiscord>('handledBy'),
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
      enableColumnFilter: true,
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
      cell: ({ row }) => formatOptionalText(row.original.nickname)
    },
    {
      header: 'Type',
      id: 'typeDisplay',
      accessorKey: 'type',
      enableSorting: false,
      enableColumnFilter: false,
      size: 80,
      cell: ({ row }) => {
        const type = row.original.type
        const className = getTransactionTypeBadgeClass(type)

        const meta = row.original.meta ?? {}

        const metaFormatters: Record<string, (value: unknown) => string> = {
          action: (value) => `Action: ${value}`,
          durationDays: (value) => `Duration: ${value} days`,
          adminAction: (value) => `Admin Action: ${value}`,
          bonusStreak: (value) => `Streak: ${value} days`,
          bypassUsed: (value) => `Bypass Used: ${value ? 'Yes' : 'No'}`,

          purchaseId: (value) => `Purchase ID: ${value}`,
          channelId: (value) => `Channel ID: ${value}`,
          addedUserId: (value) => `Added User ID: ${value}`,
          removedUserId: (value) => `Removed User ID: ${value}`
        }

        const hasMeta = Object.keys(meta).length > 0

        return (
          <div className="flex items-center justify-start gap-1 select-none">
            <ColoredBadge colorClass={className}>
              {type.toUpperCase()}
            </ColoredBadge>

            {hasMeta && (
              <Tooltip>
                <TooltipTrigger className="text-muted-foreground">
                  <CircleQuestionMark size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  {Object.entries(meta).map(([key, value]) => {
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
            )}
          </div>
        )
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      enableHiding: false,
      size: 80,
      cell: ({ row }) =>
        formatGuildMoney(row.getValue('amount') as number, globalSettings)
    },
    {
      header: () => (
        <div className="flex items-center gap-1">
          <span>Source</span>
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground">
              <CircleQuestionMark size={16} />
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>Source: Indicates who or what initiated the transaction.</p>
              <ul className="mb-0 list-disc space-y-1 pl-5">
                <li>
                  <span className="font-semibold">system</span> - Action
                  triggered automatically by the system on behalf of a user
                  (e.g., user buying or extending VIP via /vip buy or /vip
                  extend).
                </li>
                <li>
                  <span className="font-semibold">command</span> - Action
                  initiated manually by an admin using a command (e.g., gifting
                  VIP to a user).
                </li>
                <li>
                  <span className="font-semibold">manual</span> - Action entered
                  directly by an admin in the interface.
                </li>
                <li>
                  <span className="font-semibold">web</span> - Action performed
                  by the admin via the web interface.
                </li>
                <li>
                  <span className="font-semibold">casino</span> - Action
                  triggered by the casino system (bets, wins, refunds, etc.).
                </li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      meta: {
        label: 'Source'
      } as {
        label?: string
      },
      id: 'sourceDisplay',
      accessorKey: 'source',
      enableSorting: false,
      enableColumnFilter: false,
      size: 80,
      cell: ({ row }) => {
        const source = row.original.source
        const className = getTransactionSourceBadgeClass(source)

        return (
          <ColoredBadge colorClass={className}>
            {source.toUpperCase()}
          </ColoredBadge>
        )
      }
    },
    {
      id: 'referenceId',
      accessorKey: 'referenceId',
      header: 'Reference ID',
      enableColumnFilter: true,
      size: 160,
      cell: ({ row }) => {
        const referenceId = row.getValue('referenceId') as string | undefined
        return (
          <p className="wrap-anywhere">{referenceId ? referenceId : '-'}</p>
        )
      }
    },
    {
      header: 'Handled By',
      accessorKey: 'handledByUsername',
      enableSorting: false,
      size: 120,
      cell: ({ row }) => (
        <div>
          {row.getValue('handledByUsername') ? (
            <div>
              {row.getValue('handledByUsername')}
              <br />
              <span className="text-xs text-muted-foreground">
                ({row.original.handledBy})
              </span>
            </div>
          ) : (
            '-'
          )}
        </div>
      )
    },
    {
      header: 'Created At',
      id: 'createdAtDisplay',
      accessorKey: 'createdAt',
      enableColumnFilter: false,
      size: 140,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('cs')
    },
    {
      id: 'casinoGame',
      accessorFn: (row) => {
        const game = row.meta?.game
        return typeof game === 'string' ? game : undefined
      },
      header: 'Game',
      enableSorting: false,
      enableColumnFilter: true,
      enableHiding: false,
      filterFn: createManualTableFilterFn<TTransactionDiscord>(),
      cell: () => null
    },
    createHiddenFilterColumn<TTransactionDiscord>('type'),
    createHiddenFilterColumn<TTransactionDiscord>('source'),
    createHiddenFilterColumn<TTransactionDiscord>('createdAt')
  ]

  if (options?.hideUserColumns) {
    return columns.filter((col) => {
      const key = 'accessorKey' in col ? col.accessorKey : undefined
      return key !== 'username' && key !== 'nickname'
    })
  }

  return columns
}
