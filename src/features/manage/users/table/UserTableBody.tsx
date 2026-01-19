import { Table, flexRender } from '@tanstack/react-table'

import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { TGuildMemberStatus } from '@/types/types'

const UserTableBody = ({ table }: { table: Table<TGuildMemberStatus> }) => {
  return (
    <TableBody>
      {table.getRowModel().rows.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                style={{ width: `${cell.column.getSize()}px` }}
              >
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
