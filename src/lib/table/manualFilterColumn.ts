import type { ColumnDef, FilterFn } from '@tanstack/react-table'

export function createManualTableFilterFn<T>(): FilterFn<T> {
  const filterFn: FilterFn<T> = () => true
  filterFn.autoRemove = () => false
  return filterFn
}

export function createHiddenFilterColumn<T>(id: string): ColumnDef<T> {
  return {
    id,
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableColumnFilter: true,
    enableHiding: false,
    filterFn: createManualTableFilterFn<T>(),
    size: 0
  }
}
