'use client'

import type { GlobalSettings } from 'gambling-bot-shared'

import { useEffect, useRef } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination,
  ServerTablePageLayout
} from '@/components/table'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useHydrateServerTableFromUrl } from '@/hooks/useHydrateServerTableFromUrl'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { formatGuildMoney } from '@/lib/guildMoney'
import { TGuildMemberStatus } from '@/types/types'

import UserTableFooter from './UserTableFooter'
import UsersTableFilters from './UsersTableFilters'
import { userColumns } from './userColumns'

type UserTableProps = {
  globalSettings: GlobalSettings
  users: TGuildMemberStatus[]
  page: number
  limit: number
  total: number
  guildId: string
  managerId: string
}

const UserTable = ({
  globalSettings,
  users,
  page,
  limit,
  total,
  guildId,
  managerId
}: UserTableProps) => {
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
        globalSettings,
        onUserUpdated: () => {
          router.refresh()
        }
      }),
      initialSorting: [{ id: 'balance', desc: true }],
      initialVisibility: { search: false },

      onSortingChange: (sorting) => {
        debouncedUpdateUrl({
          page: 1,
          sort: sorting
            .map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`)
            .join(',')
        })
      },

      onColumnFiltersChange: (filters) => {
        const search =
          (filters.find((f) => f.id === 'search')?.value as
            | string
            | undefined) ?? ''

        debouncedUpdateUrl({
          page: 1,
          search
        })
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
      const search = params.get('search') || ''

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

  const totalBalanceStr = formatGuildMoney(totalBalance, globalSettings)
  const totalProfitStr = formatGuildMoney(totalNetProfit, globalSettings)

  return (
    <ServerTablePageLayout
      toolbar={
        <UsersTableFilters
          table={table}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          searchRef={searchRef}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
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
    </ServerTablePageLayout>
  )
}

export default UserTable
