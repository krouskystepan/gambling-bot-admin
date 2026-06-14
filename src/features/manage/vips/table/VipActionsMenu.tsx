'use client'

import { EllipsisIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  addVipMember,
  extendVipRoom,
  removeVipRoom
} from '@/actions/database/vipManage.action'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TVipChannels } from '@/types/types'

import GuildMemberCombobox, {
  type GuildMemberOption
} from './GuildMemberCombobox'

type VipActionsMenuProps = {
  guildId: string
  vip: TVipChannels
  maxMembers: number
  members: GuildMemberOption[]
  vipFeatureBlocked: boolean
  vipFeatureBlockMessage: string | null
}

const VipActionsMenu = ({
  guildId,
  vip,
  maxMembers,
  members,
  vipFeatureBlocked,
  vipFeatureBlockMessage
}: VipActionsMenuProps) => {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [duration, setDuration] = useState('')
  const [memberId, setMemberId] = useState<string | null>(null)
  const [bypassLimit, setBypassLimit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const excludedMemberIds = useMemo(
    () => [vip.ownerId, ...vip.members.map((member) => member.userId)],
    [vip.ownerId, vip.members]
  )

  const refresh = () => router.refresh()

  const handleExtend = async () => {
    if (!/^(\d+[dw])+$/i.test(duration.trim())) {
      toast.error('Use duration format like 1d or 2w.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await extendVipRoom(guildId, vip.ownerId, duration.trim())
      if (result.success) {
        toast.success(result.message)
        setDuration('')
        setExtendOpen(false)
        refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to extend VIP room.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMember = async () => {
    if (!memberId) {
      toast.error('Select a member to add.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addVipMember(
        guildId,
        vip.ownerId,
        memberId,
        bypassLimit
      )
      if (result.success) {
        toast.success(result.message)
        setMemberId(null)
        setBypassLimit(false)
        setAddMemberOpen(false)
        refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to add VIP member.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async () => {
    setIsSubmitting(true)
    try {
      const result = await removeVipRoom(guildId, vip.ownerId)
      if (result.success) {
        toast.success(result.message)
        setRemoveOpen(false)
        refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to remove VIP room.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={vipFeatureBlocked}
                >
                  <EllipsisIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>VIP actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    setExtendOpen(true)
                  }}
                >
                  Extend
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false)
                    setAddMemberOpen(true)
                  }}
                >
                  Add member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setMenuOpen(false)
                    setRemoveOpen(true)
                  }}
                >
                  Remove room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </TooltipTrigger>
        {vipFeatureBlocked && vipFeatureBlockMessage ? (
          <TooltipContent className="max-w-xs">
            <p>{vipFeatureBlockMessage}</p>
          </TooltipContent>
        ) : null}
      </Tooltip>

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend VIP room</DialogTitle>
            <DialogDescription>
              Add time to {vip.username}&apos;s VIP room ({vip.channelName}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`extend-duration-${vip.ownerId}`}>Duration</Label>
            <Input
              id={`extend-duration-${vip.ownerId}`}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="e.g. 7d, 2w"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleExtend} disabled={isSubmitting}>
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add VIP member</DialogTitle>
            <DialogDescription>
              Add a member to {vip.username}&apos;s room. Current members:{' '}
              {vip.members.length}/{maxMembers}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <GuildMemberCombobox
                members={members}
                value={memberId}
                onChange={setMemberId}
                excludeIds={excludedMemberIds}
                placeholder="Select member..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={bypassLimit}
                onCheckedChange={(checked) => setBypassLimit(checked === true)}
              />
              Bypass member limit
            </label>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddMember} disabled={isSubmitting}>
              Add member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove VIP room?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes VIP access for {vip.username} in #{vip.channelName}.
              The channel stays read-only for the owner; roles and member access
              are revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default VipActionsMenu
