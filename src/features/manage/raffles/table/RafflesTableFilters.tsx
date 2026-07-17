'use client'

import { Table as ReactTable } from '@tanstack/react-table'
import { PlusIcon, RefreshCcw } from 'lucide-react'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import SearchableTextFilter from '@/components/table/SearchableTextFilter'
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
import { guildBasePath } from '@/lib/guild/guildBasePath'
import {
  createExclusiveOwnerEntityFilterHandlers,
  getEntityFilterOptions,
  getOwnerFilterMembers
} from '@/lib/table/exclusiveOwnerEntityFilters'
import { TRaffleRow } from '@/types/types'

import CreateRaffleDialog from '../CreateRaffleDialog'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'all', label: 'All' }
] as const

const RafflesTableFilters = ({
  guildId,
  table,
  raffles,
  guildMembers,
  isLoading,
  setIsLoading,
  status,
  onStatusChange,
  raffleConfigured,
  raffleFeatureBlocked,
  raffleFeatureBlockMessage
}: {
  guildId: string
  table: ReactTable<TRaffleRow>
  raffles: TRaffleRow[]
  guildMembers: SearchableUserOption[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  status: string
  onStatusChange: (status: string) => void
  raffleConfigured: boolean
  raffleFeatureBlocked: boolean
  raffleFeatureBlockMessage: string | null
}) => {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const createDisabled = !raffleConfigured || raffleFeatureBlocked

  const createTooltip = raffleFeatureBlocked
    ? raffleFeatureBlockMessage
    : !raffleConfigured
      ? 'Configure the raffle actions channel first.'
      : 'Create a new raffle in Discord'

  const userIdFilter = table.getColumn('userId')?.getFilterValue() as
    | string
    | undefined
  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  const raffleOptions = useMemo(
    () =>
      raffles.map((raffle) => ({
        value: raffle.raffleId,
        label: raffle.channelName,
        sublabel: raffle.raffleId
      })),
    [raffles]
  )

  const ownerEntityRows = useMemo(
    () =>
      raffles.map((raffle) => ({
        entityId: raffle.raffleId,
        ownerId: raffle.creatorId
      })),
    [raffles]
  )

  const { handleOwnerChange, handleEntityChange } =
    createExclusiveOwnerEntityFilterHandlers({
      table,
      options: raffleOptions,
      rows: ownerEntityRows
    })

  const ownerFilterMembers = getOwnerFilterMembers(
    guildMembers,
    searchValue,
    raffleOptions,
    ownerEntityRows
  )
  const entityFilterOptions = getEntityFilterOptions(
    raffleOptions,
    userIdFilter,
    ownerEntityRows
  )

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <SearchableUserFilter
            members={ownerFilterMembers}
            value={userIdFilter}
            placeholder="All creators"
            clearLabel="All creators"
            onChange={handleOwnerChange}
          />
          <SearchableTextFilter
            options={entityFilterOptions}
            value={searchValue}
            placeholder="All raffles"
            clearLabel="All raffles"
            inputPlaceholder="Search by ID or channel..."
            onChange={handleEntityChange}
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
              <span>
                <Button
                  variant="outline"
                  disabled={createDisabled}
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon className="-ms-1 opacity-60" size={16} />
                  Create raffle
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {!raffleConfigured && !raffleFeatureBlocked ? (
                <p>
                  Configure the raffle actions channel in{' '}
                  <Link
                    href={`${guildBasePath(guildId)}/channel-settings`}
                    className="underline"
                  >
                    Channel settings
                  </Link>
                  .
                </p>
              ) : (
                <p>{createTooltip}</p>
              )}
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

      <CreateRaffleDialog
        guildId={guildId}
        raffleConfigured={raffleConfigured}
        raffleFeatureBlocked={raffleFeatureBlocked}
        raffleFeatureBlockMessage={raffleFeatureBlockMessage}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  )
}

export default RafflesTableFilters
