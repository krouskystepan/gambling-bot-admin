'use client'

import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { CustomTableBody, CustomTableHeader } from '@/components/table'
import { Table } from '@/components/ui/table'

import ExportCsvButton from '../components/ExportCsvButton'

type ReportTableProps<T> = {
  title: string
  description: string
  exportHref: string
  columns: ColumnDef<T>[]
  data: T[]
}

const ReportTable = <T,>({
  title,
  description,
  exportHref,
  columns,
  data
}: ReportTableProps<T>) => {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <section className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold leading-none">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0">
          <ExportCsvButton href={exportHref} />
        </div>
      </div>
      <Table className="w-full table-auto">
        <CustomTableHeader table={table} />
        <CustomTableBody table={table} isLoading={false} />
      </Table>
    </section>
  )
}

export default ReportTable
