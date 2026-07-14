'use client'

import type { GlobalFeature, GlobalSettings } from 'gambling-bot-shared/guild'
import { CircleQuestionMark, EllipsisIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  bonusBalance,
  depositBalance,
  registerUser,
  resetBalance,
  unregisterUser,
  withdrawBalance
} from '@/actions/database/user.action'
import {
  addUserStaffNote,
  banUser,
  unbanUser
} from '@/actions/database/userModeration.action'
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  getPanelFeatureBlockMessage,
  isPanelFeatureBlocking
} from '@/lib/panel/panelGlobalFeatureGuard'
import { TGuildMemberStatus } from '@/types/types'

const PANEL_BALANCE_ACTION_FEATURES = {
  deposit: 'deposit',
  withdraw: 'withdraw',
  bonus: 'dailyBonus'
} as const satisfies Record<string, GlobalFeature>

type UserActionsMenuProps = {
  guildId: string
  managerId: string
  user: TGuildMemberStatus
  globalSettings: GlobalSettings
  isGuildAdmin: boolean
  targetHasManagerRole?: boolean
  onUserUpdated?: () => void
}

const UserActionsMenu = ({
  guildId,
  managerId,
  user,
  globalSettings,
  isGuildAdmin,
  targetHasManagerRole = false,
  onUserUpdated
}: UserActionsMenuProps) => {
  const router = useRouter()

  const handleUpdated = () => {
    onUserUpdated?.()
    router.refresh()
  }

  const registrationBlocked = isPanelFeatureBlocking(
    globalSettings,
    'registration',
    isGuildAdmin
  )
  const registrationBlockMessage = getPanelFeatureBlockMessage(
    globalSettings,
    'registration',
    isGuildAdmin
  )

  const isBalanceActionBlocked = (
    action: keyof typeof PANEL_BALANCE_ACTION_FEATURES | 'reset'
  ) => {
    if (action === 'reset') {
      return isPanelFeatureBlocking(globalSettings, 'maintenance', isGuildAdmin)
    }
    return isPanelFeatureBlocking(
      globalSettings,
      PANEL_BALANCE_ACTION_FEATURES[action],
      isGuildAdmin
    )
  }

  const balanceActionBlockMessage = (
    action: keyof typeof PANEL_BALANCE_ACTION_FEATURES | 'reset'
  ) => {
    if (action === 'reset') {
      return getPanelFeatureBlockMessage(
        globalSettings,
        'maintenance',
        isGuildAdmin
      )
    }
    return getPanelFeatureBlockMessage(
      globalSettings,
      PANEL_BALANCE_ACTION_FEATURES[action],
      isGuildAdmin
    )
  }

  const [open, setOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [balanceModal, setBalanceModal] = useState<
    null | 'deposit' | 'withdraw' | 'reset' | 'bonus'
  >(null)
  const [moderationModal, setModerationModal] = useState<
    null | 'ban' | 'unban' | 'note'
  >(null)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')

  const isSelfTarget = managerId === user.userId
  const isManagerTargetBlocked = targetHasManagerRole && !isGuildAdmin
  const banActionDisabled =
    !user.registered || isSelfTarget || isManagerTargetBlocked
  const banActionTooltip = isSelfTarget
    ? 'You cannot ban or unban yourself.'
    : isManagerTargetBlocked
      ? 'Managers cannot ban or unban other managers. Contact a server administrator.'
      : user.banned
        ? 'Restore economy access and remove the banned role.'
        : 'Block economy actions and assign the banned role if configured.'

  const handleBalanceAction = async () => {
    const value = parseFloat(amount)
    if (
      (balanceModal === 'deposit' || balanceModal === 'withdraw') &&
      (isNaN(value) || value <= 0)
    ) {
      toast.error('Enter a valid number')
      return
    }

    try {
      if (balanceModal === 'deposit') {
        const result = await depositBalance(
          user.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          toast.success(result.message)
          handleUpdated()
        } else toast.error(result.message)
      } else if (balanceModal === 'withdraw') {
        const result = await withdrawBalance(
          user.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          toast.success(result.message)
          handleUpdated()
        } else toast.error(result.message)
      } else if (balanceModal === 'reset') {
        const result = await resetBalance(user.userId, guildId, managerId)
        if (result.success) {
          toast.success(result.message)
          handleUpdated()
        } else toast.error(result.message)
      } else if (balanceModal === 'bonus') {
        const result = await bonusBalance(
          user.userId,
          guildId,
          managerId,
          value
        )
        if (result.success) {
          toast.success(result.message)
          handleUpdated()
        } else toast.error(result.message)
      }
    } catch (err) {
      toast.error('Action failed')
      console.error(err)
    }

    setAmount('')
    setBalanceModal(null)
  }

  const handleModerationAction = async () => {
    try {
      if (moderationModal === 'note') {
        const result = await addUserStaffNote(guildId, user.userId, reason)
        if (result.success) {
          toast.success(result.message)
          handleUpdated()
        } else {
          toast.error(result.message)
        }
      } else {
        const result =
          moderationModal === 'ban'
            ? await banUser(guildId, user.userId, reason || undefined)
            : await unbanUser(guildId, user.userId, reason || undefined)

        if (result.success) {
          toast.success(result.message)
          handleUpdated()
        } else {
          toast.error(result.message)
        }
      }
    } catch {
      toast.error('Moderation action failed')
    }

    setReason('')
    setModerationModal(null)
  }

  const handleRegisterAction = async () => {
    try {
      const result = user.registered
        ? await unregisterUser(user.userId, guildId, managerId)
        : await registerUser(user.userId, guildId, managerId)

      if (result.success) {
        toast.success(result.message)
        handleUpdated()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to register/unregister user')
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" className="size-9 shrink-0">
            <EllipsisIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Balance Actions</DropdownMenuLabel>

          {(['deposit', 'withdraw', 'bonus', 'reset'] as const).map(
            (action) => {
              const labels: Record<string, string> = {
                deposit: 'Deposit',
                withdraw: 'Withdraw',
                bonus: 'Bonus',
                reset: 'Reset'
              }

              const descriptions: Record<string, string> = {
                deposit: 'Add balance to user account.',
                withdraw: 'Remove balance from user account.',
                reset: 'Reset user balance (delete all transactions).',
                bonus: 'Give a bonus to user account.'
              }

              const featureBlocked = isBalanceActionBlocked(action)
              const blockMessage = balanceActionBlockMessage(action)

              return (
                <DropdownMenuItem
                  key={action}
                  onClick={() => setBalanceModal(action)}
                  disabled={!user.registered || featureBlocked}
                  className="flex items-center justify-between"
                >
                  {labels[action]}
                  <Tooltip>
                    <TooltipTrigger className="ml-2 text-muted-foreground transition hover:text-foreground">
                      <CircleQuestionMark size={16} />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="mb-1 font-semibold">{labels[action]}</p>
                      <p className="text-sm">
                        {featureBlocked && blockMessage
                          ? blockMessage
                          : descriptions[action]}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuItem>
              )
            }
          )}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setModerationModal(user.banned ? 'unban' : 'ban')}
            disabled={banActionDisabled}
            className="flex items-center justify-between"
          >
            {user.banned ? 'Unban' : 'Ban'}
            <Tooltip>
              <TooltipTrigger className="ml-2 text-muted-foreground transition hover:text-foreground">
                <CircleQuestionMark size={16} />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="mb-1 font-semibold">
                  {user.banned ? 'Unban' : 'Ban'}
                </p>
                <p className="text-sm">{banActionTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setModerationModal('note')}
            disabled={!user.registered}
          >
            Add staff note
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Registration</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setAlertOpen(true)}
            disabled={registrationBlocked}
            className="flex items-center justify-between"
          >
            {user.registered ? 'Unregister' : 'Register'}
            <Tooltip>
              <TooltipTrigger className="ml-2 text-muted-foreground transition hover:text-foreground">
                <CircleQuestionMark size={16} />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="mb-1 font-semibold">
                  {user.registered ? 'Unregister' : 'Register'}
                </p>
                <p className="text-sm">
                  {registrationBlocked && registrationBlockMessage
                    ? registrationBlockMessage
                    : user.registered
                      ? 'Unregister user (will delete from database).'
                      : 'Register user in the system.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!balanceModal} onOpenChange={() => setBalanceModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {balanceModal
                ? balanceModal.charAt(0).toUpperCase() + balanceModal.slice(1)
                : ''}{' '}
              for {user.username}
            </DialogTitle>
            <DialogDescription>
              {balanceModal === 'reset'
                ? 'This will reset the balance to 0.'
                : 'Enter the amount:'}
            </DialogDescription>
          </DialogHeader>

          {balanceModal !== 'reset' && (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="my-2 w-full rounded border p-2"
              placeholder="Enter amount"
            />
          )}

          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleBalanceAction}>
              {balanceModal
                ? balanceModal.charAt(0).toUpperCase() + balanceModal.slice(1)
                : ''}{' '}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!moderationModal}
        onOpenChange={() => setModerationModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationModal === 'ban'
                ? 'Ban'
                : moderationModal === 'unban'
                  ? 'Unban'
                  : 'Add staff note'}{' '}
              {user.username}
            </DialogTitle>
            <DialogDescription>
              {moderationModal === 'note'
                ? 'Saved for other mods only. Not visible to the player.'
                : 'Optional reason is saved as a staff note. Players only see a generic restriction message in Discord.'}
              {moderationModal === 'ban' && isGuildAdmin ? (
                <>
                  {' '}
                  <Link
                    href={`/dashboard/g/${guildId}/moderation-settings`}
                    className="font-medium text-primary hover:underline"
                  >
                    Configure banned role
                  </Link>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="my-2 w-full rounded border p-2"
            placeholder={
              moderationModal === 'note'
                ? 'Note for other staff...'
                : 'Optional reason'
            }
            maxLength={500}
            rows={3}
          />

          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleModerationAction}
              disabled={moderationModal === 'note' && !reason.trim()}
            >
              {moderationModal === 'ban'
                ? 'Ban'
                : moderationModal === 'unban'
                  ? 'Unban'
                  : 'Add note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.{' '}
              {user.registered
                ? 'The user will be unregistered.'
                : 'The user will be registered.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleRegisterAction()
                setAlertOpen(false)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default UserActionsMenu
