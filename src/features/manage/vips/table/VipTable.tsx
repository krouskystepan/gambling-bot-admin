'use client'

import { PlusIcon } from 'lucide-react'

import { useEffect, useRef } from 'react'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination
} from '@/components/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { TVipChannels } from '@/types/types'

import { vipColumns } from './vipColumns'

type VipTableProps = {
  vips: TVipChannels[]
  page: number
  limit: number
  total: number
  guildId: string
  managerId: string
}

const VipTable = ({
  vips,
  page,
  limit,
  total
  // guildId,
  // managerId
}: VipTableProps) => {
  const { table, isLoading, setIsLoading } = useServerTable<TVipChannels>({
    data: vips,
    page,
    limit,
    total,
    columns: vipColumns(),
    initialSorting: [],
    initialVisibility: {},

    // TODO ADD PAGE RESET, ETC...
    onSortingChange: (sorting) => {
      debouncedUpdateUrl({
        sort: sorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',')
      })
    },

    onColumnFiltersChange: (filters) => {
      const search =
        (filters.find((f) => f.id === 'search')?.value as string | undefined) ??
        ''
      debouncedUpdateUrl({ search })
    },

    onPaginationChange: (pagination) => {
      debouncedUpdateUrl({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize
      })
    }
  })

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, vips])

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const inputRef = useRef<HTMLInputElement>(null)

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
          <CustomTableBody table={table} isLoading={isLoading} />
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
