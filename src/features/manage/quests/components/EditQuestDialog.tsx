'use client'

import type { TQuest } from 'gambling-bot-shared/quests'
import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { updateQuest } from '@/actions/database/questActions.action'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import QuestFormFields, {
  type QuestFormState,
  isQuestFormValid,
  parseQuestFormValues,
  questToFormState
} from './QuestFormFields'

type EditQuestDialogProps = {
  guildId: string
  quest: TQuest
  questFeatureBlocked: boolean
  questFeatureBlockMessage: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EditQuestDialog = ({
  guildId,
  quest,
  questFeatureBlocked,
  questFeatureBlockMessage,
  open,
  onOpenChange
}: EditQuestDialogProps) => {
  const router = useRouter()
  const [values, setValues] = useState<QuestFormState>(questToFormState(quest))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!isQuestFormValid(values)) {
      toast.error('Fill in all required quest fields with valid values.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateQuest(guildId, {
        questId: quest.questId,
        ...parseQuestFormValues(values)
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to update quest.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setValues(questToFormState(quest))
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit quest</DialogTitle>
          <DialogDescription>
            Update quest details, condition, reward, or sort order.
          </DialogDescription>
        </DialogHeader>

        {questFeatureBlocked ? (
          <p className="text-sm text-muted-foreground">
            {questFeatureBlockMessage}
          </p>
        ) : (
          <QuestFormFields
            values={values}
            onChange={setValues}
            idPrefix="edit-quest"
          />
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || questFeatureBlocked || !isQuestFormValid(values)
            }
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditQuestDialog
