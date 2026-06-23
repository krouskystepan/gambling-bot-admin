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
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { usePruneEntityColumnFilters } from '@/hooks/usePruneEntityColumnFilters'
import { usePruneFacetColumnFilters } from '@/hooks/usePruneFacetColumnFilters'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { IAtmRequestCounts, TAtmRequestDiscord } from '@/types/types'

import {
  parseAtmQueueFilterStatusForTable,
  serializeAtmQueueFilterStatus
} from '../atmQueueFilterParams'
import AtmQueueTableFilters from './AtmQueueTableFilters'
import AtmQueueTableSummary from './AtmQueueTableSummary'
import { atmQueueColumns } from './atmQueueColumns'

type AtmQueueTableProps = {
  guildId: string
  globalSettings: GlobalSettings
  isGuildAdmin: boolean
  requests: TAtmRequestDiscord[]
  counts: IAtmRequestCounts
  guildMembers: {
    userId: string
    username: string
    nickname: string | null
    avatarUrl: string
  }[]
  page: number
  limit: number
  total: number
}

const AtmQueueTable = ({
  guildId,
  globalSettings,
  isGuildAdmin,
  requests,
  counts,
  guildMembers,
  page,
  limit,
  total
}: AtmQueueTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const defaultVisibility: VisibilityState = {
    userId: false,
    nickname: false,
    handledByUsername: false,
    createdAt: false,
    notes: false,
    audit: false
  }

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<TAtmRequestDiscord>({
      data: requests,
      page,
      limit,
      total,
      columns: atmQueueColumns(guildId, globalSettings, isGuildAdmin),
      initialVisibility: defaultVisibility,

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          page: 1,
          sort: sorting
            .map((entry) => `${entry.id}:${entry.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        setIsLoading(true)

        const search =
          (filters.find((filter) => filter.id === 'userId')?.value as
            | string
            | undefined) ?? ''
        const filterStatus = serializeAtmQueueFilterStatus(
          filters.find((filter) => filter.id === 'status')?.value as
            | string[]
            | undefined
        )
        const filterType =
          (
            filters.find((filter) => filter.id === 'type')?.value as
              | string[]
              | undefined
          )?.join(',') ?? ''
        const dateRange = filters.find((filter) => filter.id === 'createdAt')
          ?.value as [string, string] | undefined

        debouncedUpdateUrl({
          page: 1,
          search: search || undefined,
          filterStatus,
          filterType: filterType || undefined,
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

      urlHydration: {
        searchParams,
        defaultVisibility,
        filters: (params) => {
          const search = params.get('search') || ''
          const filterStatusParam = params.get('filterStatus')
          const filterStatus =
            parseAtmQueueFilterStatusForTable(filterStatusParam)
          const filterType = params
            .get('filterType')
            ?.split(',')
            .filter(Boolean)
          const dateFrom = params.get('dateFrom') || undefined
          const dateTo = params.get('dateTo') || undefined

          return [
            { id: 'userId', value: search || undefined },
            {
              id: 'status',
              value: filterStatus
            },
            {
              id: 'type',
              value: filterType?.length ? filterType : undefined
            },
            {
              id: 'createdAt',
              value: dateFrom && dateTo ? [dateFrom, dateTo] : undefined
            }
          ]
        }
      }
    })

  const showTableLoading = isLoading || !isTableReady

  const facetCountsByColumn = useMemo(
    () => ({
      status: {
        pending: counts.pending,
        approved: counts.approved,
        rejected: counts.rejected
      },
      type: counts.type
    }),
    [counts]
  )

  usePruneFacetColumnFilters(
    table,
    facetCountsByColumn,
    !isLoading && isTableReady
  )

  const entityFacetColumns = useMemo(
    () => [
      {
        columnId: 'userId',
        facetCounts: counts.users,
        alwaysRestrict: true
      }
    ],
    [counts.users]
  )

  usePruneEntityColumnFilters(
    table,
    entityFacetColumns,
    !isLoading && isTableReady
  )

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, requests])

  return (
    <ServerTablePageLayout
      toolbar={
        <AtmQueueTableFilters
          table={table}
          counts={counts}
          guildMembers={guildMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      }
      summary={
        <AtmQueueTableSummary counts={counts} globalSettings={globalSettings} />
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

export default AtmQueueTable
