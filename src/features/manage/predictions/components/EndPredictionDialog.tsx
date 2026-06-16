'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { endPrediction } from '@/actions/database/predictionActions.action'
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

type EndPredictionDialogProps = {
  guildId: string
  predictionId: string | null
  title: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EndPredictionDialog = ({
  guildId,
  predictionId,
  title,
  open,
  onOpenChange
}: EndPredictionDialogProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEnd = async () => {
    if (!predictionId) return

    setIsSubmitting(true)
    try {
      const result = await endPrediction(guildId, predictionId)
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to end prediction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End prediction?</AlertDialogTitle>
          <AlertDialogDescription>
            This ends <strong>{title}</strong>, disables bet buttons in Discord,
            and prevents new bets. Existing bets stay locked until payout or
            cancel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep active</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEnd}
            disabled={isSubmitting || !predictionId}
          >
            End prediction
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EndPredictionDialog
