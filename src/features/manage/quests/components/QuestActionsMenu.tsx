'use client'

import type { TQuest } from 'gambling-bot-shared/quests'
import { EllipsisIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { toggleQuestEnabled } from '@/actions/database/questActions.action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

import EditQuestDialog from './EditQuestDialog'

type QuestActionsMenuProps = {
  guildId: string
  quest: TQuest
  questFeatureBlocked: boolean
  questFeatureBlockMessage: string | null
}

const QuestActionsMenu = ({
  guildId,
  quest,
  questFeatureBlocked,
  questFeatureBlockMessage
}: QuestActionsMenuProps) => {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleToggleEnabled = async () => {
    if (questFeatureBlocked || toggling) return

    setMenuOpen(false)
    setToggling(true)
    try {
      const result = await toggleQuestEnabled(
        guildId,
        quest.questId,
        !quest.enabled
      )
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to update quest.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Quest actions</DropdownMenuLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <DropdownMenuItem
                  disabled={questFeatureBlocked}
                  onClick={() => {
                    if (questFeatureBlocked) return
                    setMenuOpen(false)
                    setEditOpen(true)
                  }}
                >
                  Edit quest
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            {questFeatureBlocked && questFeatureBlockMessage ? (
              <TooltipContent className="max-w-xs">
                <p>{questFeatureBlockMessage}</p>
              </TooltipContent>
            ) : null}
          </Tooltip>
          <DropdownMenuSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <DropdownMenuItem
                  disabled={questFeatureBlocked || toggling}
                  onClick={handleToggleEnabled}
                >
                  {quest.enabled ? 'Disable quest' : 'Enable quest'}
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            {questFeatureBlocked && questFeatureBlockMessage ? (
              <TooltipContent className="max-w-xs">
                <p>{questFeatureBlockMessage}</p>
              </TooltipContent>
            ) : null}
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditQuestDialog
        guildId={guildId}
        quest={quest}
        questFeatureBlocked={questFeatureBlocked}
        questFeatureBlockMessage={questFeatureBlockMessage}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}

export default QuestActionsMenu
