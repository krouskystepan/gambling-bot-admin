import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TTransactionDiscord } from '@/types/types'
import { flexRender, Table } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

const TransactionTableHeader = ({
  table,
}: {
  table: Table<TTransactionDiscord>
}) => {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              style={{ width: `${header.getSize()}px` }}
            >
              {header.isPlaceholder ? null : header.column.getCanSort() ? (
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: <ChevronUpIcon className="w-4 h-4" />,
                    desc: <ChevronDownIcon className="w-4 h-4" />,
                  }[header.column.getIsSorted() as string] ?? null}
                </div>
              ) : (
                flexRender(header.column.columnDef.header, header.getContext())
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
}

export default TransactionTableHeader
