import { Table as ReactTable } from '@tanstack/react-table'
import { STAFF_ACTION_CATEGORIES } from 'gambling-bot-shared/transactions'
import { Download, Eraser, RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import type {
  StaffActionCounts,
  StaffActionEntityFacets,
  StaffActionRow
} from '@/actions/database/staffActions.action'
import DatePicker from '@/components/form/DatePicker'
import SearchableUserFilter, {
  type SearchableUserOption
} from '@/components/table/SearchableUserFilter'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import TransactionFilter from '@/features/general/transactions/table/TransactionTableFilter'
import { downloadCsvFile } from '@/lib/export/downloadCsv'
import { buildStaffActionsExportUrl } from '@/lib/export/exportUrls'
import {
  filterMembersByEntityFacet,
  isEntityCompatibleWithFacet
} from '@/lib/table/facetFilters'
import { cn } from '@/lib/utils'

const STAFF_ACTION_CATEGORY_LABELS: Record<
  (typeof STAFF_ACTION_CATEGORIES)[number],
  string
> = {
  balance: 'Balance',
  atm: 'ATM',
  vip: 'VIP',
  raffle: 'Raffle',
  prediction: 'Prediction',
  ban: 'Ban',
  unban: 'Unban',
  user: 'Notes'
}

const categoryOptions = STAFF_ACTION_CATEGORIES.map((category, index) => ({
  value: `${category}-${index}`,
  label: STAFF_ACTION_CATEGORY_LABELS[category],
  realValue: category
}))

const StaffActionsTableFilters = ({
  guildId,
  table,
  counts,
  entityFacets,
  staffMembers,
  guildMembers,
  isLoading,
  setIsLoading
}: {
  guildId: string
  table: ReactTable<StaffActionRow>
  counts: StaffActionCounts
  entityFacets: StaffActionEntityFacets
  staffMembers: { userId: string; username: string }[]
  guildMembers: SearchableUserOption[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}) => {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined
  const staffIdFilter = table.getColumn('staffId')?.getFilterValue() as
    | string
    | undefined
  const selectedCategoryOptions = categoryOptions.filter((option) =>
    (
      table.getColumn('category')?.getFilterValue() as string[] | undefined
    )?.includes(option.realValue)
  )
  const occurredAtFilter = table.getColumn('occurredAt')?.getFilterValue() as
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
    occurredAtFilter?.[0] && occurredAtFilter[1]
      ? {
          from: fromLocalDateString(occurredAtFilter[0]),
          to: fromLocalDateString(occurredAtFilter[1])
        }
      : undefined

  const userMembers = useMemo(
    () =>
      filterMembersByEntityFacet(
        guildMembers,
        searchValue,
        entityFacets.users,
        Boolean(staffIdFilter)
      ),
    [entityFacets.users, guildMembers, searchValue, staffIdFilter]
  )

  const visibleStaffMembers = useMemo(
    () =>
      filterMembersByEntityFacet(
        staffMembers,
        staffIdFilter,
        entityFacets.staff,
        Boolean(searchValue)
      ),
    [entityFacets.staff, searchValue, staffIdFilter, staffMembers]
  )

  const handleClearFilters = () => {
    table.resetColumnFilters()
    router.replace(window.location.pathname, { scroll: false })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const href = buildStaffActionsExportUrl(guildId, window.location.search)
      await downloadCsvFile(href, `staff-actions-${guildId}.csv`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <SearchableUserFilter
          members={userMembers}
          value={searchValue}
          onChange={(userId) => {
            if (
              userId &&
              staffIdFilter &&
              !isEntityCompatibleWithFacet(userId, entityFacets.users, true)
            ) {
              return
            }

            table.getColumn('search')?.setFilterValue(userId)
          }}
        />

        <Select
          value={staffIdFilter ?? 'all'}
          onValueChange={(value) => {
            const nextStaffId = value === 'all' ? undefined : value

            if (
              nextStaffId &&
              searchValue &&
              !isEntityCompatibleWithFacet(
                nextStaffId,
                entityFacets.staff,
                true
              )
            ) {
              return
            }

            table.getColumn('staffId')?.setFilterValue(nextStaffId)
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DatePicker
          value={datePickerValue}
          onChange={(range) => {
            const col = table.getColumn('occurredAt')
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
          title="Action"
          options={categoryOptions}
          selected={selectedCategoryOptions}
          counts={counts}
          columnId="category"
          onChange={(next) => {
            table
              .getColumn('category')
              ?.setFilterValue(next.map((option) => option.realValue))
          }}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="flex h-9.5 items-center justify-center"
              variant="secondary"
              size="icon"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export CSV</p>
          </TooltipContent>
        </Tooltip>

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
              onClick={() => {
                setIsLoading(true)
                const url = new URL(window.location.href)
                router.replace(url.pathname + url.search, { scroll: false })
              }}
              disabled={isLoading}
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

export default StaffActionsTableFilters
