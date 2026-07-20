import { Table as ReactTable } from '@tanstack/react-table'
import { Eraser, RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { useRouter } from 'next/navigation'

import type {
  SettingsChangeCounts,
  SettingsChangeEntityFacets,
  SettingsChangeRow
} from '@/actions/database/settingsChanges.action'
import DatePicker from '@/components/form/DatePicker'
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
import {
  SETTINGS_CHANGE_SECTIONS,
  SETTINGS_CHANGE_SECTION_LABELS
} from '@/lib/settingsAudit/settingsChangeSections'
import { filterMembersByEntityFacet } from '@/lib/table/facetFilters'
import { cn } from '@/lib/utils'

const sectionOptions = SETTINGS_CHANGE_SECTIONS.map((section, index) => ({
  value: `${section}-${index}`,
  label: SETTINGS_CHANGE_SECTION_LABELS[section],
  realValue: section
}))

const SettingsChangesTableFilters = ({
  table,
  counts,
  entityFacets,
  staffMembers,
  isLoading,
  setIsLoading
}: {
  table: ReactTable<SettingsChangeRow>
  counts: SettingsChangeCounts
  entityFacets: SettingsChangeEntityFacets
  staffMembers: { userId: string; username: string }[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}) => {
  const router = useRouter()

  const staffIdFilter = table.getColumn('staffId')?.getFilterValue() as
    | string
    | undefined
  const selectedSectionOptions = sectionOptions.filter((option) =>
    (
      table.getColumn('section')?.getFilterValue() as string[] | undefined
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

  const visibleStaffMembers = useMemo(
    () =>
      filterMembersByEntityFacet(
        staffMembers,
        staffIdFilter,
        entityFacets.staff,
        false
      ),
    [entityFacets.staff, staffIdFilter, staffMembers]
  )

  const handleClearFilters = () => {
    table.resetColumnFilters()
    router.replace(window.location.pathname, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <Select
          value={staffIdFilter ?? 'all'}
          onValueChange={(value) => {
            const nextStaffId = value === 'all' ? undefined : value
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
          title="Section"
          options={sectionOptions}
          selected={selectedSectionOptions}
          counts={counts}
          columnId="section"
          onChange={(next) => {
            table
              .getColumn('section')
              ?.setFilterValue(next.map((option) => option.realValue))
          }}
        />

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

export default SettingsChangesTableFilters
