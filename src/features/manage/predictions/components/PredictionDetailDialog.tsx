'use client'

import Image from 'next/image'
import Link from 'next/link'

import ColoredBadge from '@/components/badges/ColoredBadge'
import { getPredictionStatusBadgeClass } from '@/components/badges/badgeStyles'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import { formatGuildMoney } from '@/lib/guild/guildMoney'
import { TPredictionDetail } from '@/types/types'

type PredictionDetailDialogProps = {
  guildId: string
  predictionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  detail: TPredictionDetail | null
  loading: boolean
  error: string | null
}

const PredictionDetailDialog = ({
  guildId,
  predictionId,
  open,
  onOpenChange,
  detail,
  loading,
  error
}: PredictionDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-xl flex-col gap-4 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{detail?.title ?? 'Prediction detail'}</DialogTitle>
          <DialogDescription>
            {predictionId ? `ID: ${predictionId}` : 'Loading prediction...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : detail ? (
          <>
            <div className="shrink-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <ColoredBadge
                  colorClass={getPredictionStatusBadgeClass(detail.status)}
                  className="capitalize"
                >
                  {detail.status}
                </ColoredBadge>
                <span className="text-sm text-muted-foreground">
                  Total bets: {formatGuildMoney(detail.totalBetAmount)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Bettors: {detail.bettorCount}
                </span>
              </div>

              {detail.autolock ? (
                <p className="text-sm text-muted-foreground">
                  Auto-lock: {new Date(detail.autolock).toLocaleString('cs-CZ')}
                </p>
              ) : null}
            </div>

            <ScrollArea className="min-h-0 flex-1 pr-3">
              <div className="space-y-4">
                {detail.choices.map((choice) => (
                  <div
                    key={choice.choiceName}
                    className="rounded-md border p-3"
                  >
                    <p className="font-medium">
                      {choice.choiceName} ({choice.odds}x)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bets: {choice.betCount} · Total:{' '}
                      {formatGuildMoney(choice.totalBetAmount)} · Payout if
                      wins: {formatGuildMoney(choice.payoutIfWins)}
                    </p>
                    <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
                      {choice.bets.length > 0 ? (
                        choice.bets.map((bet) => (
                          <Link
                            key={bet.betId}
                            href={`${guildBasePath(guildId)}/users/${bet.userId}`}
                            className="flex items-center gap-2 text-sm hover:text-primary"
                          >
                            <Image
                              className="rounded-full"
                              width={20}
                              height={20}
                              alt={bet.username}
                              src={bet.avatar}
                            />
                            <span>
                              {bet.username} - {formatGuildMoney(bet.amount)}
                            </span>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          No bets
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default PredictionDetailDialog
