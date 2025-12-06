import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { TTransactionDiscord } from '@/types/types'
import { flexRender, Table } from '@tanstack/react-table'

const TransactionTableBody = ({
  table,
  isLoading,
}: {
  table: Table<TTransactionDiscord>
  isLoading: boolean
}) => {
  return (
    <TableBody>
      {isLoading ? (
        Array.from({
          length: table.getState().pagination.pageSize,
        }).map((_, i) => (
          <TableRow key={i} className="h-16">
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
        table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
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
            className="text-center py-6"
          >
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

export default TransactionTableBody
