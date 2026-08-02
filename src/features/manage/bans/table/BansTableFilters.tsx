'use client'

import { Table as ReactTable } from '@tanstack/react-table'
import { RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction } from 'react'

import { useRouter } from 'next/navigation'

import type { GuildBanRow } from '@/actions/database/guildBans.action'
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

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'all', label: 'All' }
] as const

const BansTableFilters = ({
  table,
  guildMembers,
  isLoading,
  setIsLoading,
  status,
  onStatusChange
}: {
  table: ReactTable<GuildBanRow>
  guildMembers: SearchableUserOption[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  status: string
  onStatusChange: (status: string) => void
}) => {
  const router = useRouter()

  const userIdFilter = table.getColumn('userId')?.getFilterValue() as
    | string
    | undefined

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <SearchableUserFilter
          members={guildMembers}
          value={userIdFilter}
          placeholder="All users"
          clearLabel="All users"
          onChange={(userId) => {
            table.getColumn('userId')?.setFilterValue(userId)
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9.5 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true)
                const url = new URL(window.location.href)
                router.replace(url.pathname + url.search, { scroll: false })
              }}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh data</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default BansTableFilters
