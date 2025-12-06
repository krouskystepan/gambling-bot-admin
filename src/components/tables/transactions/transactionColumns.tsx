import { formatNumberToReadableString } from '@/lib/utils'
import { TTransactionDiscord } from '@/types/types'
import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CircleQuestionMark,
  // Trash
} from 'lucide-react'
import { typeBadgeMap, sourceBadgeMap } from './transactionBadges'
import { TTransaction } from 'gambling-bot-shared'
// import { Button } from '@/components/ui/button'
// import { toast } from 'sonner'
// import { deleteTransaction } from '@/actions/database/transaction.action'
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog'

export const transactionsColumns = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDelete: (id: string) => void
): ColumnDef<TTransactionDiscord>[] => [
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
        alt={row.getValue('username')}
        src={row.getValue('avatar')}
      />
    ),
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
        <span className="text-xs text-neutral-500">
          ({row.original.userId})
        </span>
      </div>
    ),
  },
  {
    header: 'Nickname',
    accessorKey: 'nickname',
    enableHiding: false,
    enableSorting: false,
    size: 120,
  },
  {
    header: 'Type',
    accessorKey: 'type',
    enableSorting: false,
    size: 80,
    cell: ({ row }) => {
      const type = row.getValue('type') as TTransaction['type']
      const className = typeBadgeMap[type] ?? 'bg-gray-600'

      const meta = row.original.meta ?? {}

      const metaFormatters: Record<string, (value: unknown) => string> = {
        action: (value) => `Action: ${value}`,
        durationDays: (value) => `Duration: ${value} days`,
        adminAction: (value) => `Action: admin ${value}`,
        bonusStreak: (value) => `Streak: ${value} days`,
      }

      const hasMeta = Object.keys(meta).length > 0

      return (
        <div className="flex gap-1 justify-start items-center select-none">
          <Badge className={`${className} px-2`}>{type.toUpperCase()}</Badge>

          {hasMeta && (
            <Tooltip>
              <TooltipTrigger className="text-gray-400">
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
    },
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
    enableHiding: false,
    size: 80,
    cell: ({ row }) =>
      `$${formatNumberToReadableString(row.getValue('amount'))}`,
  },
  {
    header: () => (
      <div className="flex items-center gap-1">
        <span>Source</span>
        <Tooltip>
          <TooltipTrigger className="text-gray-400">
            <CircleQuestionMark size={16} />
          </TooltipTrigger>
          <TooltipContent className="max-w-md break-normal space-y-2 p-2">
            <p>Source: Indicates who or what initiated the transaction.</p>
            <ul className="list-disc pl-5 space-y-1 mb-0">
              <li>
                <span className="font-semibold">system</span> - Action triggered
                automatically by the system on behalf of a user (e.g., user
                buying or extending VIP via /vip buy or /vip extend).
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
                <span className="font-semibold">web</span> - Action performed by
                the admin via the web interface.
              </li>
              <li>
                <span className="font-semibold">casino</span> - Action triggered
                by the casino system (bets, wins, refunds, etc.).
              </li>
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>
    ),
    meta: {
      label: 'Source',
    } as {
      label?: string
    },
    accessorKey: 'source',
    enableSorting: false,
    size: 80,
    cell: ({ row }) => {
      const source = row.getValue('source') as TTransaction['source']

      const className = sourceBadgeMap[source] ?? 'bg-gray-600'

      return (
        <Badge className={`${className} px-2 select-none`}>
          {source.toUpperCase()}
        </Badge>
      )
    },
  },
  {
    header: 'Bet ID',
    accessorKey: 'betId',
    size: 120,
    cell: ({ row }) => {
      return (
        <p className="wrap-anywhere">
          {row.getValue('betId') ? row.getValue('betId') : '-'}
        </p>
      )
    },
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
            <span className="text-xs text-neutral-500">
              ({row.original.handledBy})
            </span>
          </div>
        ) : (
          '-'
        )}
      </div>
    ),
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    size: 140,
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleString('cs'),
  },
  // {
  //   id: 'actions',
  //   header: 'Actions',
  //   size: 10,
  //   cell: ({ row }) => (
  //     <AlertDialog>
  //       <AlertDialogTrigger asChild>
  //         <Button size="icon" variant="ghost">
  //           <Trash className="w-5 h-5" />
  //         </Button>
  //       </AlertDialogTrigger>
  //       <AlertDialogContent>
  //         <AlertDialogHeader>
  //           <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
  //           <AlertDialogDescription>
  //             This action cannot be undone. This will permanently delete
  //             transaction.
  //           </AlertDialogDescription>
  //         </AlertDialogHeader>
  //         <AlertDialogFooter>
  //           <AlertDialogCancel>Cancel</AlertDialogCancel>
  //           <AlertDialogAction
  //             onClick={async () => {
  //               try {
  //                 // const result = await deleteTransaction(row.original.id)

  //                 if (result.success) {
  //                   onDelete(row.original.id)
  //                   toast.success(result.message)
  //                 } else {
  //                   toast.error(result.message)
  //                 }
  //               } catch {
  //                 toast.error('Something went wrong!')
  //               }
  //             }}
  //           >
  //             Confirm
  //           </AlertDialogAction>
  //         </AlertDialogFooter>
  //       </AlertDialogContent>
  //     </AlertDialog>
  //   ),
  // },
]
