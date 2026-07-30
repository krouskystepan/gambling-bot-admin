'use client'

import { Table as ReactTable } from '@tanstack/react-table'
import type { QuestKind, TQuest } from 'gambling-bot-shared/quests'
import { ListPlus, PlusIcon, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { seedDefaultQuests } from '@/actions/database/questActions.action'
import SearchableTextFilter from '@/components/table/SearchableTextFilter'
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

import CreateQuestDialog from '../components/CreateQuestDialog'

const kindOptions = [
  { value: 'all', label: 'All kinds' },
  { value: 'daily', label: 'Daily' },
  { value: 'normal', label: 'Normal' }
] as const

const QuestsTableFilters = ({
  guildId,
  table,
  quests,
  isLoading,
  setIsLoading,
  kind,
  onKindChange,
  questFeatureBlocked,
  questFeatureBlockMessage
}: {
  guildId: string
  table: ReactTable<TQuest>
  quests: TQuest[]
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  kind: QuestKind | 'all'
  onKindChange: (kind: string) => void
  questFeatureBlocked: boolean
  questFeatureBlockMessage: string | null
}) => {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const mutateDisabled = questFeatureBlocked
  const mutateTooltip =
    questFeatureBlockMessage ?? 'Create or seed quests for this server'

  const searchValue = table.getColumn('search')?.getFilterValue() as
    | string
    | undefined

  const questOptions = useMemo(
    () =>
      quests.map((quest) => ({
        value: quest.questId,
        label: quest.name,
        sublabel: quest.kind
      })),
    [quests]
  )

  const handleSeedDefaults = async () => {
    if (mutateDisabled) return

    setSeeding(true)
    try {
      const result = await seedDefaultQuests(guildId)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to add default quests.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <SearchableTextFilter
            options={questOptions}
            value={searchValue}
            placeholder="All quests"
            clearLabel="All quests"
            inputPlaceholder="Search by name or description..."
            onChange={(value) =>
              table.getColumn('search')?.setFilterValue(value)
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={kind} onValueChange={onKindChange}>
            <SelectTrigger className="h-9.5 w-36">
              <SelectValue placeholder="Kind" />
            </SelectTrigger>
            <SelectContent>
              {kindOptions.map((option) => (
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
                  disabled={mutateDisabled}
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon className="-ms-1 opacity-60" size={16} />
                  Create quest
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{mutateTooltip}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  disabled={mutateDisabled || seeding}
                  onClick={handleSeedDefaults}
                >
                  <ListPlus className="-ms-1 opacity-60" size={16} />
                  Add defaults
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Insert example daily and normal quests when their names are not
                already present.
              </p>
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

      <CreateQuestDialog
        guildId={guildId}
        questFeatureBlocked={questFeatureBlocked}
        questFeatureBlockMessage={questFeatureBlockMessage}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  )
}

export default QuestsTableFilters
