import { Table as ReactTable } from '@tanstack/react-table'
import { STAFF_ACTION_CATEGORIES } from 'gambling-bot-shared/transactions'
import { Download, Eraser, RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction, useState } from 'react'

import { useRouter } from 'next/navigation'

import type {
  StaffActionCounts,
  StaffActionRow
} from '@/actions/database/staffActions.action'
import DatePicker from '@/components/DatePicker'
import SearchableUserFilter, {
  type SearchableUserOption
} from '@/components/SearchableUserFilter'
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
import { cn } from '@/lib/utils'

const categoryOptions = STAFF_ACTION_CATEGORIES.map((category, index) => ({
  value: `${category}-${index}`,
  label: category.charAt(0).toUpperCase() + category.slice(1),
  realValue: category
}))

const StaffActionsTableFilters = ({
  guildId,
  table,
  counts,
  staffMembers,
  guildMembers,
  isLoading,
  setIsLoading
}: {
  guildId: string
  table: ReactTable<StaffActionRow>
  counts: StaffActionCounts
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
          members={guildMembers}
          value={searchValue}
          onChange={(userId) => {
            table.getColumn('search')?.setFilterValue(userId)
          }}
        />

        <Select
          value={staffIdFilter ?? 'all'}
          onValueChange={(value) => {
            table
              .getColumn('staffId')
              ?.setFilterValue(value === 'all' ? undefined : value)
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
            {staffMembers.map((member) => (
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
