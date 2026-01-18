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
  Menu,
  PlusIcon
} from 'lucide-react'

import { useRef, useState } from 'react'

import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem
} from '@/components/ui/pagination'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
// import { formatNumberToReadableString } from '@/lib/utils'
import { TVipChannels } from '@/types/types'

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from './ui/dropdown-menu'
// import {
//   AlertDialogHeader,
//   AlertDialogFooter,
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogTitle,
// } from './ui/alert-dialog'
// import { toast } from 'sonner'
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from './ui/dialog'

type VipTableProps = {
  vips: TVipChannels[]
  guildId: string
  managerId: string
}

const multiColumnFilter = (
  row: Row<TVipChannels>,
  columnId: string,
  filterValue: string
) => {
  const searchableContent = `${row.original.username} ${
    row.original.nickname ?? ''
  } ${row.original.ownerId}`.toLowerCase()
  return searchableContent.includes(filterValue.toLowerCase())
}

const VipTable = ({ vips, guildId, managerId }: VipTableProps) => {
  const [data, setData] = useState(vips)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const columns: ColumnDef<TVipChannels>[] = [
    {
      header: 'Image',
      accessorKey: 'avatar',
      enableSorting: false,
      enableColumnFilter: false,
      size: 60,
      cell: ({ row }) => (
        <Image
          className="ml-2 rounded-full"
          width={36}
          height={36}
          alt={row.getValue('username')}
          src={row.getValue('avatar')}
        />
      )
    },
    {
      header: 'Channel Name',
      accessorKey: 'channelName',
      size: 140,
      filterFn: multiColumnFilter,
      cell: ({ row }) => (
        <p>
          {row.getValue('channelName')}
          <br />
          <span className="text-xs text-neutral-500 line-clamp-1">
            ({row.original.channelId})
          </span>
        </p>
      )
    },
    {
      header: 'Username',
      accessorKey: 'username',
      size: 160,
      filterFn: multiColumnFilter,
      cell: ({ row }) => (
        <p>
          {row.getValue('username')}
          <br />
          <span className="text-xs text-neutral-500">
            ({row.original.ownerId})
          </span>
        </p>
      )
    },
    {
      header: 'Nickname',
      accessorKey: 'nickname',
      size: 80,
      filterFn: multiColumnFilter,
      cell: ({ row }) => row.getValue('nickname')
    },
    {
      header: 'Members',
      accessorKey: 'members',
      size: 70,
      cell: ({ row }) => {
        const members = row.getValue('members') as TVipChannels['members']

        return (
          <span className="flex justify-start items-center">
            <span>{members.length}</span>
            {members.length > 0 ? (
              <Tooltip>
                <TooltipTrigger className="ml-2 text-gray-400 transition hover:text-gray-600">
                  <CircleQuestionMark size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <ScrollArea className="h-fit p-1">
                    {members.map((member, index) => (
                      <p
                        key={index}
                        className="text-sm flex items-center gap-2"
                      >
                        <Image
                          className="rounded-full"
                          width={20}
                          height={20}
                          alt={member.username}
                          src={member.avatar}
                        />{' '}
                        <span>
                          {member.username} ({member.nickname || 'No nickname'})
                        </span>
                      </p>
                    ))}
                  </ScrollArea>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-sm italic">No members</p>
            )}
          </span>
        )
      }
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      size: 100,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const dateString = row.getValue('createdAt') as string | null
        return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
      }
    },
    {
      header: 'Expires At',
      accessorKey: 'expiresAt',
      size: 100,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const dateString = row.getValue('expiresAt') as string | null
        return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 60,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cell: ({ row }) => <Menu />
      // <RowActions
      //   row={row}
      //   guildId={guildId}
      //   managerId={managerId}
      //   setData={setData}
      // />
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

  return (
    <div className="w-6xl space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          ref={inputRef}
          placeholder="Search by username, nickname, channel or IDs..."
          onChange={(e) =>
            table.getColumn('username')?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
        <Button className="ml-auto" variant="outline">
          <PlusIcon className="-ms-1 opacity-60" size={16} />
          Add user
        </Button>
      </div>

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

export default VipTable
