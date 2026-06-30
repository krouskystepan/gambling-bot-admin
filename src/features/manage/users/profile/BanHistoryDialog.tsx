'use client'

import { Ban } from 'lucide-react'

import { useState } from 'react'

import type { UserProfileBanRecord } from '@/actions/database/userProfile.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getBanLogStatusBadgeClass } from '@/components/badges/badgeStyles'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

import ModerationEventLine from './ModerationEventLine'

type BanHistoryDialogProps = {
  bans: UserProfileBanRecord[]
  banned: boolean
}

const BanHistoryDialog = ({ bans, banned }: BanHistoryDialogProps) => {
  const [open, setOpen] = useState(false)
  const count = bans.length || (banned ? 1 : 0)

  const countLabel =
    count === 0
      ? 'No ban records'
      : count === 1
        ? '1 ban record'
        : `${count} ban records`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative size-9 shrink-0"
              aria-label={countLabel}
            >
              <Ban className="size-4" />
              {count > 0 ? (
                <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Ban log</TooltipContent>
      </Tooltip>

      <DialogContent className="gap-4 sm:max-w-4xl">
        <DialogHeader className="gap-1">
          <DialogTitle>Ban log</DialogTitle>
          <DialogDescription className="sr-only">
            Ban and unban history for this user.
          </DialogDescription>
        </DialogHeader>

        {bans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {banned
              ? 'Currently banned. No ban records found.'
              : 'No ban records yet.'}
          </p>
        ) : (
          <div className="max-h-[min(70vh,36rem)] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 w-20 px-3">Status</TableHead>
                  <TableHead className="h-9 px-3">Banned</TableHead>
                  <TableHead className="h-9 px-3">Unbanned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bans.map((ban) => (
                  <TableRow key={ban.banId}>
                    <TableCell className="px-3 py-2 align-middle">
                      <ColoredBadge
                        colorClass={getBanLogStatusBadgeClass(
                          ban.unbannedAt ? 'ended' : 'active'
                        )}
                        className="px-2"
                      >
                        {ban.unbannedAt ? 'Ended' : 'Active'}
                      </ColoredBadge>
                    </TableCell>
                    <TableCell className="px-3 py-2 align-middle">
                      <ModerationEventLine
                        label="Ban"
                        when={ban.bannedAt}
                        staffName={ban.bannedByUsername}
                        staffId={ban.bannedBy}
                        detail={ban.banReason}
                        tone="ban"
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2 align-middle">
                      {ban.unbannedAt ? (
                        <ModerationEventLine
                          label="Unban"
                          when={ban.unbannedAt}
                          staffName={ban.unbannedByUsername}
                          staffId={ban.unbannedBy ?? '—'}
                          detail={ban.unbanReason}
                          tone="unban"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BanHistoryDialog
