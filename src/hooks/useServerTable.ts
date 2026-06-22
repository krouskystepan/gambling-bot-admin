import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  type ServerTableUrlHydrationOptions,
  getLeafColumnIds,
  parseServerTableUrlState
} from '@/lib/table/parseServerTableUrlState'

type ServerTableUrlHydration = Omit<
  ServerTableUrlHydrationOptions,
  'columnIds'
> & {
  searchParams: URLSearchParams | null
}

interface ServerTableProps<T> {
  data: T[]
  page: number
  limit: number
  total: number
  columns: ColumnDef<T>[]
  onSortingChange?: (sorting: SortingState) => void
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  onPaginationChange?: (pagination: PaginationState) => void
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  initialSorting?: SortingState
  initialVisibility?: VisibilityState
  urlHydration?: ServerTableUrlHydration
}

export function useServerTable<T>({
  data,
  page,
  limit,
  total,
  columns,
  onSortingChange,
  onColumnFiltersChange,
  onPaginationChange,
  onColumnVisibilityChange,
  initialSorting = [],
  initialVisibility = {},
  urlHydration
}: ServerTableProps<T>) {
  const columnIds = useMemo(() => getLeafColumnIds(columns), [columns])
  const hasAppliedDeferredHydrationRef = useRef(false)

  const getUrlHydrationOptions = () => ({
    filters: urlHydration?.filters,
    defaultVisibility: urlHydration?.defaultVisibility ?? initialVisibility,
    columnIds
  })

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: limit
  })

  const [sorting, setSorting] = useState<SortingState>(() => {
    if (!urlHydration?.searchParams) {
      return initialSorting
    }

    return parseServerTableUrlState(
      urlHydration.searchParams,
      getUrlHydrationOptions()
    ).sorting
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    if (!urlHydration?.searchParams) {
      return []
    }

    return parseServerTableUrlState(
      urlHydration.searchParams,
      getUrlHydrationOptions()
    ).columnFilters
  })
  const columnFiltersRef = useRef(columnFilters)
  columnFiltersRef.current = columnFilters
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      if (!urlHydration?.searchParams) {
        return initialVisibility
      }

      return parseServerTableUrlState(
        urlHydration.searchParams,
        getUrlHydrationOptions()
      ).columnVisibility
    }
  )
  const [isTableReady, setIsTableReady] = useState(
    () => !urlHydration || urlHydration.searchParams !== null
  )
  const [isLoading, setIsLoading] = useState(false)

  useLayoutEffect(() => {
    if (!urlHydration?.searchParams || isTableReady) {
      return
    }

    if (hasAppliedDeferredHydrationRef.current) {
      return
    }

    const parsed = parseServerTableUrlState(urlHydration.searchParams, {
      filters: urlHydration.filters,
      defaultVisibility: urlHydration.defaultVisibility ?? initialVisibility,
      columnIds
    })

    setSorting(parsed.sorting)
    columnFiltersRef.current = parsed.columnFilters
    setColumnFilters(parsed.columnFilters)
    setColumnVisibility(parsed.columnVisibility)
    hasAppliedDeferredHydrationRef.current = true
    setIsTableReady(true)
  }, [
    columnIds,
    initialVisibility,
    isTableReady,
    urlHydration?.defaultVisibility,
    urlHydration?.filters,
    urlHydration?.searchParams
  ])

  useEffect(() => {
    setPagination({
      pageIndex: page - 1,
      pageSize: limit
    })
  }, [page, limit])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
      onSortingChange?.(next)
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater(columnFiltersRef.current)
          : updater

      columnFiltersRef.current = next
      setColumnFilters(next)
      onColumnFiltersChange?.(next)
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(next)
      onPaginationChange?.(next)
    },
    onColumnVisibilityChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(columnVisibility) : updater

      setColumnVisibility(next)
      onColumnVisibilityChange?.(next)
    },
    pageCount: Math.ceil(total / limit),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel()
  })

  return {
    table,
    isLoading,
    setIsLoading,
    isTableReady
  }
}
