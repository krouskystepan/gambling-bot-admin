'use client'

import { useEffect, useRef } from 'react'

import { useSearchParams } from 'next/navigation'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination
} from '@/components/table'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useHydrateServerTableFromUrl } from '@/hooks/useHydrateServerTableFromUrl'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import TransactionTableFilters from './TransactionTableFilters'
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
  const isHydratingRef = useRef(false)

  const { table, isLoading, setIsLoading } =
    useServerTable<TTransactionDiscord>({
      data: transactions,
      page,
      limit,
      total,
      columns: transactionsColumns(),

      onSortingChange: (sorting) => {
        const sort = sorting
          .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
          .join(',')

        debouncedUpdateUrl({ sort })
      },

      onColumnFiltersChange: (filters) => {
        if (isHydratingRef.current) return

        const search =
          (filters.find((f) => f.id === 'username')?.value as
            | string
            | undefined) ?? ''
        const adminSearch =
          (filters.find((f) => f.id === 'handledByUsername')?.value as
            | string
            | undefined) ?? ''

        const filterType =
          (
            filters.find((f) => f.id === 'type')?.value as string[] | undefined
          )?.join(',') ?? ''
        const filterSource =
          (
            filters.find((f) => f.id === 'source')?.value as
              | string[]
              | undefined
          )?.join(',') ?? ''

        const dateRange = filters.find((f) => f.id === 'createdAt')?.value as
          | [string, string]
          | undefined

        debouncedUpdateUrl({
          search,
          adminSearch,
          filterType,
          filterSource,
          dateFrom: dateRange?.[0],
          dateTo: dateRange?.[1]
        })
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
  }, [setIsLoading, transactions])

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const searchParams = useSearchParams()

  const userSearchRef = useRef<HTMLInputElement>(null)
  const adminSearchRef = useRef<HTMLInputElement>(null)

  useHydrateServerTableFromUrl(table, searchParams, {
    filters: (params) => {
      isHydratingRef.current = true

      const search = params.get('search') || ''
      const adminSearch = params.get('adminSearch') || ''
      const filterType = params.get('filterType')?.split(',')
      const filterSource = params.get('filterSource')?.split(',')
      const dateFrom = params.get('dateFrom') || undefined
      const dateTo = params.get('dateTo') || undefined

      const filters = [
        { id: 'username', value: search || undefined },
        { id: 'handledByUsername', value: adminSearch || undefined },
        { id: 'type', value: filterType?.length ? filterType : undefined },
        {
          id: 'source',
          value: filterSource?.length ? filterSource : undefined
        },
        {
          id: 'createdAt',
          value: dateFrom && dateTo ? [dateFrom, dateTo] : undefined
        }
      ]

      setTimeout(() => {
        isHydratingRef.current = false
      }, 0)

      return filters
    }
  })

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
          <CustomTableHeader table={table} />
          <CustomTableBody table={table} isLoading={isLoading} />
        </Table>
      </div>

      <TransactionTableSummary
        cashFlow={cashFlow}
        gamePnL={gamePnL}
        counts={transactionCounts}
      />

      <CustomTablePagination table={table} total={total} />
    </div>
  )
}

export default TransactionTable
