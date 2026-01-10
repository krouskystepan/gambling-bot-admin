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

import { useSearchParams } from 'next/navigation'

import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import TransactionTableBody from './TransactionTableBody'
import TransactionTableFilters from './TransactionTableFilters'
import TransactionTableHeader from './TransactionTableHeader'
import TransactionTablePagination from './TransactionTablePagination'
import TransactionTableSummary from './TransactionTableSummary'
import { transactionsColumns } from './transactionColumns'

interface TransactionTableProps {
  transactions: TTransactionDiscord[]
  transactionCounts: ITransactionCounts
  guildId: string
  managerId: string
  page: number
  limit: number
  total: number
  gamePnL: number
  cashFlow: number
}

const TransactionTable = ({
  transactions,
  transactionCounts,
  // guildId,
  // managerId,
  page,
  limit,
  total,
  gamePnL,
  cashFlow
}: TransactionTableProps) => {
  const [data, setData] = useState(transactions)

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: limit
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    betId: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const userSearchRef = useRef<HTMLInputElement>(null)
  const adminSearchRef = useRef<HTMLInputElement>(null)

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  useEffect(() => {
    setData(transactions)
    setIsLoading(false)
  }, [transactions])

  const searchParams = useSearchParams()

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((t) => t.id !== id))
  }

  const table = useReactTable({
    data,
    columns: transactionsColumns(handleDelete),
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility
    },
    onColumnVisibilityChange: setColumnVisibility,
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

      const searchFilter =
        (next.find((f) => f.id === 'username')?.value as string | undefined) ??
        ''
      const adminSearchFilter =
        (next.find((f) => f.id === 'handledByUsername')?.value as
          | string
          | undefined) ?? ''
      const typeFilter =
        (
          next.find((f) => f.id === 'type')?.value as string[] | undefined
        )?.join(',') ?? ''
      const sourceFilter =
        (
          next.find((f) => f.id === 'source')?.value as string[] | undefined
        )?.join(',') ?? ''
      const dateRangeFilter = next.find((f) => f.id === 'createdAt')?.value as
        | [string, string]
        | undefined

      debouncedUpdateUrl({
        search: searchFilter,
        adminSearch: adminSearchFilter,
        filterType: typeFilter,
        filterSource: sourceFilter,
        dateFrom: dateRangeFilter?.[0],
        dateTo: dateRangeFilter?.[1]
      })
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
    const adminSearch = searchParams?.get('adminSearch') || ''

    const filterType = searchParams?.get('filterType')?.split(',') || undefined
    const filterSource =
      searchParams?.get('filterSource')?.split(',') || undefined

    const dateFrom = searchParams?.get('dateFrom')
      ? searchParams.get('dateFrom')
      : undefined
    const dateTo = searchParams?.get('dateTo')
      ? searchParams.get('dateTo')
      : undefined

    const filters: { id: string; value: string[] | string | undefined }[] = [
      { id: 'username', value: search || undefined },
      { id: 'handledByUsername', value: adminSearch || undefined },
      { id: 'type', value: filterType?.length ? filterType : undefined },
      { id: 'source', value: filterSource?.length ? filterSource : undefined },
      {
        id: 'createdAt',
        value: dateFrom && dateTo ? [dateFrom, dateTo] : undefined
      }
    ]

    table.setPageIndex(pageFromUrl - 1)
    table.setPageSize(limitFromUrl)

    table.setColumnFilters(filters)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-7xl space-y-4">
      <TransactionTableFilters
        table={table}
        counts={transactionCounts}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        userSearchRef={userSearchRef}
        adminSearchRef={adminSearchRef}
      />

      <div className="overflow-hidden rounded-md border">
        <Table className="w-full table-auto">
          <TransactionTableHeader table={table} />
          <TransactionTableBody table={table} isLoading={isLoading} />
        </Table>
      </div>

      <TransactionTableSummary
        cashFlow={cashFlow}
        gamePnL={gamePnL}
        counts={transactionCounts}
      />

      <TransactionTablePagination table={table} total={total} />
    </div>
  )
}

export default TransactionTable
