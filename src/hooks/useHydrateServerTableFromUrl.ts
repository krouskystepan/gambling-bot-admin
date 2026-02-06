import { Table } from '@tanstack/react-table'

import { useEffect, useRef } from 'react'

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
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    if (!searchParams) return
    if (hasHydratedRef.current) return

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

    hasHydratedRef.current = true

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
}
