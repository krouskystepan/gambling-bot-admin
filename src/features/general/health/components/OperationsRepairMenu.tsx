'use client'

import { Wrench } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  forceCloseStaleBlackjack,
  resetStuckPredictionPayout
} from '@/actions/database/operationsRepair.action'
import type { SystemHealthRepairAction } from '@/actions/database/systemHealth.action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

type OperationsRepairMenuProps = {
  guildId: string
  repair: SystemHealthRepairAction
  itemTitle: string
}

const repairCopy = {
  resetPredictionPayout: {
    title: 'Reset stuck payout?',
    description:
      'Rolls prediction back to Ended so you can run payout again. No funds move if payout never started.',
    confirm: 'Reset payout'
  },
  forceCloseBlackjack: {
    title: 'Force refund & close?',
    description:
      'Refunds locked bet to the player and deletes the game record. Use when the Discord message is gone or the game is abandoned.',
    confirm: 'Force refund & close'
  }
} as const

const OperationsRepairMenu = ({
  guildId,
  repair,
  itemTitle
}: OperationsRepairMenuProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copy =
    repair.kind === 'resetPredictionPayout'
      ? repairCopy.resetPredictionPayout
      : repairCopy.forceCloseBlackjack

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const result =
        repair.kind === 'resetPredictionPayout'
          ? await resetStuckPredictionPayout(guildId, repair.predictionId)
          : await forceCloseStaleBlackjack(guildId, repair.userId)

      if (result.success) {
        toast.success(result.message)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Repair action failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
        title="Repair"
        onClick={() => setOpen(true)}
      >
        <Wrench size={14} />
        <span className="sr-only">Repair {itemTitle}</span>
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.description}
              <span className="mt-2 block font-medium text-foreground">
                {itemTitle}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default OperationsRepairMenu
