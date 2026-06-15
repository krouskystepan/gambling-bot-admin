'use client'

import type { GlobalFeature, GlobalSettings } from 'gambling-bot-shared'
import { CircleQuestionMark, EllipsisIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

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
  onUserUpdated?: () => void
}

const UserActionsMenu = ({
  guildId,
  managerId,
  user,
  globalSettings,
  isGuildAdmin,
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
  const [amount, setAmount] = useState('')

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
          <Button size="icon" variant="ghost">
            <EllipsisIcon className="h-5 w-5" />
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
