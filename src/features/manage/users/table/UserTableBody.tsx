import { Table, flexRender } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { TGuildMemberStatus } from '@/types/types'

const UserTableBody = ({
  table,
  isLoading
}: {
  table: Table<TGuildMemberStatus>
  isLoading: boolean
}) => {
  return (
    <TableBody>
      {isLoading ? (
        Array.from({
          length: table.getState().pagination.pageSize
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
            className="py-6 text-center"
          >
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

export default UserTableBody
