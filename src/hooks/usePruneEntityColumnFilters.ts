import type { Table as ReactTable } from '@tanstack/react-table'

import { useEffect } from 'react'

type EntityFacetColumnConfig = {
  columnId: string
  facetCounts: Record<string, number>
  restrictWhenColumnId?: string
  alwaysRestrict?: boolean
}

export function usePruneEntityColumnFilters<TData>(
  table: ReactTable<TData>,
  columns: EntityFacetColumnConfig[],
  enabled = true
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    for (const {
      columnId,
      facetCounts,
      restrictWhenColumnId,
      alwaysRestrict = false
    } of columns) {
      const restrictValue = restrictWhenColumnId
        ? (table.getColumn(restrictWhenColumnId)?.getFilterValue() as
            | string
            | undefined)
        : undefined

      if (!alwaysRestrict && !restrictValue) {
        continue
      }

      const column = table.getColumn(columnId)
      const currentValue = column?.getFilterValue() as string | undefined

      if (!currentValue) {
        continue
      }

      if ((facetCounts[currentValue] ?? 0) === 0) {
        column?.setFilterValue(undefined)
      }
    }
  }, [columns, enabled, table])
}
