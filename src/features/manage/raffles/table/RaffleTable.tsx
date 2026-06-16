'use client'

import type { TRaffleStatus } from 'gambling-bot-shared/raffle'

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
import { TRaffleRow } from '@/types/types'

import RafflesTableFilters from './RafflesTableFilters'
import { raffleColumns } from './raffleColumns'

type RaffleTableProps = {
  guildId: string
  raffles: TRaffleRow[]
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
  page,
  limit,
  total,
  status,
  raffleConfigured,
  raffleFeatureBlocked,
  raffleFeatureBlockMessage
}: RaffleTableProps) => {
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const { table, isLoading, setIsLoading } = useServerTable<TRaffleRow>({
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
    initialVisibility: { search: false },

    onSortingChange: (sorting) => {
      debouncedUpdateUrl({
        page: 1,
        sort: sorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',')
      })
    },

    onColumnFiltersChange: (filters) => {
      const search =
        (filters.find((f) => f.id === 'search')?.value as string | undefined) ??
        ''

      debouncedUpdateUrl({
        page: 1,
        search
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
  }, [setIsLoading, raffles])

  const searchParams = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  useHydrateServerTableFromUrl(table, searchParams, {
    filters: (params) => {
      const search = params.get('search') || ''
      return search ? [{ id: 'search', value: search }] : []
    }
  })

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
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          searchRef={searchRef}
          status={status}
          onStatusChange={handleStatusChange}
          raffleConfigured={raffleConfigured}
          raffleFeatureBlocked={raffleFeatureBlocked}
          raffleFeatureBlockMessage={raffleFeatureBlockMessage}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full min-w-[72rem] table-fixed">
        <CustomTableHeader table={table} />
        <CustomTableBody table={table} isLoading={isLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default RaffleTable
