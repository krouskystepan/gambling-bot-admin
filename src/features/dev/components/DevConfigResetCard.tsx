'use client'

import { useMemo, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import {
  type GuildConfigResetScope,
  devResetGuildConfig
} from '@/actions/dev/devDataOps.action'
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

import DevDestructiveConfirmDialog, {
  type DevDestructiveConfirmItem
} from './DevDestructiveConfirmDialog'

type SelectableConfigScope = Exclude<GuildConfigResetScope, 'all'>

const RESET_OPTIONS: Array<{
  id: SelectableConfigScope
  label: string
  detail: string
}> = [
  {
    id: 'casino',
    label: 'Casino settings',
    detail: 'Restore default casino game configuration.'
  },
  {
    id: 'global',
    label: 'Global settings',
    detail: 'Restore feature toggles, currency, and timezone defaults.'
  },
  {
    id: 'channels',
    label: 'Channels and roles',
    detail: 'Clear channel IDs plus manager and banned role IDs.'
  },
  {
    id: 'vip',
    label: 'VIP settings',
    detail: 'Restore VIP pricing and role defaults.'
  },
  {
    id: 'bonus',
    label: 'Bonus settings',
    detail: 'Restore daily bonus reward defaults.'
  }
]

type DevConfigResetCardProps = {
  guildId: string
}

const DevConfigResetCard = ({ guildId }: DevConfigResetCardProps) => {
  const router = useRouter()
  const readOnly = usePresentationReadOnly()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<SelectableConfigScope[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allSelected = selected.length === RESET_OPTIONS.length

  const confirmItems = useMemo<DevDestructiveConfirmItem[]>(
    () =>
      RESET_OPTIONS.filter((option) => selected.includes(option.id)).map(
        (option) => ({
          label: option.label,
          detail: option.detail
        })
      ),
    [selected]
  )

  const toggleScope = (scope: SelectableConfigScope, checked: boolean) => {
    setSelected((current) =>
      checked ? [...current, scope] : current.filter((value) => value !== scope)
    )
  }

  const selectAll = () => {
    setSelected(RESET_OPTIONS.map((option) => option.id))
  }

  const clearSelection = () => {
    setSelected([])
  }

  const handleConfirm = (confirmationPhrase: string) => {
    startTransition(async () => {
      const response = await devResetGuildConfig({
        guildId,
        scopes: selected,
        confirmationPhrase
      })

      if (!response.ok) {
        setError(response.error)
        return
      }

      setResult(response.reset)
      setDialogOpen(false)
      setSelected([])
      router.refresh()
    })
  }

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Guild configuration reset</CardTitle>
          <CardDescription>
            Reset stored guild settings to schema defaults. Does not delete
            operational data unless you also run a wipe.
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
              Reset all config
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

          <div className="grid gap-3 sm:grid-cols-2">
            {RESET_OPTIONS.map((option) => {
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
                      toggleScope(option.id, value === true)
                    }
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.detail}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={selected.length === 0 || readOnly}
            onClick={() => {
              setError(null)
              setResult(null)
              setDialogOpen(true)
            }}
          >
            Review config reset
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify({ reset: result }, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <DevDestructiveConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guildId={guildId}
        title="Confirm guild configuration reset"
        description="Settings will be overwritten with defaults. Operational data is not deleted by this action."
        items={confirmItems}
        confirmLabel="Reset selected settings"
        pending={pending}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default DevConfigResetCard
