'use client'

import { useEffect } from 'react'

import { useSearchParams } from 'next/navigation'

import type {
  GuildBanRow,
  GuildBanStatusFilter
} from '@/actions/database/guildBans.action'
import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination,
  ServerTablePageLayout
} from '@/components/table'
import type { SearchableUserOption } from '@/components/table/SearchableUserFilter'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'

import BansTableFilters from './BansTableFilters'
import { banColumns } from './banColumns'

type BansTableProps = {
  guildId: string
  bans: GuildBanRow[]
  guildMembers: SearchableUserOption[]
  page: number
  limit: number
  total: number
  status: GuildBanStatusFilter
}

const BansTable = ({
  guildId,
  bans,
  guildMembers,
  page,
  limit,
  total,
  status
}: BansTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<GuildBanRow>({
      data: bans,
      page,
      limit,
      total,
      columns: banColumns(guildId),
      initialSorting: [{ id: 'bannedAt', desc: true }],
      initialVisibility: { userId: false },

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          page: 1,
          sort: sorting
            .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        const userId =
          (filters.find((f) => f.id === 'userId')?.value as
            | string
            | undefined) ?? ''

        debouncedUpdateUrl({
          page: 1,
          userId: userId || undefined
        })
      },

      onPaginationChange: (pagination) => {
        debouncedUpdateUrl({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        })
      },

      urlHydration: {
        searchParams,
        filters: (params) => {
          const userId = params.get('userId') || ''
          return [{ id: 'userId', value: userId || undefined }]
        }
      }
    })

  const showTableLoading = isLoading || !isTableReady

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, bans])

  const handleStatusChange = (nextStatus: string) => {
    setIsLoading(true)
    updateUrl({ page: 1, status: nextStatus })
  }

  return (
    <ServerTablePageLayout
      toolbar={
        <BansTableFilters
          table={table}
          guildMembers={guildMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          status={status}
          onStatusChange={handleStatusChange}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full min-w-5xl table-fixed">
        <CustomTableHeader table={table} isLoading={showTableLoading} />
        <CustomTableBody table={table} isLoading={showTableLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default BansTable
