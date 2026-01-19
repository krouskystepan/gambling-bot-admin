'use client'

import {
  PaginationState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Table } from '@/components/ui/table'
import { formatNumberToReadableString } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

import UserTableBody from './UserTableBody'
import UserTableFooter from './UserTableFooter'
import UserTableHeader from './UserTableHeader'
import UserTablePagination from './UserTablePagination'
import { userColumns } from './userColumns'

type UserTableProps = {
  users: TGuildMemberStatus[]
  guildId: string
  managerId: string
}

const UserTable = ({ users, guildId, managerId }: UserTableProps) => {
  const [data, setData] = useState(users)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'balance',
      desc: true
    }
  ])
  const inputRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: userColumns({ guildId, managerId, setData }),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const totalBalance = data
    .filter((u) => u.registered)
    .reduce((acc, u) => acc + (u.balance || 0), 0)

  const totalNetProfit = data
    .filter((u) => u.registered)
    .reduce((acc, u) => acc + (u.netProfit || 0), 0)

  const totalBalanceStr = `$${formatNumberToReadableString(totalBalance)}`
  const totalProfitStr = `$${formatNumberToReadableString(totalNetProfit)}`

  return (
    <div className="w-5xl space-y-4">
      <Input
        ref={inputRef}
        placeholder="Search by username, nickname or ID..."
        onChange={(e) =>
          table.getColumn('username')?.setFilterValue(e.target.value)
        }
        className="mb-4 max-w-xs"
      />

      <div className="overflow-hidden rounded-md border">
        <Table className="w-full table-auto">
          <UserTableHeader table={table} />
          <UserTableBody table={table} />
          <UserTableFooter
            totalBalanceStr={totalBalanceStr}
            totalNetProfit={totalNetProfit}
            totalProfitStr={totalProfitStr}
            data={data}
          />
        </Table>
      </div>

      <UserTablePagination table={table} />
    </div>
  )
}

export default UserTable
