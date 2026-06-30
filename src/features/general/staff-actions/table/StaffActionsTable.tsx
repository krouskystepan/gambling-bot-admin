'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { useEffect, useMemo } from 'react'

import { useSearchParams } from 'next/navigation'

import type {
  StaffActionCounts,
  StaffActionEntityFacets,
  StaffActionRow
} from '@/actions/database/staffActions.action'
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

import StaffActionsTableFilters from './StaffActionsTableFilters'
import StaffActionsTableSummary from './StaffActionsTableSummary'
import { staffActionsColumns } from './staffActionsColumns'

type StaffActionsTableProps = {
  guildId: string
  globalSettings: GlobalSettings
  actions: StaffActionRow[]
  counts: StaffActionCounts
  entityFacets: StaffActionEntityFacets
  staffMembers: { userId: string; username: string }[]
  guildMembers: SearchableUserOption[]
  page: number
  limit: number
  total: number
}

const StaffActionsTable = ({
  guildId,
  globalSettings,
  actions,
  counts,
  entityFacets,
  staffMembers,
  guildMembers,
  page,
  limit,
  total
}: StaffActionsTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const defaultVisibility = {
    search: false,
    staffId: false,
    category: false,
    occurredAt: false
  }

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<StaffActionRow>({
      data: actions,
      page,
      limit,
      total,
      columns: staffActionsColumns(guildId, globalSettings),
      initialVisibility: defaultVisibility,

      urlHydration: {
        searchParams,
        defaultVisibility,
        filters: (params) => {
          const search = params.get('search') || ''
          const staffId = params.get('staffId') || ''
          const filterAction = params
            .get('filterAction')
            ?.split(',')
            .filter(Boolean)
          const dateFrom = params.get('dateFrom') || undefined
          const dateTo = params.get('dateTo') || undefined

          return [
            { id: 'search', value: search || undefined },
            { id: 'staffId', value: staffId || undefined },
            {
              id: 'category',
              value: filterAction?.length ? filterAction : undefined
            },
            {
              id: 'occurredAt',
              value: dateFrom && dateTo ? [dateFrom, dateTo] : undefined
            }
          ]
        }
      },

      onColumnFiltersChange: (filters) => {
        setIsLoading(true)

        const search =
          (filters.find((filter) => filter.id === 'search')?.value as
            | string
            | undefined) ?? ''
        const staffId =
          (filters.find((filter) => filter.id === 'staffId')?.value as
            | string
            | undefined) ?? ''
        const filterAction =
          (
            filters.find((filter) => filter.id === 'category')?.value as
              | string[]
              | undefined
          )?.join(',') ?? ''
        const dateRange = filters.find((filter) => filter.id === 'occurredAt')
          ?.value as [string, string] | undefined

        debouncedUpdateUrl({
          page: 1,
          search: search || undefined,
          staffId: staffId || undefined,
          filterAction: filterAction || undefined,
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

  const showTableLoading = isLoading || !isTableReady

  const facetCountsByColumn = useMemo(
    () => ({
      category: counts
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
        columnId: 'staffId',
        facetCounts: entityFacets.staff,
        restrictWhenColumnId: 'search'
      },
      {
        columnId: 'search',
        facetCounts: entityFacets.users,
        restrictWhenColumnId: 'staffId'
      }
    ],
    [entityFacets]
  )

  usePruneEntityColumnFilters(
    table,
    entityFacetColumns,
    !isLoading && isTableReady
  )

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, actions])

  return (
    <ServerTablePageLayout
      toolbar={
        <StaffActionsTableFilters
          guildId={guildId}
          table={table}
          counts={counts}
          entityFacets={entityFacets}
          staffMembers={staffMembers}
          guildMembers={guildMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      }
      summary={<StaffActionsTableSummary counts={counts} />}
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full table-auto">
        <CustomTableHeader table={table} isLoading={showTableLoading} />
        <CustomTableBody table={table} isLoading={showTableLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default StaffActionsTable
