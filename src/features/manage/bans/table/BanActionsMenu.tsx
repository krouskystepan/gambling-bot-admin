'use client'

import { EllipsisIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { GuildBanRow } from '@/actions/database/guildBans.action'
import { unbanUser } from '@/actions/database/userModeration.action'
import { usePresentationReadOnly } from '@/components/presentation/PresentationProvider'
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
import { guildBasePath } from '@/lib/guild/guildBasePath'

type BanActionsMenuProps = {
  guildId: string
  ban: GuildBanRow
}

const BanActionsMenu = ({ guildId, ban }: BanActionsMenuProps) => {
  const router = useRouter()
  const readOnly = usePresentationReadOnly()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unbanOpen, setUnbanOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isActive = ban.unbannedAt == null
  const displayName = ban.username ?? ban.userId

  const handleUnban = async () => {
    setSubmitting(true)
    try {
      const result = await unbanUser(guildId, ban.userId, reason || undefined)
      if (result.success) {
        toast.success(result.message)
        setUnbanOpen(false)
        setReason('')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Unban failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ban actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`${guildBasePath(guildId)}/users/${ban.userId}`}>
              Open profile
            </Link>
          </DropdownMenuItem>
          {isActive && !readOnly ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setMenuOpen(false)
                  setUnbanOpen(true)
                }}
              >
                Unban
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={unbanOpen}
        onOpenChange={(open) => {
          setUnbanOpen(open)
          if (!open) setReason('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unban {displayName}</DialogTitle>
            <DialogDescription>
              Optional reason is saved as a staff note. Players only see a
              generic restriction message in Discord.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="my-2 w-full rounded border p-2"
            placeholder="Optional reason"
            maxLength={500}
            rows={3}
          />

          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUnban} disabled={submitting}>
              Unban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BanActionsMenu
