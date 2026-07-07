'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { resetStuckPredictionPayout } from '@/actions/database/operationsRepair.action'
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

type ResetStuckPayoutDialogProps = {
  guildId: string
  predictionId: string | null
  title: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ResetStuckPayoutDialog = ({
  guildId,
  predictionId,
  title,
  open,
  onOpenChange
}: ResetStuckPayoutDialogProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReset = async () => {
    if (!predictionId) return

    setIsSubmitting(true)
    try {
      const result = await resetStuckPredictionPayout(guildId, predictionId)
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to reset stuck payout.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset stuck payout?</AlertDialogTitle>
          <AlertDialogDescription>
            Rolls <strong>{title}</strong> back to Ended so you can run payout
            again. No funds move if payout never started.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep paying status</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isSubmitting || !predictionId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reset payout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ResetStuckPayoutDialog
