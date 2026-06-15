'use client'

import { Table as ReactTable } from '@tanstack/react-table'
import { PlusIcon, RefreshCcw } from 'lucide-react'

import { Dispatch, RefObject, SetStateAction, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import { TRaffleRow } from '@/types/types'

import CreateRaffleDialog from '../CreateRaffleDialog'
import RaffleTableSearch from './RaffleTableSearch'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'all', label: 'All' }
] as const

const RafflesTableFilters = ({
  guildId,
  table,
  isLoading,
  setIsLoading,
  searchRef,
  status,
  onStatusChange,
  raffleConfigured,
  raffleFeatureBlocked,
  raffleFeatureBlockMessage
}: {
  guildId: string
  table: ReactTable<TRaffleRow>
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  searchRef: RefObject<HTMLInputElement | null>
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

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <RaffleTableSearch
          table={table}
          inputRef={searchRef}
          columnId="search"
          placeholder="Search by ID, channel, or creator..."
          initialValue={searchValue}
        />

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
                    href={`/dashboard/g/${guildId}/channel-settings`}
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
