'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'
import type { QuestKind, TQuest } from 'gambling-bot-shared/quests'

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
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'

import QuestsTableFilters from './QuestsTableFilters'
import { questColumns } from './questColumns'

type QuestsTableProps = {
  guildId: string
  quests: TQuest[]
  globalSettings: GlobalSettings
  page: number
  limit: number
  total: number
  kind: QuestKind | 'all'
  questFeatureBlocked: boolean
  questFeatureBlockMessage: string | null
}

const QuestsTable = ({
  guildId,
  quests,
  globalSettings,
  page,
  limit,
  total,
  kind,
  questFeatureBlocked,
  questFeatureBlockMessage
}: QuestsTableProps) => {
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<TQuest>({
      data: quests,
      page,
      limit,
      total,
      columns: questColumns(
        guildId,
        globalSettings,
        questFeatureBlocked,
        questFeatureBlockMessage
      ),
      initialSorting: [{ id: 'sortOrder', desc: false }],
      initialVisibility: { search: false },

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

        debouncedUpdateUrl({
          page: 1,
          search: search || undefined
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
          return [{ id: 'search', value: search || undefined }]
        }
      }
    })

  const showTableLoading = isLoading || !isTableReady

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, quests])

  const handleKindChange = (nextKind: string) => {
    setIsLoading(true)
    updateUrl({ page: 1, kind: nextKind })
  }

  return (
    <ServerTablePageLayout
      toolbar={
        <QuestsTableFilters
          guildId={guildId}
          table={table}
          quests={quests}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          kind={kind}
          onKindChange={handleKindChange}
          questFeatureBlocked={questFeatureBlocked}
          questFeatureBlockMessage={questFeatureBlockMessage}
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

export default QuestsTable
