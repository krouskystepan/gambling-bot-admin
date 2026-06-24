'use client'

import { defaultCasinoSettings } from 'gambling-bot-shared/casino'
import { type TCasinoSettings } from 'gambling-bot-shared/casino'
import {
  type MonteCarloResult,
  runAllMonteCarloSimulations
} from 'gambling-bot-shared/dev'

import { useMemo, useState, useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const ITERATION_OPTIONS = [
  { label: '10k', value: 10_000 },
  { label: '100k', value: 100_000 },
  { label: '1M', value: 1_000_000 },
  { label: '5M', value: 5_000_000 }
] as const

type DevCasinoSimLabProps = {
  casinoSettings: TCasinoSettings
}

const formatRtp = (value: number | null) =>
  value == null ? '—' : `${value.toFixed(3)}%`

const deltaBadge = (delta: number | null) => {
  if (delta == null) return null

  const abs = Math.abs(delta)
  const variant =
    abs <= 0.5 ? 'secondary' : abs <= 2 ? 'outline' : 'destructive'

  return (
    <Badge variant={variant} className="tabular-nums">
      {delta >= 0 ? '+' : ''}
      {delta.toFixed(3)}%
    </Badge>
  )
}

const DevCasinoSimLab = ({ casinoSettings }: DevCasinoSimLabProps) => {
  const [iterations, setIterations] = useState(
    String(ITERATION_OPTIONS[1].value)
  )
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<MonteCarloResult[] | null>(null)
  const [isPending, startTransition] = useTransition()

  const settings = useMemo(
    () => ({ ...defaultCasinoSettings, ...casinoSettings }),
    [casinoSettings]
  )

  const runSimulation = () => {
    const count = Number(iterations)
    setProgress(0)
    setResults(null)

    startTransition(async () => {
      const rows = await runAllMonteCarloSimulations(
        settings,
        count,
        (completed, total) => setProgress(Math.round((completed / total) * 100))
      )
      setResults(rows)
      setProgress(100)
    })
  }

  const maxDelta = results
    ? Math.max(...results.map((row) => Math.abs(row.delta ?? 0)))
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Casino RTP lab</CardTitle>
        <CardDescription>
          Monte Carlo simulations on this guild&apos;s casino settings. Compare
          empirical RTP against the analytical formula from shared.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="mc-iterations">Iterations per game</Label>
            <Select value={iterations} onValueChange={setIterations}>
              <SelectTrigger id="mc-iterations" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITERATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button disabled={isPending} onClick={runSimulation}>
            {isPending ? `Running… ${progress}%` : 'Run all games'}
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

        {results ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {results.length} targets · {Number(iterations).toLocaleString()}{' '}
                rolls each
              </span>
              {maxDelta != null ? (
                <Badge
                  variant={maxDelta <= 1 ? 'secondary' : 'destructive'}
                  className="tabular-nums"
                >
                  Max Δ {maxDelta.toFixed(3)}%
                </Badge>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead className="text-right">Theoretical</TableHead>
                    <TableHead className="text-right">Empirical</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => (
                    <TableRow key={row.target}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRtp(row.theoreticalRtp)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          row.theoreticalRtp != null &&
                            Math.abs(row.delta ?? 0) > 2 &&
                            'text-destructive'
                        )}
                      >
                        {formatRtp(row.empiricalRtp)}
                      </TableCell>
                      <TableCell className="text-right">
                        {deltaBadge(row.delta)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.elapsedMs} ms
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Runs dice, coin flip, slots, lottery, plinko, golden jackpot, and
            each roulette bet type. Large iteration counts can take a few
            seconds in the browser.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default DevCasinoSimLab
