import { Table as ReactTable } from '@tanstack/react-table'
import { RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction } from 'react'

import { useRouter } from 'next/navigation'

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
import { cn } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

import type { UserRegistrationFilter } from '../useUsers'

const registrationOptions = [
  { value: 'all', label: 'All' },
  { value: 'registered', label: 'Registered' },
  { value: 'not_registered', label: 'Not Registered' }
] as const

const UserTableFilters = ({
  table,
  guildMembers,
  registration,
  onRegistrationChange,
  isLoading,
  setIsLoading
}: {
  table: ReactTable<TGuildMemberStatus>
  guildMembers: SearchableUserOption[]
  registration: UserRegistrationFilter
  onRegistrationChange: (registration: UserRegistrationFilter) => void
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}) => {
  const router = useRouter()

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

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
          value={registration}
          onValueChange={(value) => {
            onRegistrationChange(value as UserRegistrationFilter)
          }}
        >
          <SelectTrigger
            className={cn(
              'h-9.5 w-44',
              registration === 'all' && 'text-muted-foreground'
            )}
          >
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {registrationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
  )
}

export default UserTableFilters
