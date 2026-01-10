'use client'

import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleQuestionMark,
  EllipsisIcon
} from 'lucide-react'
import { toast } from 'sonner'

import { useRef, useState } from 'react'

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
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn, formatNumberToReadableString } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

interface UserTableProps {
  users: TGuildMemberStatus[]
  guildId: string
  managerId: string
}

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

const UserTable = ({ users, guildId, managerId }: UserTableProps) => {
  const [data, setData] = useState(users)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'balance',
      desc: true
    }
  ])
  const inputRef = useRef<HTMLInputElement>(null)

  const columns: ColumnDef<TGuildMemberStatus>[] = [
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
      size: 90,
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
            className={
              isRegistered
                ? 'bg-green-600 text-gray-100'
                : 'bg-red-600 text-gray-100'
            }
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
          setData={setData}
        />
      )
    }
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const totalBalance = data
    .filter((u) => u.registered)
    .reduce((acc, u) => acc + (u.balance || 0), 0)

  const totalNetProfit = data
    .filter((u) => u.registered)
    .reduce((acc, u) => acc + (u.netProfit || 0), 0)

  const totalBalanceStr = `$${formatNumberToReadableString(totalBalance)}`
  const totalProfitStr = `$${formatNumberToReadableString(totalNetProfit)}`

  return (
    <div className="w-5xl space-y-4">
      <Input
        ref={inputRef}
        placeholder="Search by username, nickname or ID..."
        onChange={(e) =>
          table.getColumn('username')?.setFilterValue(e.target.value)
        }
        className="mb-4 max-w-xs"
      />

      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className="flex cursor-pointer items-center gap-2 select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUpIcon className="h-4 w-4" />,
                          desc: <ChevronDownIcon className="h-4 w-4" />
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-medium">
                Overall Stats
              </TableCell>
              <TableCell className="text-left font-medium">
                {totalBalanceStr}
              </TableCell>
              <TableCell
                className={cn(
                  'text-left font-medium',
                  totalNetProfit > 0
                    ? 'text-green-500'
                    : totalNetProfit < 0
                      ? 'text-red-500'
                      : 'text-white'
                )}
              >
                {totalProfitStr}
              </TableCell>
              <TableCell />
              <TableCell>
                <span className="ml-1">{`${
                  data.filter((u) => u.registered).length
                }/${users.length}`}</span>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-8">
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <p
            className="text-muted-foreground text-sm whitespace-nowrap"
            aria-live="polite"
          >
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{' '}
            of{' '}
            <span className="text-foreground">
              {table.getRowCount().toString()}
            </span>
          </p>
        </div>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

function RowActions({
  row,
  guildId,
  managerId,
  setData
}: {
  row: Row<TGuildMemberStatus>
  guildId: string
  managerId: string
  setData: React.Dispatch<React.SetStateAction<TGuildMemberStatus[]>>
}) {
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>(
    {}
  )

  const toggleDropdown = (userId: string, open: boolean) => {
    setDropdownStates((prev) => ({ ...prev, [userId]: open }))
  }
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
          setData((prev) =>
            prev.map((u) =>
              u.userId === row.original.userId
                ? { ...u, balance: (u.balance || 0) + value }
                : u
            )
          )
          toast.success(result.message)
        } else toast.error(result.message)
      } else if (balanceModal === 'withdraw') {
        const result = await withdrawBalance(
          row.original.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          setData((prev) =>
            prev.map((u) =>
              u.userId === row.original.userId
                ? { ...u, balance: (u.balance || 0) - value }
                : u
            )
          )
          toast.success(result.message)
        } else toast.error(result.message)
      } else if (balanceModal === 'reset') {
        const result = await resetBalance(
          row.original.userId,
          guildId,
          managerId
        )
        if (result.success) {
          setData((prev) =>
            prev.map((u) =>
              u.userId === row.original.userId
                ? { ...u, balance: 0, netProfit: 0 }
                : u
            )
          )
          toast.success(result.message)
        } else toast.error(result.message)
      } else if (balanceModal === 'bonus') {
        const result = await bonusBalance(
          row.original.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          setData((prev) =>
            prev.map((u) =>
              u.userId === row.original.userId
                ? { ...u, balance: (u.balance || 0) + value }
                : u
            )
          )
          toast.success(result.message)
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
        setData((prev) =>
          prev.map((u) =>
            u.userId === row.original.userId
              ? {
                  ...u,
                  registered: !u.registered,
                  registeredAt: !u.registered ? new Date() : null
                }
              : u
          )
        )
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to register/unregister user')
    }
  }

  return (
    <>
      <DropdownMenu
        open={!!dropdownStates[row.original.userId]}
        onOpenChange={(open) => toggleDropdown(row.original.userId, open)}
      >
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

export default UserTable
