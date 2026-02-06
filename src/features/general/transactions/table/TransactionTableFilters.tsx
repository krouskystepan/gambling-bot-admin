import { Table as ReactTable } from '@tanstack/react-table'
import { Columns3Icon, RefreshCcw } from 'lucide-react'

import { Dispatch, RefObject, SetStateAction } from 'react'

import { useRouter } from 'next/navigation'

import DatePicker from '@/components/DatePicker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import TransactionFilter from './TransactionTableFilter'
import TransactionSearch from './TransactionTableSearch'
import { sourceBadgeMap, typeBadgeMap } from './transactionBadges'

const TransactionTableFilters = ({
  table,
  counts,
  isLoading,
  setIsLoading,
  userSearchRef,
  adminSearchRef
}: {
  table: ReactTable<TTransactionDiscord>
  counts: ITransactionCounts
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  userSearchRef: RefObject<HTMLInputElement | null>
  adminSearchRef: RefObject<HTMLInputElement | null>
}) => {
  const router = useRouter()

  type Option<T = string> = {
    value: string
    label: string
    realValue: T
  }

  function mapToOptions<T extends string>(
    entries: Record<T, string>
  ): Option<T>[] {
    return Object.keys(entries).map((key, idx) => ({
      value: `${key}-${idx}`,
      label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
      realValue: key as T
    }))
  }

  const typeOptions = mapToOptions(typeBadgeMap)
  const sourceOptions = mapToOptions(sourceBadgeMap)

  function getSelectedOptions<T extends string>(
    table: ReactTable<TTransactionDiscord>,
    columnId: string,
    options: Option<T>[]
  ): Option<T>[] {
    return (
      (table.getColumn(columnId)?.getFilterValue() as T[] | undefined)
        ?.map((val) => options.find((opt) => opt.realValue === val))
        .filter((opt): opt is Option<T> => !!opt) || []
    )
  }

  const selectedTypeOptions = getSelectedOptions(table, 'type', typeOptions)
  const selectedSourceOptions = getSelectedOptions(
    table,
    'source',
    sourceOptions
  )

  const usernameInputFilter = table.getColumn('username')?.getFilterValue() as
    | string
    | undefined
  const adminInputFilter = table
    .getColumn('handledByUsername')
    ?.getFilterValue() as string | undefined

  function toLocalDateString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function fromLocalDateString(str: string): Date {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d, 12)
  }
  const createdAtFilter = table.getColumn('createdAt')?.getFilterValue() as
    | [string, string]
    | undefined

  return (
    <div className="flex justify-between gap-2">
      <div className="flex min-w-0 flex-1 gap-2">
        <TransactionSearch
          table={table}
          inputRef={userSearchRef}
          placeholder="Search by user ID..."
          inputType="username"
          initialValue={usernameInputFilter}
        />

        <TransactionSearch
          table={table}
          inputRef={adminSearchRef}
          placeholder="Search by admin ID or bet ID..."
          inputType="handledByUsername"
          initialValue={adminInputFilter}
        />
      </div>
      <div className="flex gap-2">
        <DatePicker
          initialRange={
            createdAtFilter
              ? {
                  from: fromLocalDateString(createdAtFilter[0]),
                  to: fromLocalDateString(createdAtFilter[1])
                }
              : undefined
          }
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
          title="Type"
          columnId="type"
          options={typeOptions}
          selected={selectedTypeOptions}
          counts={counts.type}
          onChange={(next) => {
            table
              .getColumn('type')
              ?.setFilterValue(
                next.length ? next.map((o) => o.realValue) : undefined
              )
          }}
        />

        <TransactionFilter
          title="Source"
          columnId="source"
          options={sourceOptions}
          selected={selectedSourceOptions}
          counts={counts.source}
          onChange={(next) => {
            table
              .getColumn('source')
              ?.setFilterValue(
                next.length ? next.map((o) => o.realValue) : undefined
              )
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9.5">
              <Columns3Icon size={16} className="-ms-1 size-4 opacity-60" />{' '}
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

        <Button
          variant="secondary"
          onClick={() => {
            setIsLoading(true)
            const url = new URL(window.location.href)
            router.replace(url.pathname + url.search, { scroll: false })
          }}
          className="flex h-9.5 items-center justify-between"
          disabled={isLoading}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
    </div>
  )
}

export default TransactionTableFilters
