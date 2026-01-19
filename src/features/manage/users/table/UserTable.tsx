'use client'

import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

import { useEffect, useRef, useState } from 'react'

import { useSearchParams } from 'next/dist/client/components/navigation'

import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { formatNumberToReadableString } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

import UserTableBody from './UserTableBody'
import UserTableFooter from './UserTableFooter'
import UserTableHeader from './UserTableHeader'
import UserTablePagination from './UserTablePagination'
import UsersTableFilters from './UsersTableFilters'
import { userColumns } from './userColumns'

type UserTableProps = {
  users: TGuildMemberStatus[]
  page: number
  limit: number
  total: number
  guildId: string
  managerId: string
}

const UserTable = ({
  users,
  page,
  limit,
  total,
  guildId,
  managerId
}: UserTableProps) => {
  const [data, setData] = useState(users)

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: limit
  })
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'balance',
      desc: true
    }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility] = useState<VisibilityState>({
    search: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  useEffect(() => {
    setData(users)
    setIsLoading(false)
  }, [users])

  const searchParams = useSearchParams()

  const searchRef = useRef<HTMLInputElement>(null)

  const table = useReactTable({
    data,
    columns: userColumns({ guildId, managerId, setData }),
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      const sort = next
        .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
        .join(',')
      debouncedUpdateUrl({ sort })
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(columnFilters) : updater

      setColumnFilters(next)

      const search =
        (next.find((f) => f.id === 'search')?.value as string | undefined) ?? ''

      debouncedUpdateUrl({ search })
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(next)
      debouncedUpdateUrl({ page: next.pageIndex + 1, limit: next.pageSize })
    },
    pageCount: Math.ceil(total / limit),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel()
  })

  useEffect(() => {
    const pageFromUrl = Number(searchParams?.get('page') || 1)
    const limitFromUrl = Number(searchParams?.get('limit') || 10)
    const search = searchParams?.get('search') || ''

    table.setPageIndex(pageFromUrl - 1)
    table.setPageSize(limitFromUrl)
    table.setColumnFilters(search ? [{ id: 'search', value: search }] : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <UsersTableFilters
        table={table}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        searchRef={searchRef}
      />

      <div className="overflow-hidden rounded-md border">
        <Table className="w-full table-auto">
          <UserTableHeader table={table} />
          <UserTableBody table={table} isLoading={isLoading} />
          <UserTableFooter
            totalBalanceStr={totalBalanceStr}
            totalNetProfit={totalNetProfit}
            totalProfitStr={totalProfitStr}
            data={data}
          />
        </Table>
      </div>

      <UserTablePagination table={table} total={total} />
    </div>
  )
}

export default UserTable
