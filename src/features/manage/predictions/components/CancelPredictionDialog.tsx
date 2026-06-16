'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { cancelPrediction } from '@/actions/database/predictionActions.action'
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

type CancelPredictionDialogProps = {
  guildId: string
  predictionId: string | null
  title: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CancelPredictionDialog = ({
  guildId,
  predictionId,
  title,
  open,
  onOpenChange
}: CancelPredictionDialogProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCancel = async () => {
    if (!predictionId) return

    setIsSubmitting(true)
    try {
      const result = await cancelPrediction(guildId, predictionId)
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to cancel prediction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel prediction?</AlertDialogTitle>
          <AlertDialogDescription>
            This cancels <strong>{title}</strong>, refunds all locked bets, and
            updates the Discord message. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep prediction</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isSubmitting || !predictionId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Cancel prediction
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CancelPredictionDialog
