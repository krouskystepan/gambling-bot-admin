import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

import { useEffect, useState } from 'react'

interface ServerTableProps<T> {
  data: T[]
  page: number
  limit: number
  total: number
  columns: ColumnDef<T>[]
  onSortingChange?: (sorting: SortingState) => void
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  onPaginationChange?: (pagination: PaginationState) => void
  initialSorting?: SortingState
  initialVisibility?: VisibilityState
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
  initialSorting = [],
  initialVisibility = {}
}: ServerTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: limit
  })

  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility] = useState<VisibilityState>(initialVisibility)
  const [isLoading, setIsLoading] = useState(false)

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
        typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFilters(next)
      onColumnFiltersChange?.(next)
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(next)
      onPaginationChange?.(next)
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
    setIsLoading
  }
}
