'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { useEffect } from 'react'

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
import { IAtmRequestCounts, TAtmRequestDiscord } from '@/types/types'

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
  const { table, isLoading, setIsLoading } = useServerTable<TAtmRequestDiscord>(
    {
      data: requests,
      page,
      limit,
      total,
      columns: atmQueueColumns(guildId, globalSettings, isGuildAdmin),
      initialVisibility: { userId: false },

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          page: 1,
          sort: sorting
            .map((entry) => `${entry.id}:${entry.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        const search =
          (filters.find((filter) => filter.id === 'userId')?.value as
            | string
            | undefined) ?? ''
        const filterStatus =
          (
            filters.find((filter) => filter.id === 'status')?.value as
              | string[]
              | undefined
          )?.join(',') ?? ''
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
          filterStatus: filterStatus || undefined,
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
      }
    }
  )

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, requests])

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)
  const searchParams = useSearchParams()

  useHydrateServerTableFromUrl(table, searchParams, {
    filters: (params) => {
      const search = params.get('search') || ''
      const filterStatus = params
        .get('filterStatus')
        ?.split(',')
        .filter(Boolean)
      const filterType = params.get('filterType')?.split(',').filter(Boolean)
      const dateFrom = params.get('dateFrom') || undefined
      const dateTo = params.get('dateTo') || undefined

      return [
        { id: 'userId', value: search || undefined },
        {
          id: 'status',
          value: filterStatus?.length ? filterStatus : ['pending']
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
  })

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
        <CustomTableHeader table={table} />
        <CustomTableBody table={table} isLoading={isLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default AtmQueueTable
