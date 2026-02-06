import { Table } from '@tanstack/react-table'

import { useEffect } from 'react'

import { parseSortingFromUrl } from '@/lib/utils'

type HydrateOptions = {
  filters?: (searchParams: URLSearchParams) => {
    id: string
    value: unknown
  }[]
}

export function useHydrateServerTableFromUrl<T>(
  table: Table<T>,
  searchParams: URLSearchParams | null,
  options?: HydrateOptions
) {
  const urlKey = searchParams?.toString() ?? ''

  useEffect(() => {
    if (!searchParams) return

    const pageFromUrl = Number(searchParams.get('page') || 1)
    const limitFromUrl = Number(searchParams.get('limit') || 10)
    const sortParam = searchParams.get('sort')

    table.setPageIndex(pageFromUrl - 1)
    table.setPageSize(limitFromUrl)
    table.setSorting(sortParam ? parseSortingFromUrl(sortParam) : [])

    if (options?.filters) {
      table.setColumnFilters(options.filters(searchParams))
    } else {
      table.setColumnFilters([])
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey])
}
