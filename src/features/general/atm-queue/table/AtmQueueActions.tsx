'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import {
  approveAtmRequestAction,
  rejectAtmRequestAction
} from '@/actions/database/atmRequest.action'
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
import { Button } from '@/components/ui/button'
import { TAtmRequestDiscord } from '@/types/types'

type AtmQueueActionsProps = {
  guildId: string
  request: TAtmRequestDiscord
}

const AtmQueueActions = ({ guildId, request }: AtmQueueActionsProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  if (request.status !== 'pending') return null

  const openDialog = (nextAction: 'approve' | 'reject') => {
    setAction(nextAction)
    setNotes('')
    setMessage(null)
    setDialogOpen(true)
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result =
        action === 'approve'
          ? await approveAtmRequestAction(guildId, request.requestId, notes)
          : await rejectAtmRequestAction(guildId, request.requestId, notes)

      setMessage(result.message)

      if (result.success) {
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={pending}
          onClick={() => openDialog('approve')}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => openDialog('reject')}
        >
          Reject
        </Button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approve' ? 'Approve request' : 'Reject request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approve'
                ? 'This will complete the ATM request and update the user balance.'
                : 'This will reject the pending ATM request.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <textarea
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Optional notes for audit trail"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default AtmQueueActions
