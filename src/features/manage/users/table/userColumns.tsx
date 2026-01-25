import { ColumnDef, Row } from '@tanstack/react-table'
import { CircleQuestionMark, EllipsisIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import Image from 'next/image'

import {
  bonusBalance,
  depositBalance,
  registerUser,
  resetBalance,
  unregisterUser,
  withdrawBalance
} from '@/actions/database/user.action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn, formatNumberToReadableString } from '@/lib/utils'
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
  onUserUpdated: () => void
}

export const userColumns = ({
  guildId,
  managerId,
  onUserUpdated
}: UserColumnsDeps): ColumnDef<TGuildMemberStatus>[] => [
  // Only for filtering purposes
  {
    id: 'search',
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableColumnFilter: true
  },
  // Actual columns
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
        {row.getValue('username')}
        <br />
        <span className="text-xs text-neutral-500">
          ({row.original.userId})
        </span>
      </p>
    )
  },
  {
    header: 'Nickname',
    accessorKey: 'nickname',
    size: 140,
    filterFn: multiColumnFilter
  },
  {
    header: 'Balance',
    accessorKey: 'balance',
    size: 70,
    cell: ({ row }) =>
      row.original.registered
        ? `${formatNumberToReadableString(row.getValue('balance'))}`
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
        netClass = 'text-green-500'
      } else if (netProfit < 0) {
        netClass = 'text-red-500'
      } else {
        netClass = 'text-white'
      }

      return (
        <span className={cn('font-medium', netClass)}>
          ${formatNumberToReadableString(netProfit)}
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
        <Badge
          variant={isRegistered ? 'default' : 'destructive'}
          className="px-2.5"
        >
          {isRegistered ? 'Registered' : 'Not Registered'}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 60,
    cell: ({ row }) => (
      <RowActions
        row={row}
        guildId={guildId}
        managerId={managerId}
        onUserUpdated={onUserUpdated}
      />
    )
  }
]

function RowActions({
  row,
  guildId,
  managerId,
  onUserUpdated
}: {
  row: Row<TGuildMemberStatus>
  guildId: string
  managerId: string
  onUserUpdated: () => void
}) {
  const [open, setOpen] = useState(false)

  const [alertOpen, setAlertOpen] = useState(false)
  const [balanceModal, setBalanceModal] = useState<
    null | 'deposit' | 'withdraw' | 'reset' | 'bonus'
  >(null)
  const [amount, setAmount] = useState('')

  const handleBalanceAction = async () => {
    const value = parseFloat(amount)
    if (
      (balanceModal === 'deposit' || balanceModal === 'withdraw') &&
      (isNaN(value) || value <= 0)
    ) {
      toast.error('Enter a valid number')
      return
    }

    try {
      if (balanceModal === 'deposit') {
        const result = await depositBalance(
          row.original.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          toast.success(result.message)
          onUserUpdated()
        } else toast.error(result.message)
      } else if (balanceModal === 'withdraw') {
        const result = await withdrawBalance(
          row.original.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          toast.success(result.message)
          onUserUpdated()
        } else toast.error(result.message)
      } else if (balanceModal === 'reset') {
        const result = await resetBalance(
          row.original.userId,
          guildId,
          managerId
        )
        if (result.success) {
          toast.success(result.message)
          onUserUpdated()
        } else toast.error(result.message)
      } else if (balanceModal === 'bonus') {
        const result = await bonusBalance(
          row.original.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          toast.success(result.message)
          onUserUpdated()
        } else toast.error(result.message)
      }
    } catch (err) {
      toast.error('Action failed')
      console.error(err)
    }

    setAmount('')
    setBalanceModal(null)
  }

  const handleRegisterAction = async () => {
    try {
      const result = row.original.registered
        ? await unregisterUser(row.original.userId, guildId, managerId)
        : await registerUser(row.original.userId, guildId, managerId)

      if (result.success) {
        toast.success(result.message)
        onUserUpdated()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to register/unregister user')
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Balance Actions</DropdownMenuLabel>

          {['deposit', 'withdraw', 'bonus', 'reset'].map((action) => {
            const labels: Record<string, string> = {
              deposit: 'Deposit',
              withdraw: 'Withdraw',
              bonus: 'Bonus',
              reset: 'Reset'
            }

            const descriptions: Record<string, string> = {
              deposit: 'Add balance to user account.',
              withdraw: 'Remove balance from user account.',
              reset: 'Reset user balance (delete all transactions).',
              bonus: 'Give a bonus to user account.'
            }

            return (
              <DropdownMenuItem
                key={action}
                onClick={() =>
                  setBalanceModal(
                    action as 'deposit' | 'withdraw' | 'reset' | 'bonus'
                  )
                }
                disabled={!row.original.registered}
                className="flex items-center justify-between"
              >
                {labels[action]}
                <Tooltip>
                  <TooltipTrigger className="ml-2 text-gray-400 transition hover:text-gray-600">
                    <CircleQuestionMark size={16} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="mb-1 font-semibold">{labels[action]}</p>
                    <p className="text-sm">{descriptions[action]}</p>
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Registration</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setAlertOpen(true)}
            className="flex items-center justify-between"
          >
            {row.original.registered ? 'Unregister' : 'Register'}
            <Tooltip>
              <TooltipTrigger className="ml-2 text-gray-400 transition hover:text-gray-600">
                <CircleQuestionMark size={16} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="mb-1 font-semibold">
                  {row.original.registered ? 'Unregister' : 'Register'}
                </p>
                <p className="text-sm">
                  {row.original.registered
                    ? 'Unregister user (will delete from database).'
                    : 'Register user in the system.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!balanceModal} onOpenChange={() => setBalanceModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {balanceModal
                ? balanceModal.charAt(0).toUpperCase() + balanceModal.slice(1)
                : ''}{' '}
              for {row.original.username}
            </DialogTitle>
            <DialogDescription>
              {balanceModal === 'reset'
                ? 'This will reset the balance to 0.'
                : 'Enter the amount:'}
            </DialogDescription>
          </DialogHeader>

          {balanceModal !== 'reset' && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="my-2 w-full rounded border p-2"
              placeholder="Enter amount"
            />
          )}

          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleBalanceAction}>
              {balanceModal
                ? balanceModal.charAt(0).toUpperCase() + balanceModal.slice(1)
                : ''}{' '}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Alert */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.{' '}
              {row.original.registered
                ? 'The user will be unregistered.'
                : 'The user will be registered.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleRegisterAction()
                setAlertOpen(false)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
