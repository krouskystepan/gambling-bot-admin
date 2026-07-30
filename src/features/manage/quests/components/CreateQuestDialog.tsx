'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { createQuest } from '@/actions/database/questActions.action'
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
  defaultQuestFormState,
  isQuestFormValid,
  parseQuestFormValues
} from './QuestFormFields'

type CreateQuestDialogProps = {
  guildId: string
  questFeatureBlocked: boolean
  questFeatureBlockMessage: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateQuestDialog = ({
  guildId,
  questFeatureBlocked,
  questFeatureBlockMessage,
  open,
  onOpenChange
}: CreateQuestDialogProps) => {
  const router = useRouter()
  const [values, setValues] = useState<QuestFormState>(defaultQuestFormState())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setValues(defaultQuestFormState())
  }

  const handleSubmit = async () => {
    if (!isQuestFormValid(values)) {
      toast.error('Fill in all required quest fields with valid values.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createQuest(guildId, parseQuestFormValues(values))
      if (result.success) {
        toast.success(result.message)
        resetForm()
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to create quest.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create quest</DialogTitle>
          <DialogDescription>
            Add a daily or normal quest with a progress condition and reward.
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
            idPrefix="create-quest"
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
            Create quest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateQuestDialog
