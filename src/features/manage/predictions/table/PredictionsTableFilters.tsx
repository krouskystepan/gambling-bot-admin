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
import { TPredictionRow } from '@/types/types'

import CreatePredictionDialog from '../components/CreatePredictionDialog'
import PredictionsTableSearch from './PredictionsTableSearch'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'paying', label: 'Paying' },
  { value: 'paid', label: 'Paid' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'all', label: 'All' }
] as const

const PredictionsTableFilters = ({
  guildId,
  table,
  isLoading,
  setIsLoading,
  searchRef,
  status,
  onStatusChange,
  predictionConfigured,
  logsChannelConfigured,
  predictionFeatureBlocked,
  predictionFeatureBlockMessage
}: {
  guildId: string
  table: ReactTable<TPredictionRow>
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  searchRef: RefObject<HTMLInputElement | null>
  status: string
  onStatusChange: (status: string) => void
  predictionConfigured: boolean
  logsChannelConfigured: boolean
  predictionFeatureBlocked: boolean
  predictionFeatureBlockMessage: string | null
}) => {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const channelsConfigured = predictionConfigured && logsChannelConfigured
  const createDisabled = !channelsConfigured || predictionFeatureBlocked

  const createTooltip = predictionFeatureBlocked
    ? predictionFeatureBlockMessage
    : !channelsConfigured
      ? 'Configure prediction actions and logs channels first.'
      : 'Create a new prediction in Discord'

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  return (
    <>
      {!channelsConfigured ? (
        <p className="text-sm text-muted-foreground">
          Prediction channels are not fully configured. Set actions and logs in{' '}
          <Link
            href={`/dashboard/g/${guildId}/channel-settings`}
            className="text-primary hover:underline"
          >
            Channel settings
          </Link>
          .
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <PredictionsTableSearch
          table={table}
          inputRef={searchRef}
          columnId="search"
          placeholder="Search by title, ID, or creator..."
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
                  Create prediction
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{createTooltip}</p>
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

      <CreatePredictionDialog
        guildId={guildId}
        channelsConfigured={channelsConfigured}
        predictionFeatureBlocked={predictionFeatureBlocked}
        predictionFeatureBlockMessage={predictionFeatureBlockMessage}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  )
}

export default PredictionsTableFilters
