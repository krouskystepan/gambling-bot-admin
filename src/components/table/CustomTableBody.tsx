import { Table, flexRender } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type TableBodyProps<T> = {
  table: Table<T>
  isLoading: boolean
}

const CustomTableBody = <T,>({ table, isLoading }: TableBodyProps<T>) => {
  return (
    <TableBody>
      {isLoading ? (
        Array.from({
          length: table.getPaginationRowModel().rows.length
        }).map((_, i) => (
          <TableRow
            key={i}
            className={cn('h-16', i % 2 === 1 && 'bg-muted/30')}
          >
            {table.getHeaderGroups()[0]?.headers.map((header, j) => (
              <TableCell key={j}>
                <Skeleton
                  className="h-4"
                  style={{ width: `${header.getSize()}px` }}
                />
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
