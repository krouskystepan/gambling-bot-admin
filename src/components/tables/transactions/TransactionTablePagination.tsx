import { Table } from '@tanstack/react-table'
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationItem
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { formatNumberWithSpaces } from '@/lib/utils'
import { TTransactionDiscord } from '@/types/types'

const TransactionTablePagination = ({
  table,
  total
}: {
  table: Table<TTransactionDiscord>
  total: number
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Label className="max-sm:sr-only">Rows per page</Label>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            const newPageSize = Number(value)
            table.setPageSize(newPageSize)
          }}
        >
          <SelectTrigger className="w-fit whitespace-nowrap">
            <SelectValue placeholder="Select number of results" />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
            {[5, 10, 25, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={pageSize.toString()}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
        <p
          className="text-muted-foreground text-sm whitespace-nowrap"
          aria-live="polite"
        >
          <span className="text-foreground">
            {formatNumberWithSpaces(
              table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1
            )}
            {' - '}
            {formatNumberWithSpaces(
              Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                total
              )
            )}
          </span>
          {' of '}
          <span className="text-foreground">
            {formatNumberWithSpaces(total)}
          </span>
        </p>
      </div>
      <div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronFirstIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className="disabled:pointer-events-none disabled:opacity-50"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronLastIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default TransactionTablePagination
