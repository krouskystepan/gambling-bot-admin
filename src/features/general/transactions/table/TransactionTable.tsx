'use client'

import { VisibilityState } from '@tanstack/react-table'
import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { useEffect, useMemo } from 'react'

import { useSearchParams } from 'next/navigation'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination,
  ServerTablePageLayout
} from '@/components/table'
import type { SearchableUserOption } from '@/components/table/SearchableUserFilter'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { usePruneEntityColumnFilters } from '@/hooks/usePruneEntityColumnFilters'
import { usePruneFacetColumnFilters } from '@/hooks/usePruneFacetColumnFilters'
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
  staffMembers: { userId: string; username: string }[]
  guildMembers: SearchableUserOption[]
  page: number
  limit: number
  total: number
  gamePnL: number
  cashFlow: number
  hideUserSearch?: boolean
  hideDatePicker?: boolean
}

const TransactionTable = ({
  guildId,
  globalSettings,
  transactions,
  transactionCounts,
  staffMembers,
  guildMembers,
  page,
  limit,
  total,
  gamePnL,
  cashFlow,
  hideUserSearch = false,
  hideDatePicker = false
}: TransactionTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const defaultVisibility: VisibilityState = {
    handledBy: false,
    referenceId: false,
    casinoGame: false,
    type: false,
    source: false,
    createdAt: false
  }

  const { table, isLoading, setIsLoading, isTableReady } =
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
        setIsLoading(true)

        const search = hideUserSearch
          ? undefined
          : ((filters.find((f) => f.id === 'username')?.value as
              | string
              | undefined) ?? '')
        const staffId =
          (filters.find((f) => f.id === 'handledBy')?.value as
            | string
            | undefined) ?? ''
        const referenceId =
          (filters.find((f) => f.id === 'referenceId')?.value as
            | string
            | undefined) ?? ''

        const filterType =
          (
            filters.find((f) => f.id === 'type')?.value as string[] | undefined
          )?.join(',') || undefined
        const filterSource =
          (
            filters.find((f) => f.id === 'source')?.value as
              | string[]
              | undefined
          )?.join(',') || undefined
        const filterCasinoGame =
          (
            filters.find((f) => f.id === 'casinoGame')?.value as
              | string[]
              | undefined
          )?.join(',') || undefined

        const dateRange = filters.find((f) => f.id === 'createdAt')?.value as
          | [string, string]
          | undefined

        debouncedUpdateUrl({
          page: 1,
          ...(hideUserSearch ? {} : { search }),
          staffId: staffId || undefined,
          referenceId: referenceId || undefined,
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

      initialVisibility: defaultVisibility,

      urlHydration: {
        searchParams,
        defaultVisibility,
        filters: (params) => {
          const search = params.get('search') || ''
          const staffId = params.get('staffId') || ''
          const referenceId =
            params.get('referenceId') ||
            params.get('betId') ||
            params.get('adminSearch') ||
            ''
          const filterType = params.get('filterType')?.split(',')
          const filterSource = params.get('filterSource')?.split(',')
          const filterCasinoGame = params.get('filterCasinoGame')?.split(',')
          const dateFrom = params.get('dateFrom') || undefined
          const dateTo = params.get('dateTo') || undefined

          const filters = [
            { id: 'handledBy', value: staffId || undefined },
            { id: 'referenceId', value: referenceId || undefined },
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
          ].filter((filter) => filter.value !== undefined)

          if (!hideUserSearch) {
            filters.unshift({ id: 'username', value: search || undefined })
          }

          return filters.filter((filter) => filter.value !== undefined)
        }
      }
    })

  const showTableLoading = isLoading || !isTableReady

  const facetCountsByColumn = useMemo(
    () => ({
      type: transactionCounts.type,
      source: transactionCounts.source,
      casinoGame: transactionCounts.casinoGame
    }),
    [transactionCounts]
  )

  usePruneFacetColumnFilters(
    table,
    facetCountsByColumn,
    !isLoading && isTableReady
  )

  const entityFacetColumns = useMemo(() => {
    const columns: Array<{
      columnId: string
      facetCounts: Record<string, number>
      restrictWhenColumnId?: string
      alwaysRestrict?: boolean
    }> = [
      {
        columnId: 'handledBy',
        facetCounts: transactionCounts.staff,
        ...(hideUserSearch
          ? { alwaysRestrict: true }
          : { restrictWhenColumnId: 'username' })
      }
    ]

    if (!hideUserSearch) {
      columns.push({
        columnId: 'username',
        facetCounts: transactionCounts.users,
        restrictWhenColumnId: 'handledBy'
      })
    }

    return columns
  }, [hideUserSearch, transactionCounts.staff, transactionCounts.users])

  usePruneEntityColumnFilters(
    table,
    entityFacetColumns,
    !isLoading && isTableReady
  )

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, transactions])

  return (
    <ServerTablePageLayout
      toolbar={
        <TransactionTableFilters
          guildId={guildId}
          table={table}
          counts={transactionCounts}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          staffMembers={staffMembers}
          guildMembers={guildMembers}
          hideUserSearch={hideUserSearch}
          hideDatePicker={hideDatePicker}
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
        <CustomTableHeader table={table} isLoading={showTableLoading} />
        <CustomTableBody table={table} isLoading={showTableLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default TransactionTable
