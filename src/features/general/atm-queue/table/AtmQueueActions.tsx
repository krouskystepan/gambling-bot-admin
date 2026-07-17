'use client'

import type { GlobalSettings } from 'gambling-bot-shared/guild'
import { Check, X } from 'lucide-react'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import {
  approveAtmRequestAction,
  rejectAtmRequestAction
} from '@/actions/database/atmRequest.action'
import { usePresentationReadOnly } from '@/components/presentation/PresentationProvider'
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

import { useRegisterAtmQueueBusy } from '../AtmQueueLiveUpdateContext'

const iconButtonClass = 'size-7 shrink-0 shadow-xs'

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
  const readOnly = usePresentationReadOnly()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useRegisterAtmQueueBusy(
    `atm-dialog-${request.requestId}`,
    dialogOpen && request.status === 'pending'
  )

  if (request.status !== 'pending' || readOnly) return null

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
      <div className="flex items-center gap-2.5 px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size="icon"
                disabled={pending || approveBlocked}
                className={cn(
                  iconButtonClass,
                  'bg-emerald-600 text-white hover:bg-emerald-600/90'
                )}
                onClick={() => openDialog('approve')}
                aria-label="Approve"
              >
                <Check className="size-3.5" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              {approveBlocked && approveBlockMessage
                ? approveBlockMessage
                : 'Approve'}
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              disabled={pending}
              className={cn(
                iconButtonClass,
                'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20'
              )}
              onClick={() => openDialog('reject')}
              aria-label="Reject"
            >
              <X className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reject</p>
          </TooltipContent>
        </Tooltip>
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
