'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { useEffect, useRef } from 'react'

import { useSearchParams } from 'next/navigation'

import type {
  StaffActionCounts,
  StaffActionRow
} from '@/actions/database/staffActions.action'
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

import StaffActionsTableFilters from './StaffActionsTableFilters'
import StaffActionsTableSummary from './StaffActionsTableSummary'
import { staffActionsColumns } from './staffActionsColumns'

type StaffActionsTableProps = {
  guildId: string
  globalSettings: GlobalSettings
  actions: StaffActionRow[]
  counts: StaffActionCounts
  staffMembers: { userId: string; username: string }[]
  page: number
  limit: number
  total: number
}

const StaffActionsTable = ({
  guildId,
  globalSettings,
  actions,
  counts,
  staffMembers,
  page,
  limit,
  total
}: StaffActionsTableProps) => {
  const { table, isLoading, setIsLoading } = useServerTable<StaffActionRow>({
    data: actions,
    page,
    limit,
    total,
    columns: staffActionsColumns(guildId, globalSettings),
    initialVisibility: {
      search: false,
      staffId: false,
      category: false,
      occurredAt: false
    },

    onColumnFiltersChange: (filters) => {
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

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, actions])

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)
  const searchParams = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  useHydrateServerTableFromUrl(table, searchParams, {
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
  })

  return (
    <ServerTablePageLayout
      toolbar={
        <StaffActionsTableFilters
          guildId={guildId}
          table={table}
          counts={counts}
          staffMembers={staffMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          searchRef={searchRef}
        />
      }
      summary={<StaffActionsTableSummary counts={counts} />}
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full table-auto">
        <CustomTableHeader table={table} />
        <CustomTableBody table={table} isLoading={isLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default StaffActionsTable
