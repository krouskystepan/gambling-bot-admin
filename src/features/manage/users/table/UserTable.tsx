'use client'

import { useEffect, useRef } from 'react'

import { useSearchParams } from 'next/dist/client/components/navigation'
import { useRouter } from 'next/navigation'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination
} from '@/components/table'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useHydrateServerTableFromUrl } from '@/hooks/useHydrateServerTableFromUrl'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { formatNumberToReadableString } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

import UserTableFooter from './UserTableFooter'
import UsersTableFilters from './UsersTableFilters'
import { userColumns } from './userColumns'

type UserTableProps = {
  users: TGuildMemberStatus[]
  page: number
  limit: number
  total: number
  guildId: string
  managerId: string
}

const UserTable = ({
  users,
  page,
  limit,
  total,
  guildId,
  managerId
}: UserTableProps) => {
  const isHydratingRef = useRef(false)

  const router = useRouter()

  const { table, isLoading, setIsLoading } = useServerTable<TGuildMemberStatus>(
    {
      data: users,
      page,
      limit,
      total,
      columns: userColumns({
        guildId,
        managerId,
        onUserUpdated: () => {
          const url = new URL(window.location.href)
          router.replace(url.pathname + url.search, { scroll: false })
        }
      }),
      initialSorting: [{ id: 'balance', desc: true }],
      initialVisibility: { search: false },

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          sort: sorting
            .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        if (isHydratingRef.current) return

        const search =
          (filters.find((f) => f.id === 'search')?.value as
            | string
            | undefined) ?? ''
        debouncedUpdateUrl({ search })
      },

      onPaginationChange: (pagination) => {
        debouncedUpdateUrl({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        })
      }
    }
  )

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, users])

  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const searchParams = useSearchParams()

  const searchRef = useRef<HTMLInputElement>(null)

  useHydrateServerTableFromUrl(table, searchParams, {
    filters: (params) => {
      isHydratingRef.current = true

      const search = params.get('search') || ''

      setTimeout(() => {
        isHydratingRef.current = false
      }, 0)

      return search ? [{ id: 'search', value: search }] : []
    }
  })

  const rows = table.getRowModel().rows.map((r) => r.original)

  const totalBalance = rows
    .filter((u) => u.registered)
    .reduce((acc, u) => acc + (u.balance || 0), 0)

  const totalNetProfit = rows
    .filter((u) => u.registered)
    .reduce((acc, u) => acc + (u.netProfit || 0), 0)

  const totalBalanceStr = `$${formatNumberToReadableString(totalBalance)}`
  const totalProfitStr = `$${formatNumberToReadableString(totalNetProfit)}`

  return (
    <div className="w-5xl space-y-4">
      <UsersTableFilters
        table={table}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        searchRef={searchRef}
      />

      <div className="overflow-hidden rounded-md border">
        <Table className="w-full table-auto">
          <CustomTableHeader table={table} />
          <CustomTableBody table={table} isLoading={isLoading} />
          <UserTableFooter
            totalBalanceStr={totalBalanceStr}
            totalNetProfit={totalNetProfit}
            totalProfitStr={totalProfitStr}
            data={users}
          />
        </Table>
      </div>

      <CustomTablePagination table={table} total={total} />
    </div>
  )
}

export default UserTable
