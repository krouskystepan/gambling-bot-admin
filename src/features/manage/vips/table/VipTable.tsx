'use client'

import {
  PaginationState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'

import { useRef, useState } from 'react'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination
} from '@/components/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { TVipChannels } from '@/types/types'

import { vipColumns } from './vipColumns'

type VipTableProps = {
  vips: TVipChannels[]
  guildId: string
  managerId: string
}

const VipTable = ({ vips, guildId, managerId }: VipTableProps) => {
  const [data, setData] = useState(vips)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: vipColumns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const total = data.length

  return (
    <div className="w-5xl space-y-4">
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

      <div className="overflow-hidden rounded-md border">
        <Table className="w-full table-auto">
          <CustomTableHeader table={table} />
          <CustomTableBody table={table} isLoading={false} />
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

        <CustomTablePagination table={table} total={total} />
      </div>
    </div>
  )
}

export default VipTable
