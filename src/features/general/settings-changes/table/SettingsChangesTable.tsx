'use client'

import { useEffect, useMemo } from 'react'

import { useSearchParams } from 'next/navigation'

import type {
  SettingsChangeCounts,
  SettingsChangeEntityFacets,
  SettingsChangeRow
} from '@/actions/database/settingsChanges.action'
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

import SettingsChangesTableFilters from './SettingsChangesTableFilters'
import SettingsChangesTableSummary from './SettingsChangesTableSummary'
import { settingsChangesColumns } from './settingsChangesColumns'

type SettingsChangesTableProps = {
  changes: SettingsChangeRow[]
  counts: SettingsChangeCounts
  entityFacets: SettingsChangeEntityFacets
  staffMembers: { userId: string; username: string }[]
  page: number
  limit: number
  total: number
}

const SettingsChangesTable = ({
  changes,
  counts,
  entityFacets,
  staffMembers,
  page,
  limit,
  total
}: SettingsChangesTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const defaultVisibility = {
    staffId: false,
    section: false,
    occurredAt: false
  }

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<SettingsChangeRow>({
      data: changes,
      page,
      limit,
      total,
      columns: settingsChangesColumns(),
      initialVisibility: defaultVisibility,

      urlHydration: {
        searchParams,
        defaultVisibility,
        filters: (params) => {
          const staffId = params.get('staffId') || ''
          const filterSection = params
            .get('filterSection')
            ?.split(',')
            .filter(Boolean)
          const dateFrom = params.get('dateFrom') || undefined
          const dateTo = params.get('dateTo') || undefined

          return [
            { id: 'staffId', value: staffId || undefined },
            {
              id: 'section',
              value: filterSection?.length ? filterSection : undefined
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

        const staffId =
          (filters.find((filter) => filter.id === 'staffId')?.value as
            | string
            | undefined) ?? ''
        const filterSection =
          (
            filters.find((filter) => filter.id === 'section')?.value as
              | string[]
              | undefined
          )?.join(',') ?? ''
        const dateRange = filters.find((filter) => filter.id === 'occurredAt')
          ?.value as [string, string] | undefined

        debouncedUpdateUrl({
          page: 1,
          staffId: staffId || undefined,
          filterSection: filterSection || undefined,
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
      section: counts
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
        facetCounts: entityFacets.staff
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
  }, [setIsLoading, changes])

  return (
    <ServerTablePageLayout
      toolbar={
        <SettingsChangesTableFilters
          table={table}
          counts={counts}
          entityFacets={entityFacets}
          staffMembers={staffMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      }
      summary={<SettingsChangesTableSummary counts={counts} />}
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full table-auto">
        <CustomTableHeader table={table} isLoading={showTableLoading} />
        <CustomTableBody table={table} isLoading={showTableLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default SettingsChangesTable
