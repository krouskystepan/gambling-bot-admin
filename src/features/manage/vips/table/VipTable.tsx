'use client'

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
import { TVipChannels } from '@/types/types'

import VipsTableFilters from './VipsTableFilters'
import { vipColumns } from './vipColumns'

type VipTableProps = {
  guildId: string
  vips: TVipChannels[]
  page: number
  limit: number
  total: number
}

const VipTable = ({ guildId, vips, page, limit, total }: VipTableProps) => {
  const { table, isLoading, setIsLoading } = useServerTable<TVipChannels>({
    data: vips,
    page,
    limit,
    total,
    columns: vipColumns(guildId),
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
  }, [setIsLoading, vips])

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const searchParams = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  useHydrateServerTableFromUrl(table, searchParams, {
    filters: (params) => {
      const search = params.get('search') || ''

      return search ? [{ id: 'search', value: search }] : []
    }
  })

  return (
    <ServerTablePageLayout
      toolbar={
        <VipsTableFilters
          table={table}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          searchRef={searchRef}
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

export default VipTable
