'use client'

import type { GuildWipeEntity } from 'gambling-bot-shared/dev'

import { useMemo, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { devWipeGuildData } from '@/actions/dev/devDataOps.action'
import { usePresentationReadOnly } from '@/components/presentation/PresentationProvider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { DevGuildCounts } from '@/lib/dev/devGuildDiagnostics'

import DevDestructiveConfirmDialog, {
  type DevDestructiveConfirmItem
} from './DevDestructiveConfirmDialog'

type SelectableWipeEntity = Exclude<GuildWipeEntity, 'all'>

const WIPE_OPTIONS: Array<{
  id: SelectableWipeEntity
  label: string
  getCount: (counts: DevGuildCounts) => number
}> = [
  {
    id: 'users',
    label: 'Users',
    getCount: (counts) => counts.users
  },
  {
    id: 'transactions',
    label: 'Transactions',
    getCount: (counts) => counts.transactions
  },
  {
    id: 'atm',
    label: 'ATM requests',
    getCount: (counts) =>
      counts.atmPending + counts.atmApproved + counts.atmRejected
  },
  {
    id: 'predictions',
    label: 'Predictions',
    getCount: (counts) => counts.predictions
  },
  {
    id: 'raffles',
    label: 'Raffles',
    getCount: (counts) => counts.raffles
  },
  {
    id: 'vip',
    label: 'VIP rooms',
    getCount: (counts) => counts.vipRooms
  },
  {
    id: 'blackjack',
    label: 'Blackjack games',
    getCount: (counts) => counts.blackjackGames
  }
]

type DevDataWipeCardProps = {
  guildId: string
  counts: DevGuildCounts
}

const DevDataWipeCard = ({ guildId, counts }: DevDataWipeCardProps) => {
  const router = useRouter()
  const readOnly = usePresentationReadOnly()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<SelectableWipeEntity[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [result, setResult] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allSelected = selected.length === WIPE_OPTIONS.length

  const confirmItems = useMemo<DevDestructiveConfirmItem[]>(
    () =>
      WIPE_OPTIONS.filter((option) => selected.includes(option.id)).map(
        (option) => ({
          label: option.label,
          count: option.getCount(counts),
          detail:
            option.id === 'users'
              ? 'Wiping users without transactions can leave orphan transaction rows.'
              : undefined
        })
      ),
    [counts, selected]
  )

  const toggleEntity = (entity: SelectableWipeEntity, checked: boolean) => {
    setSelected((current) =>
      checked
        ? [...current, entity]
        : current.filter((value) => value !== entity)
    )
  }

  const selectAll = () => {
    setSelected(WIPE_OPTIONS.map((option) => option.id))
  }

  const clearSelection = () => {
    setSelected([])
  }

  const openReview = (entities: SelectableWipeEntity[]) => {
    setError(null)
    setResult(null)
    setSelected(entities)
    setDialogOpen(true)
  }

  const handleConfirm = (confirmationPhrase: string) => {
    startTransition(async () => {
      const response = await devWipeGuildData({
        guildId,
        entities: selected,
        confirmationPhrase
      })

      if (!response.ok) {
        setError(response.error)
        return
      }

      setResult(response.deleted)
      setDialogOpen(false)
      setSelected([])
      router.refresh()
    })
  }

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Operational data wipe</CardTitle>
          <CardDescription>
            Permanently delete guild operational documents. Guild configuration
            is not changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {readOnly ? (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Read-only demo — destructive dev tooling is disabled.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={allSelected || readOnly}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selected.length === 0 || readOnly}
            >
              Clear selection
            </Button>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300">
            Wiping users without transactions can leave orphan transaction rows.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {WIPE_OPTIONS.map((option) => {
              const checked = selected.includes(option.id)

              return (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset"
                >
                  <Checkbox
                    className="mt-0.5 shrink-0"
                    checked={checked}
                    disabled={readOnly}
                    onCheckedChange={(value) =>
                      toggleEntity(option.id, value === true)
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{option.label}</span>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {option.getCount(counts).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={selected.length === 0 || readOnly}
              onClick={() => openReview(selected)}
            >
              Review wipe
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={readOnly}
              onClick={() =>
                openReview(WIPE_OPTIONS.map((option) => option.id))
              }
            >
              Full test reset
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <DevDestructiveConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guildId={guildId}
        title="Confirm operational data wipe"
        description="This action cannot be undone. Operational data will be permanently deleted for this guild."
        items={confirmItems}
        confirmLabel="Wipe selected data"
        pending={pending}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default DevDataWipeCard
