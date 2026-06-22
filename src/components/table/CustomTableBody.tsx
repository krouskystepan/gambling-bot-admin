import { Table, flexRender } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type TableBodyProps<T> = {
  table: Table<T>
  isLoading: boolean
}

const CustomTableBody = <T,>({ table, isLoading }: TableBodyProps<T>) => {
  const visibleColumns = table.getVisibleLeafColumns()
  const skeletonRowCount = Math.max(
    table.getState().pagination.pageSize,
    table.getRowModel().rows.length,
    5
  )

  return (
    <TableBody>
      {isLoading ? (
        Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
          <TableRow
            key={rowIndex}
            className={cn('h-16', rowIndex % 2 === 1 && 'bg-muted/30')}
          >
            {visibleColumns.map((column) => (
              <TableCell key={column.id}>
                <Skeleton className="h-4 w-full max-w-32" />
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : table.getRowModel().rows.length ? (
        table.getRowModel().rows.map((row, index) => (
          <TableRow
            key={row.id}
            className={cn(index % 2 === 1 && 'bg-muted/30')}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell
            colSpan={table.getHeaderGroups()[0]?.headers.length}
            className="py-6 text-center text-sm text-muted-foreground"
          >
            No results found.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

export default CustomTableBody
