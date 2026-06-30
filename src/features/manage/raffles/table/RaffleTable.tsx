'use client'

import type { TRaffleStatus } from 'gambling-bot-shared/raffle'

import { useEffect } from 'react'

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
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { TRaffleRow } from '@/types/types'

import RafflesTableFilters from './RafflesTableFilters'
import { raffleColumns } from './raffleColumns'

type RaffleTableProps = {
  guildId: string
  raffles: TRaffleRow[]
  guildMembers: SearchableUserOption[]
  page: number
  limit: number
  total: number
  status: TRaffleStatus | 'all'
  raffleConfigured: boolean
  raffleFeatureBlocked: boolean
  raffleFeatureBlockMessage: string | null
}

const RaffleTable = ({
  guildId,
  raffles,
  guildMembers,
  page,
  limit,
  total,
  status,
  raffleConfigured,
  raffleFeatureBlocked,
  raffleFeatureBlockMessage
}: RaffleTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<TRaffleRow>({
      data: raffles,
      page,
      limit,
      total,
      columns: raffleColumns(
        guildId,
        raffleFeatureBlocked,
        raffleFeatureBlockMessage
      ),
      initialSorting: [{ id: 'createdAt', desc: true }],
      initialVisibility: { search: false, userId: false },

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          page: 1,
          sort: sorting
            .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        const search =
          (filters.find((f) => f.id === 'search')?.value as
            | string
            | undefined) ?? ''
        const userId =
          (filters.find((f) => f.id === 'userId')?.value as
            | string
            | undefined) ?? ''

        debouncedUpdateUrl({
          page: 1,
          search: search || undefined,
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
          const search = params.get('search') || ''
          const userId = params.get('userId') || ''

          return [
            { id: 'search', value: search || undefined },
            { id: 'userId', value: userId || undefined }
          ]
        }
      }
    })

  const showTableLoading = isLoading || !isTableReady

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, raffles])

  const handleStatusChange = (nextStatus: string) => {
    setIsLoading(true)
    updateUrl({ page: 1, status: nextStatus })
  }

  return (
    <ServerTablePageLayout
      toolbar={
        <RafflesTableFilters
          guildId={guildId}
          table={table}
          raffles={raffles}
          guildMembers={guildMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          status={status}
          onStatusChange={handleStatusChange}
          raffleConfigured={raffleConfigured}
          raffleFeatureBlocked={raffleFeatureBlocked}
          raffleFeatureBlockMessage={raffleFeatureBlockMessage}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full min-w-6xl table-fixed">
        <CustomTableHeader table={table} isLoading={showTableLoading} />
        <CustomTableBody table={table} isLoading={showTableLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default RaffleTable
