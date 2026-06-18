'use client'

import type { TPrediction } from 'gambling-bot-shared/predictions'

import { useEffect } from 'react'

import { useSearchParams } from 'next/navigation'

import type { SearchableUserOption } from '@/components/SearchableUserFilter'
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
import { TPredictionRow } from '@/types/types'

import PredictionsTableFilters from './PredictionsTableFilters'
import { predictionColumns } from './predictionColumns'

type PredictionsTableProps = {
  guildId: string
  predictions: TPredictionRow[]
  guildMembers: SearchableUserOption[]
  page: number
  limit: number
  total: number
  status: TPrediction['status'] | 'all'
  predictionConfigured: boolean
  logsChannelConfigured: boolean
  predictionFeatureBlocked: boolean
  predictionFeatureBlockMessage: string | null
}

const PredictionsTable = ({
  guildId,
  predictions,
  guildMembers,
  page,
  limit,
  total,
  status,
  predictionConfigured,
  logsChannelConfigured,
  predictionFeatureBlocked,
  predictionFeatureBlockMessage
}: PredictionsTableProps) => {
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const { table, isLoading, setIsLoading } = useServerTable<TPredictionRow>({
    data: predictions,
    page,
    limit,
    total,
    columns: predictionColumns(
      guildId,
      predictionFeatureBlocked,
      predictionFeatureBlockMessage,
      logsChannelConfigured
    ),
    initialSorting: [{ id: 'createdAt', desc: true }],
    initialVisibility: { search: false, userId: false },

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
      const userId =
        (filters.find((f) => f.id === 'userId')?.value as string | undefined) ??
        ''

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
    }
  })

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, predictions])

  const searchParams = useSearchParams()

  useHydrateServerTableFromUrl(table, searchParams, {
    filters: (params) => {
      const search = params.get('search') || ''
      const userId = params.get('userId') || ''

      return [
        { id: 'search', value: search || undefined },
        { id: 'userId', value: userId || undefined }
      ]
    }
  })

  const handleStatusChange = (nextStatus: string) => {
    setIsLoading(true)
    updateUrl({ page: 1, status: nextStatus })
  }

  return (
    <ServerTablePageLayout
      toolbar={
        <PredictionsTableFilters
          guildId={guildId}
          table={table}
          predictions={predictions}
          guildMembers={guildMembers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          status={status}
          onStatusChange={handleStatusChange}
          predictionConfigured={predictionConfigured}
          logsChannelConfigured={logsChannelConfigured}
          predictionFeatureBlocked={predictionFeatureBlocked}
          predictionFeatureBlockMessage={predictionFeatureBlockMessage}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full min-w-7xl table-fixed">
        <CustomTableHeader table={table} />
        <CustomTableBody table={table} isLoading={isLoading} />
      </Table>
    </ServerTablePageLayout>
  )
}

export default PredictionsTable
