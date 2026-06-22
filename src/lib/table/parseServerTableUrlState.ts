import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'

import { parseSortingFromUrl } from '@/lib/utils'

export type ServerTableUrlHydrationOptions = {
  filters?: (searchParams: URLSearchParams) => ColumnFiltersState
  defaultVisibility?: VisibilityState
  columnIds: string[]
}

export type ParsedServerTableUrlState = {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
}

export function getLeafColumnIds<T>(columns: ColumnDef<T>[]): string[] {
  const ids: string[] = []

  for (const column of columns) {
    if ('columns' in column && column.columns?.length) {
      ids.push(...getLeafColumnIds(column.columns))
      continue
    }

    const id =
      column.id ??
      ('accessorKey' in column && column.accessorKey
        ? String(column.accessorKey)
        : undefined)

    if (id) {
      ids.push(id)
    }
  }

  return ids
}

function parseVisibilityFromUrl(
  viewParam: string,
  columnIds: string[],
  defaultVisibility: VisibilityState
): VisibilityState {
  const overrides = viewParam ? viewParam.split(',') : []
  const visibilityState: VisibilityState = {}

  columnIds.forEach((columnId) => {
    const defaultValue = defaultVisibility[columnId] ?? true
    const override = overrides.find(
      (entry) => entry === columnId || entry === `!${columnId}`
    )

    if (!override) {
      visibilityState[columnId] = defaultValue
      return
    }

    visibilityState[columnId] = override.startsWith('!')
  })

  return visibilityState
}

export function parseServerTableUrlState(
  searchParams: URLSearchParams,
  options: ServerTableUrlHydrationOptions
): ParsedServerTableUrlState {
  const sortParam = searchParams.get('sort')
  const viewParam = searchParams.get('view')
  const defaultVisibility = options.defaultVisibility ?? {}

  return {
    sorting: sortParam ? parseSortingFromUrl(sortParam) : [],
    columnFilters: (options.filters?.(searchParams) ?? []).filter(
      (filter) => filter.value !== undefined
    ),
    columnVisibility:
      viewParam === null
        ? defaultVisibility
        : parseVisibilityFromUrl(
            viewParam,
            options.columnIds,
            defaultVisibility
          )
  }
}
