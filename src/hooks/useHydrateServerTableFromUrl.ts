import { Table, VisibilityState } from '@tanstack/react-table'

import { useEffect, useRef } from 'react'

import { parseSortingFromUrl } from '@/lib/utils'

type HydrateOptions = {
  filters?: (searchParams: URLSearchParams) => {
    id: string
    value: unknown
  }[]
  defaultVisibility?: VisibilityState
}

export function useHydrateServerTableFromUrl<T>(
  table: Table<T>,
  searchParams: URLSearchParams | null,
  options?: HydrateOptions
) {
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    if (!searchParams) return

    console.log('hydrating with', searchParams.toString())
    if (hasHydratedRef.current) return

    const pageFromUrl = Number(searchParams.get('page') || 1)
    const limitFromUrl = Number(searchParams.get('limit') || 10)
    const sortParam = searchParams.get('sort')
    const viewParam = searchParams.get('view')
    const defaultVisibility = options?.defaultVisibility ?? {}

    table.setPageIndex(pageFromUrl - 1)
    table.setPageSize(limitFromUrl)
    table.setSorting(sortParam ? parseSortingFromUrl(sortParam) : [])

    if (options?.filters) {
      table.setColumnFilters(options.filters(searchParams))
    } else {
      table.setColumnFilters([])
    }

    if (viewParam !== null) {
      const overrides = viewParam ? viewParam.split(',') : []

      const visibilityState: Record<string, boolean> = {}

      table.getAllLeafColumns().forEach((col) => {
        const defaultValue = defaultVisibility[col.id] ?? true

        const override = overrides.find(
          (o) => o === col.id || o === `!${col.id}`
        )

        if (!override) {
          visibilityState[col.id] = defaultValue
        } else {
          visibilityState[col.id] = override.startsWith('!')
        }
      })

      table.setColumnVisibility(visibilityState)
    }

    hasHydratedRef.current = true

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
}
