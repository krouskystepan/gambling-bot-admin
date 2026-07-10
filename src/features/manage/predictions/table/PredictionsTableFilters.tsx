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
import { TPredictionRow } from '@/types/types'

import CreatePredictionDialog from '../components/CreatePredictionDialog'

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
  predictions,
  guildMembers,
  isLoading,
  setIsLoading,
  status,
  onStatusChange,
  predictionConfigured,
  logsChannelConfigured,
  predictionFeatureBlocked,
  predictionFeatureBlockMessage
}: {
  guildId: string
  table: ReactTable<TPredictionRow>
  predictions: TPredictionRow[]
  guildMembers: SearchableUserOption[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
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

  const userIdFilter = table.getColumn('userId')?.getFilterValue() as
    | string
    | undefined
  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  const predictionOptions = useMemo(
    () =>
      predictions.map((prediction) => ({
        value: prediction.predictionId,
        label: prediction.title,
        sublabel: prediction.predictionId
      })),
    [predictions]
  )

  const ownerEntityRows = useMemo(
    () =>
      predictions.map((prediction) => ({
        entityId: prediction.predictionId,
        ownerId: prediction.creatorId
      })),
    [predictions]
  )

  const { handleOwnerChange, handleEntityChange } =
    createExclusiveOwnerEntityFilterHandlers({
      table,
      options: predictionOptions,
      rows: ownerEntityRows
    })

  const ownerFilterMembers = getOwnerFilterMembers(
    guildMembers,
    searchValue,
    predictionOptions,
    ownerEntityRows
  )
  const entityFilterOptions = getEntityFilterOptions(
    predictionOptions,
    userIdFilter,
    ownerEntityRows
  )

  return (
    <>
      {!channelsConfigured ? (
        <p className="text-sm text-muted-foreground">
          Prediction channels are not fully configured. Set actions and logs in{' '}
          <Link
            href={`${guildBasePath(guildId)}/channel-settings`}
            className="text-primary hover:underline"
          >
            Channel settings
          </Link>
          .
        </p>
      ) : null}

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
            placeholder="All predictions"
            clearLabel="All predictions"
            inputPlaceholder="Search by title or ID..."
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
