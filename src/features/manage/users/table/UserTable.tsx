'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

import { useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  CustomTableBody,
  CustomTableHeader,
  CustomTablePagination,
  ServerTablePageLayout
} from '@/components/table'
import { Table } from '@/components/ui/table'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useServerTable } from '@/hooks/useServerTable'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { isMemberCompatibleWithRegistration } from '@/lib/table/registrationMemberFilters'
import { TGuildMemberStatus } from '@/types/types'

import type { UserRegistrationFilter } from '../useUsers'
import UserTableFooter from './UserTableFooter'
import UsersTableFilters from './UsersTableFilters'
import { userColumns } from './userColumns'

type UserTableProps = {
  globalSettings: GlobalSettings
  isGuildAdmin: boolean
  users: TGuildMemberStatus[]
  page: number
  limit: number
  total: number
  guildId: string
  managerId: string
  registration: UserRegistrationFilter
  guildMembers: {
    userId: string
    username: string
    nickname: string | null
    avatarUrl: string
  }[]
  registeredUserIds: string[]
}

const UserTable = ({
  globalSettings,
  isGuildAdmin,
  users,
  page,
  limit,
  total,
  guildId,
  managerId,
  registration,
  guildMembers,
  registeredUserIds
}: UserTableProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

  const { table, isLoading, setIsLoading, isTableReady } =
    useServerTable<TGuildMemberStatus>({
      data: users,
      page,
      limit,
      total,
      columns: userColumns({
        guildId,
        managerId,
        globalSettings,
        isGuildAdmin,
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
      },

      urlHydration: {
        searchParams,
        filters: (params) => {
          const search = params.get('search') || ''

          return search ? [{ id: 'search', value: search }] : []
        }
      }
    })

  const showTableLoading = isLoading || !isTableReady

  useEffect(() => {
    setIsLoading(false)
  }, [setIsLoading, users])

  const handleRegistrationChange = (next: UserRegistrationFilter) => {
    setIsLoading(true)

    const search = table.getColumn('search')?.getFilterValue() as
      | string
      | undefined
    const registeredIds = new Set(registeredUserIds)
    const searchIncompatible =
      search && !isMemberCompatibleWithRegistration(search, next, registeredIds)

    updateUrl({
      page: 1,
      registration: next === 'all' ? undefined : next,
      search: searchIncompatible ? undefined : search || undefined
    })

    if (searchIncompatible) {
      table.getColumn('search')?.setFilterValue(undefined)
    }
  }

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
          guildMembers={guildMembers}
          registeredUserIds={registeredUserIds}
          registration={registration}
          onRegistrationChange={handleRegistrationChange}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      }
      pagination={<CustomTablePagination table={table} total={total} />}
    >
      <Table className="w-full table-auto">
        <CustomTableHeader table={table} isLoading={showTableLoading} />
        <CustomTableBody table={table} isLoading={showTableLoading} />
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
