'use client'

import { VisibilityState } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { useEffect, useRef } from 'react'

import { useSearchParams } from 'next/navigation'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination,
  ServerTablePageLayout
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
  guildId: string
  globalSettings: GlobalSettings
  transactions: TTransactionDiscord[]
  transactionCounts: ITransactionCounts
  page: number
  limit: number
  total: number
  gamePnL: number
  cashFlow: number
  hideUserSearch?: boolean
}

const TransactionTable = ({
  guildId,
  globalSettings,
  transactions,
  transactionCounts,
  page,
  limit,
  total,
  gamePnL,
  cashFlow,
  hideUserSearch = false
}: TransactionTableProps) => {
  const defaultVisibility: VisibilityState = {
    betId: false,
    casinoGame: false
  }

  const { table, isLoading, setIsLoading } =
    useServerTable<TTransactionDiscord>({
      data: transactions,
      page,
      limit,
      total,
      columns: transactionsColumns(globalSettings, {
        hideUserColumns: hideUserSearch
      }),

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          page: 1,
          sort: sorting
            .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        const search = hideUserSearch
          ? undefined
          : ((filters.find((f) => f.id === 'username')?.value as
              | string
              | undefined) ?? '')
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
        const filterCasinoGame =
          (
            filters.find((f) => f.id === 'casinoGame')?.value as
              | string[]
              | undefined
          )?.join(',') ?? ''

        const dateRange = filters.find((f) => f.id === 'createdAt')?.value as
          | [string, string]
          | undefined

        debouncedUpdateUrl({
          page: 1,
          ...(hideUserSearch ? {} : { search }),
          adminSearch,
          filterType,
          filterSource,
          filterCasinoGame,
          dateFrom: dateRange?.[0],
          dateTo: dateRange?.[1]
        })
      },

      onPaginationChange: (pagination) => {
        debouncedUpdateUrl({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        })
      },

      onColumnVisibilityChange: (visibility) => {
        const overrides: string[] = []

        Object.entries(visibility).forEach(([key, value]) => {
          const defaultValue = defaultVisibility[key] ?? true

          if (value !== defaultValue) {
            overrides.push(value ? `!${key}` : key)
          }
        })

        debouncedUpdateUrl({
          page: 1,
          view: overrides.length ? overrides.join(',') : undefined
        })
      },

      initialVisibility: defaultVisibility
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
      const search = params.get('search') || ''
      const adminSearch = params.get('adminSearch') || ''
      const filterType = params.get('filterType')?.split(',')
      const filterSource = params.get('filterSource')?.split(',')
      const filterCasinoGame = params.get('filterCasinoGame')?.split(',')
      const dateFrom = params.get('dateFrom') || undefined
      const dateTo = params.get('dateTo') || undefined

      const filters = [
        { id: 'handledByUsername', value: adminSearch || undefined },
        { id: 'type', value: filterType?.length ? filterType : undefined },
        {
          id: 'source',
          value: filterSource?.length ? filterSource : undefined
        },
        {
          id: 'casinoGame',
          value: filterCasinoGame?.length ? filterCasinoGame : undefined
        },
        {
          id: 'createdAt',
          value: dateFrom && dateTo ? [dateFrom, dateTo] : undefined
        }
      ]

      if (!hideUserSearch) {
        filters.unshift({ id: 'username', value: search || undefined })
      }

      return filters
    },
    defaultVisibility
  })

  return (
    <ServerTablePageLayout
      toolbar={
        <TransactionTableFilters
          guildId={guildId}
          table={table}
          counts={transactionCounts}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          userSearchRef={userSearchRef}
          adminSearchRef={adminSearchRef}
          hideUserSearch={hideUserSearch}
        />
      }
      summary={
        <TransactionTableSummary
          globalSettings={globalSettings}
          cashFlow={cashFlow}
          gamePnL={gamePnL}
          counts={transactionCounts}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full table-auto">
        <CustomTableHeader table={table} />
        <CustomTableBody table={table} isLoading={isLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default TransactionTable
