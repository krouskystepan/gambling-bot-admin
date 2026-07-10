'use client'

import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createVipRoom } from '@/actions/database/vipManage.action'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { guildBasePath } from '@/lib/guild/guildBasePath'

import GuildMemberCombobox, {
  type GuildMemberOption
} from './GuildMemberCombobox'

type CreateVipDialogProps = {
  guildId: string
  members: GuildMemberOption[]
  activeVipOwnerIds: string[]
  vipConfigured: boolean
  vipFeatureBlocked: boolean
  vipFeatureBlockMessage: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateVipDialog = ({
  guildId,
  members,
  activeVipOwnerIds,
  vipConfigured,
  vipFeatureBlocked,
  vipFeatureBlockMessage,
  open,
  onOpenChange
}: CreateVipDialogProps) => {
  const router = useRouter()
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [duration, setDuration] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setOwnerId(null)
    setDuration('')
  }

  const handleSubmit = async () => {
    if (!ownerId) {
      toast.error('Select a room owner.')
      return
    }

    if (!/^(\d+[dw])+$/i.test(duration.trim())) {
      toast.error('Use duration format like 1d or 2w.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createVipRoom(guildId, ownerId, duration.trim())
      if (result.success) {
        toast.success(result.message)
        resetForm()
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Failed to create VIP room.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create VIP room</DialogTitle>
          <DialogDescription>
            Grant a registered user a new VIP channel. Duration must be at least
            1 day (e.g. 1d, 2w).
          </DialogDescription>
        </DialogHeader>

        {!vipConfigured ? (
          <p className="text-sm text-muted-foreground">
            VIP is not configured yet. Set up{' '}
            <Link
              href={`${guildBasePath(guildId)}/vip-settings`}
              className="text-primary hover:underline"
            >
              VIP settings
            </Link>{' '}
            first.
          </p>
        ) : vipFeatureBlocked ? (
          <p className="text-sm text-muted-foreground">
            {vipFeatureBlockMessage}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Owner</Label>
              <GuildMemberCombobox
                members={members}
                value={ownerId}
                onChange={setOwnerId}
                excludeIds={activeVipOwnerIds}
                placeholder="Select room owner..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-vip-duration">Duration</Label>
              <Input
                id="create-vip-duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="e.g. 7d, 2w"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!vipConfigured || vipFeatureBlocked || isSubmitting}
          >
            Create room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateVipDialog
