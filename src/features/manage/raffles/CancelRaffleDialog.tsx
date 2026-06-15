'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { cancelRaffle } from '@/actions/database/raffleActions.action'
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

type CancelRaffleDialogProps = {
  guildId: string
  raffleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CancelRaffleDialog = ({
  guildId,
  raffleId,
  open,
  onOpenChange
}: CancelRaffleDialogProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCancel = async () => {
    if (!raffleId) return

    setIsSubmitting(true)
    try {
      const result = await cancelRaffle(guildId, raffleId)
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to cancel raffle.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel raffle?</AlertDialogTitle>
          <AlertDialogDescription>
            This cancels the raffle, refunds all ticket purchases to normal
            balance, and updates the Discord message. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep active</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isSubmitting || !raffleId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Cancel raffle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CancelRaffleDialog
