'use client'

import { type BonusSettings } from 'gambling-bot-shared/bonus'
import { formatNumberToReadableString } from 'gambling-bot-shared/common'
import {
  type BonusStressResult,
  runBonusStressTest
} from 'gambling-bot-shared/dev'
import { type GlobalSettings } from 'gambling-bot-shared/guild'

import { useState, useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatGuildMoney } from '@/lib/guild/guildMoney'

const DAY_PRESETS = [60, 365, 1_000, 10_000] as const

type DevBonusSimLabProps = {
  bonusSettings: BonusSettings
  globalSettings: GlobalSettings
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-muted/20 px-3 py-2">
    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
  </div>
)

const DevBonusSimLab = ({
  bonusSettings,
  globalSettings
}: DevBonusSimLabProps) => {
  const [days, setDays] = useState('365')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BonusStressResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const formatAmount = (value: number) =>
    formatGuildMoney(value, globalSettings)

  const runStressTest = () => {
    const totalDays = Math.min(50_000, Math.max(1, Number(days) || 1))
    setProgress(0)
    setResult(null)

    startTransition(async () => {
      const summary = await runBonusStressTest(
        bonusSettings,
        totalDays,
        (completed, total) => setProgress(Math.round((completed / total) * 100))
      )
      setResult(summary)
      setProgress(100)
    })
  }

  const previewTail = result?.preview.slice(-40) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonus stress test</CardTitle>
        <CardDescription>
          Brute-force daily bonus rewards using this guild&apos;s bonus curve.
          Useful for spotting cap resets, milestone spikes, and runaway totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="bonus-days">Days to simulate</Label>
            <Input
              id="bonus-days"
              type="number"
              min={1}
              max={50_000}
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className="w-36"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {DAY_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setDays(String(preset))}
              >
                {formatNumberToReadableString(preset)}
              </Button>
            ))}
          </div>

          <Button disabled={isPending} onClick={runStressTest}>
            {isPending ? `Crunching… ${progress}%` : 'Run stress test'}
          </Button>
        </div>

        {isPending ? (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                label="Total paid"
                value={formatAmount(result.totalReward)}
              />
              <Stat
                label="Average / day"
                value={formatAmount(result.avgReward)}
              />
              <Stat
                label="Peak day"
                value={`${formatAmount(result.maxReward)} · day ${result.maxDay}`}
              />
              <Stat label="Cycle length" value={String(result.cycleLength)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {result.days.toLocaleString()} days in {result.elapsedMs} ms
              </Badge>
              <Badge variant="outline">{result.resetCount} cap resets</Badge>
              <Badge variant="outline">
                {result.weeklyBonuses} weekly hits
              </Badge>
              <Badge variant="outline">
                {result.monthlyBonuses} monthly hits
              </Badge>
              <Badge variant="outline">Mode: {bonusSettings.rewardMode}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Last 40 days
              </p>
              <ScrollArea className="h-72 rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Weekly</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewTail.map((day) => (
                      <TableRow key={day.day}>
                        <TableCell className="tabular-nums">
                          {day.day}
                          {day.isReset ? (
                            <Badge
                              variant="destructive"
                              className="ml-2 text-[10px]"
                            >
                              reset
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAmount(day.base)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {day.weekly ? formatAmount(day.weekly) : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {day.monthly ? formatAmount(day.monthly) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatAmount(day.reward)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Simulates every streak day with milestones and cap-reset logic from
            shared. Up to 50,000 days runs client-side in chunks so the tab
            stays responsive.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default DevBonusSimLab
