'use client'

import { Table as ReactTable } from '@tanstack/react-table'
import { RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { useRouter } from 'next/navigation'

import SearchableUserFilter from '@/components/SearchableUserFilter'
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
import {
  filterMembersByRegistration,
  getVisibleRegistrationOptions,
  isMemberCompatibleWithRegistration
} from '@/lib/table/registrationMemberFilters'
import { cn } from '@/lib/utils'
import { TGuildMemberStatus } from '@/types/types'

import type { UserRegistrationFilter } from '../useUsers'

const UserTableFilters = ({
  table,
  guildMembers,
  registeredUserIds,
  registration,
  onRegistrationChange,
  isLoading,
  setIsLoading
}: {
  table: ReactTable<TGuildMemberStatus>
  guildMembers: {
    userId: string
    username: string
    nickname: string | null
    avatarUrl: string
  }[]
  registeredUserIds: string[]
  registration: UserRegistrationFilter
  onRegistrationChange: (registration: UserRegistrationFilter) => void
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
}) => {
  const router = useRouter()

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  const registeredIds = useMemo(
    () => new Set(registeredUserIds),
    [registeredUserIds]
  )

  const memberOptions = useMemo(
    () =>
      filterMembersByRegistration(guildMembers, registration, registeredIds),
    [guildMembers, registration, registeredIds]
  )

  const visibleRegistrationOptions = useMemo(
    () => getVisibleRegistrationOptions(searchValue, registeredIds),
    [searchValue, registeredIds]
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <SearchableUserFilter
          members={memberOptions}
          value={searchValue}
          onChange={(userId) => {
            if (
              userId &&
              registration !== 'all' &&
              !isMemberCompatibleWithRegistration(
                userId,
                registration,
                registeredIds
              )
            ) {
              return
            }

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
            {visibleRegistrationOptions.map((option) => (
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
