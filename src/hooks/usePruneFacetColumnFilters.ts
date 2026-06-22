import type { Table as ReactTable } from '@tanstack/react-table'

import { useEffect } from 'react'

import { pruneFacetValues } from '@/lib/table/facetFilters'

type FacetCountsByColumn = Record<string, Record<string, number>>

export function usePruneFacetColumnFilters<TData>(
  table: ReactTable<TData>,
  facetCountsByColumn: FacetCountsByColumn,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    for (const [columnId, counts] of Object.entries(facetCountsByColumn)) {
      const column = table.getColumn(columnId)
      const currentValue = column?.getFilterValue() as string[] | undefined

      if (!currentValue?.length) {
        continue
      }

      const pruned = pruneFacetValues(currentValue, counts)

      if (!pruned?.length) {
        if (currentValue.length > 0) {
          column?.setFilterValue(undefined)
        }
        continue
      }

      if (
        pruned.length !== currentValue.length ||
        pruned.some((value, index) => value !== currentValue[index])
      ) {
        column?.setFilterValue(pruned)
      }
    }
  }, [enabled, facetCountsByColumn, table])
}
