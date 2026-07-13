import { Table as ReactTable } from '@tanstack/react-table'
import { Columns3Icon, Eraser, RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import DatePicker from '@/components/form/DatePicker'
import SearchableUserFilter, {
  type SearchableUserOption
} from '@/components/table/SearchableUserFilter'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useRegisterAtmQueueBusy } from '@/features/general/atm-queue/AtmQueueLiveUpdateContext'
import TransactionFilter from '@/features/general/transactions/table/TransactionTableFilter'
import {
  filterMembersByEntityFacet,
  isEntityCompatibleWithFacet
} from '@/lib/table/facetFilters'
import { IAtmRequestCounts, TAtmRequestDiscord } from '@/types/types'

const statusOptions = [
  { value: 'pending-0', label: 'Pending', realValue: 'pending' as const },
  { value: 'approved-1', label: 'Approved', realValue: 'approved' as const },
  { value: 'rejected-2', label: 'Rejected', realValue: 'rejected' as const },
  {
    value: 'cancelled-3',
    label: 'Cancelled',
    realValue: 'cancelled' as const
  }
]

const typeOptions = [
  { value: 'deposit-0', label: 'Deposit', realValue: 'deposit' as const },
  { value: 'withdraw-1', label: 'Withdraw', realValue: 'withdraw' as const }
]

const AtmQueueTableFilters = ({
  table,
  counts,
  guildMembers,
  isLoading,
  setIsLoading
}: {
  table: ReactTable<TAtmRequestDiscord>
  counts: IAtmRequestCounts
  guildMembers: SearchableUserOption[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}) => {
  const router = useRouter()
  const [openFilterPopovers, setOpenFilterPopovers] = useState<Set<string>>(
    () => new Set()
  )

  const handleFilterPopoverOpenChange = useCallback(
    (filterId: string) => (open: boolean) => {
      setOpenFilterPopovers((prev) => {
        const next = new Set(prev)
        if (open) {
          next.add(filterId)
        } else {
          next.delete(filterId)
        }
        return next
      })
    },
    []
  )

  useRegisterAtmQueueBusy('filter-popovers', openFilterPopovers.size > 0)

  const userIdFilter = table.getColumn('userId')?.getFilterValue() as
    | string
    | undefined

  const selectedStatusOptions = statusOptions.filter((option) =>
    (
      table.getColumn('status')?.getFilterValue() as string[] | undefined
    )?.includes(option.realValue)
  )

  const selectedTypeOptions = typeOptions.filter((option) =>
    (
      table.getColumn('type')?.getFilterValue() as string[] | undefined
    )?.includes(option.realValue)
  )

  const createdAtFilter = table.getColumn('createdAt')?.getFilterValue() as
    | [string, string]
    | undefined

  const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const fromLocalDateString = (str: string): Date => {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d, 12)
  }

  const datePickerValue =
    createdAtFilter?.[0] && createdAtFilter[1]
      ? {
          from: fromLocalDateString(createdAtFilter[0]),
          to: fromLocalDateString(createdAtFilter[1])
        }
      : undefined

  const handleClearFilters = () => {
    table.resetColumnFilters()
    table.getColumn('status')?.setFilterValue(['pending'])
    router.replace(`${window.location.pathname}?filterStatus=pending`, {
      scroll: false
    })
  }

  const userMembers = useMemo(
    () =>
      filterMembersByEntityFacet(
        guildMembers,
        userIdFilter,
        counts.users,
        true
      ),
    [counts.users, guildMembers, userIdFilter]
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <SearchableUserFilter
          members={userMembers}
          value={userIdFilter}
          onOpenChange={handleFilterPopoverOpenChange('user')}
          onChange={(userId) => {
            if (
              userId &&
              !isEntityCompatibleWithFacet(userId, counts.users, true)
            ) {
              return
            }

            table.getColumn('userId')?.setFilterValue(userId)
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DatePicker
          value={datePickerValue}
          onOpenChange={handleFilterPopoverOpenChange('date')}
          onChange={(range) => {
            const col = table.getColumn('createdAt')
            if (!col) return

            if (range?.from && range?.to) {
              col.setFilterValue([
                toLocalDateString(range.from),
                toLocalDateString(range.to)
              ])
            } else {
              col.setFilterValue(undefined)
            }
          }}
        />

        <TransactionFilter
          title="Status"
          columnId="status"
          options={statusOptions}
          selected={selectedStatusOptions}
          onOpenChange={handleFilterPopoverOpenChange('status')}
          counts={{
            pending: counts.pending,
            approved: counts.approved,
            rejected: counts.rejected,
            cancelled: counts.cancelled
          }}
          onChange={(next) => {
            table
              .getColumn('status')
              ?.setFilterValue(
                next.length ? next.map((option) => option.realValue) : undefined
              )
          }}
        />

        <TransactionFilter
          title="Type"
          columnId="type"
          options={typeOptions}
          selected={selectedTypeOptions}
          onOpenChange={handleFilterPopoverOpenChange('type')}
          counts={counts.type}
          onChange={(next) => {
            table
              .getColumn('type')
              ?.setFilterValue(
                next.length ? next.map((option) => option.realValue) : undefined
              )
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9.5">
              <Columns3Icon size={16} className="-ms-1 size-4 opacity-60" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {(col.columnDef.meta as { label: string })?.label ??
                    (typeof col.columnDef.header === 'string'
                      ? col.columnDef.header
                      : col.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="flex h-9.5 items-center justify-center"
              variant="secondary"
              size="icon"
              onClick={handleClearFilters}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear filters</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true)
                router.refresh()
              }}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh Data</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default AtmQueueTableFilters
