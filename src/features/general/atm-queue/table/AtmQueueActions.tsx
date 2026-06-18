'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  getPanelFeatureBlockMessage,
  isPanelFeatureBlocking
} from '@/lib/panel/panelGlobalFeatureGuard'
import { cn } from '@/lib/utils'
import { TAtmRequestDiscord } from '@/types/types'

const actionButtonClass = 'h-8 min-w-[4.75rem] flex-1 px-3 shadow-xs'

type AtmQueueActionsProps = {
  guildId: string
  request: TAtmRequestDiscord
  globalSettings: GlobalSettings
  isGuildAdmin: boolean
}

const AtmQueueActions = ({
  guildId,
  request,
  globalSettings,
  isGuildAdmin
}: AtmQueueActionsProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  if (request.status !== 'pending') return null

  const feature = request.type === 'deposit' ? 'deposit' : 'withdraw'
  const approveBlocked = isPanelFeatureBlocking(
    globalSettings,
    feature,
    isGuildAdmin
  )
  const approveBlockMessage = getPanelFeatureBlockMessage(
    globalSettings,
    feature,
    isGuildAdmin
  )

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
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size="sm"
                disabled={pending || approveBlocked}
                className={cn(
                  actionButtonClass,
                  'bg-emerald-600 text-white hover:bg-emerald-600/90'
                )}
                onClick={() => openDialog('approve')}
              >
                Approve
              </Button>
            </span>
          </TooltipTrigger>
          {approveBlocked && approveBlockMessage ? (
            <TooltipContent className="max-w-xs">
              <p>{approveBlockMessage}</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          className={cn(
            actionButtonClass,
            'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20'
          )}
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
