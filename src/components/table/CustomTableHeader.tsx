import { Table, flexRender } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

type TableHeaderProps<T> = {
  table: Table<T>
}

const CustomTableHeader = <T,>({ table }: TableHeaderProps<T>) => {
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
                  className="flex cursor-pointer items-center gap-2 select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: <ChevronUpIcon className="h-4 w-4" />,
                    desc: <ChevronDownIcon className="h-4 w-4" />
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

export default CustomTableHeader
