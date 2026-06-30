import { Table as ReactTable } from '@tanstack/react-table'
import { CASINO_GAME_IDS } from 'gambling-bot-shared/casino'
import {
  formatTransactionSourceLabel,
  formatTransactionTypeLabel
} from 'gambling-bot-shared/common'
import { Columns3Icon } from 'lucide-react'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { sourceBadgeMap, typeBadgeMap } from '@/components/badges/badgeStyles'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  filterMembersByEntityFacet,
  isEntityCompatibleWithFacet
} from '@/lib/table/facetFilters'
import { LEGACY_CASINO_GAME_KEY } from '@/lib/transactions/transactionFilters'
import { cn } from '@/lib/utils'
import { ITransactionCounts, TTransactionDiscord } from '@/types/types'

import TransactionExtraButtons from './TransactionExtraButtons'
import TransactionFilter from './TransactionTableFilter'
import { getCasinoGameFilterLabel } from './transactionFilterLabels'

const TransactionTableFilters = ({
  guildId,
  table,
  counts,
  isLoading,
  setIsLoading,
  staffMembers,
  guildMembers,
  hideUserSearch = false,
  hideDatePicker = false
}: {
  guildId: string
  table: ReactTable<TTransactionDiscord>
  counts: ITransactionCounts
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  staffMembers: { userId: string; username: string }[]
  guildMembers: SearchableUserOption[]
  hideUserSearch?: boolean
  hideDatePicker?: boolean
}) => {
  type Option<T = string> = {
    value: string
    label: string
    realValue: T
  }

  function mapToOptions<T extends string>(
    entries: Record<T, string>,
    formatLabel: (key: T) => string
  ): Option<T>[] {
    return (Object.keys(entries) as T[]).map((key, idx) => ({
      value: `${key}-${idx}`,
      label: formatLabel(key),
      realValue: key
    }))
  }

  const typeOptions = mapToOptions(typeBadgeMap, formatTransactionTypeLabel)
  const sourceOptions = mapToOptions(
    sourceBadgeMap,
    formatTransactionSourceLabel
  )
  const casinoGameOptions = [...CASINO_GAME_IDS, LEGACY_CASINO_GAME_KEY].map(
    (game, idx) => ({
      value: `${game}-${idx}`,
      label: getCasinoGameFilterLabel(game),
      realValue: game
    })
  )

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
  const selectedCasinoGameOptions = getSelectedOptions(
    table,
    'casinoGame',
    casinoGameOptions
  )
  const casinoSourceSelected = selectedSourceOptions.some(
    (option) => option.realValue === 'casino'
  )

  const userIdFilter = hideUserSearch
    ? undefined
    : (table.getColumn('username')?.getFilterValue() as string | undefined)
  const staffIdFilter = table.getColumn('handledBy')?.getFilterValue() as
    | string
    | undefined
  const referenceIdFilter = table.getColumn('referenceId')?.getFilterValue() as
    | string
    | undefined

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

  const datePickerValue =
    createdAtFilter?.[0] && createdAtFilter[1]
      ? {
          from: fromLocalDateString(createdAtFilter[0]),
          to: fromLocalDateString(createdAtFilter[1])
        }
      : undefined

  const userMembers = useMemo(
    () =>
      filterMembersByEntityFacet(
        guildMembers,
        userIdFilter,
        counts.users,
        Boolean(staffIdFilter)
      ),
    [counts.users, guildMembers, staffIdFilter, userIdFilter]
  )

  const visibleStaffMembers = useMemo(
    () =>
      filterMembersByEntityFacet(
        staffMembers,
        staffIdFilter,
        counts.staff,
        Boolean(userIdFilter)
      ),
    [counts.staff, staffIdFilter, staffMembers, userIdFilter]
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        {!hideUserSearch ? (
          <SearchableUserFilter
            members={userMembers}
            value={userIdFilter}
            onChange={(userId) => {
              if (
                userId &&
                staffIdFilter &&
                !isEntityCompatibleWithFacet(userId, counts.users, true)
              ) {
                return
              }

              table.getColumn('username')?.setFilterValue(userId)
            }}
          />
        ) : null}

        <Select
          value={staffIdFilter ?? 'all'}
          onValueChange={(value) => {
            const nextStaffId = value === 'all' ? undefined : value

            if (
              nextStaffId &&
              userIdFilter &&
              !isEntityCompatibleWithFacet(nextStaffId, counts.staff, true)
            ) {
              return
            }

            table.getColumn('handledBy')?.setFilterValue(nextStaffId)
          }}
        >
          <SelectTrigger
            className={cn(
              'h-9.5 w-44',
              !staffIdFilter && 'text-muted-foreground'
            )}
          >
            <SelectValue placeholder="All staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All staff</SelectItem>
            {visibleStaffMembers.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by reference ID..."
          value={referenceIdFilter ?? ''}
          onChange={(event) => {
            table
              .getColumn('referenceId')
              ?.setFilterValue(event.target.value || undefined)
          }}
          className="h-9.5 max-w-60"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!hideDatePicker ? (
          <DatePicker
            value={datePickerValue}
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
        ) : null}

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

            if (!next.some((option) => option.realValue === 'casino')) {
              table.getColumn('casinoGame')?.setFilterValue(undefined)
            }
          }}
        />

        {casinoSourceSelected ? (
          <TransactionFilter
            title="Game"
            columnId="casinoGame"
            options={casinoGameOptions}
            selected={selectedCasinoGameOptions}
            counts={counts.casinoGame}
            onChange={(next) => {
              table
                .getColumn('casinoGame')
                ?.setFilterValue(
                  next.length ? next.map((o) => o.realValue) : undefined
                )
            }}
          />
        ) : null}

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

        <TransactionExtraButtons
          guildId={guildId}
          table={table}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>
    </div>
  )
}

export default TransactionTableFilters
