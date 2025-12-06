import { TTransactionDiscord, ITransactionCounts } from '@/types/types'
import { Table as ReactTable } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Columns3Icon, RefreshCcw } from 'lucide-react'
import DatePicker from '../../DatePicker'
import { useRouter } from 'next/navigation'
import { sourceBadgeMap, typeBadgeMap } from './transactionBadges'
import TransactionSearch from './TransactionTableSearch'
import TransactionFilter from './TransactionTableFilter'
import { Dispatch, RefObject, SetStateAction } from 'react'

const TransactionTableFilters = ({
  table,
  counts,
  isLoading,
  setIsLoading,
  userSearchRef,
  adminSearchRef,
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
      realValue: key as T,
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

  const createdAtFilter = table.getColumn('createdAt')?.getFilterValue() as
    | [Date | undefined, Date | undefined]
    | undefined

  return (
    <div className="flex justify-between gap-2">
      <div className="flex gap-2 flex-1 min-w-0">
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
              ? { from: createdAtFilter[0]!, to: createdAtFilter[1]! }
              : undefined
          }
          onChange={(range) => {
            table
              .getColumn('createdAt')
              ?.setFilterValue(range ? [range.from, range.to] : undefined)
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
            <Button variant="outline" className="h-[38px]">
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
          className="h-[38px] flex justify-between items-center"
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
