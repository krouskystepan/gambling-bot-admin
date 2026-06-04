'use client'

import {
  BONUS_MAX_AMOUNT,
  BONUS_MAX_STREAK_MULTIPLIER,
  type GlobalSettings,
  calculateBonusReward,
  parseBonusAmountInput,
  parseBonusMultiplierInput
} from 'gambling-bot-shared'
import { TrendingUp } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'

import { useMemo } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatGuildMoney } from '@/lib/guildMoney'
import { cn } from '@/lib/utils'
import { TBonusFormInput } from '@/types/types'

const STREAK_HINT_DAY = 7

type RewardCurveCardProps = {
  globalSettings: GlobalSettings
}

const RewardCurveCard = ({ globalSettings }: RewardCurveCardProps) => {
  const form = useFormContext<TBonusFormInput>()
  const watched = useWatch({ control: form.control })

  const {
    rewardMode = 'linear',
    baseReward = 0,
    streakIncrement = 0,
    streakMultiplier = 1,
    maxReward = 0,
    resetOnMax = false,
    milestoneBonus: {
      weekly: milestoneWeekly = 0,
      monthly: milestoneMonthly = 0
    } = {}
  } = watched ?? {}

  const streakHint = useMemo(() => {
    const settings = {
      rewardMode: rewardMode as 'linear' | 'exponential',
      baseReward: Number(baseReward),
      streakIncrement: Number(streakIncrement),
      streakMultiplier: Number(streakMultiplier),
      maxReward: Number(maxReward),
      resetOnMax,
      milestoneBonus: {
        weekly: Number(milestoneWeekly),
        monthly: Number(milestoneMonthly)
      }
    }
    return calculateBonusReward({ streak: STREAK_HINT_DAY, settings }).base
  }, [
    rewardMode,
    baseReward,
    streakIncrement,
    streakMultiplier,
    maxReward,
    resetOnMax,
    milestoneWeekly,
    milestoneMonthly
  ])

  return (
    <Card className="gap-4 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4" />
          Reward curve
        </CardTitle>
        <CardDescription>
          How the daily streak reward grows over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <FormField
          control={form.control}
          name="rewardMode"
          render={({ field }) => (
            <FormItem>
              <Label>Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: 'linear',
                      label: 'Linear',
                      description: 'Fixed amount added each day'
                    },
                    {
                      value: 'exponential',
                      label: 'Exponential',
                      description: 'Multiplied each day'
                    }
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => field.onChange(mode.value)}
                    className={cn(
                      'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                      field.value === mode.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <span className="text-sm font-medium">{mode.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {mode.description}
                    </span>
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseReward"
          render={({ field }) => (
            <FormItem>
              <Label>Base reward (day 1)</Label>
              <FormControl>
                <Input
                  variant="muted"
                  type="text"
                  inputMode="numeric"
                  maxLength={String(BONUS_MAX_AMOUNT).length}
                  onChange={(e) =>
                    field.onChange(parseBonusAmountInput(e.target.value))
                  }
                  value={field.value}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Max {BONUS_MAX_AMOUNT.toLocaleString()}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {rewardMode === 'linear' && (
          <FormField
            control={form.control}
            name="streakIncrement"
            render={({ field }) => (
              <FormItem>
                <Label>Streak increment</Label>
                <FormControl>
                  <Input
                    variant="muted"
                    type="text"
                    inputMode="numeric"
                    maxLength={String(BONUS_MAX_AMOUNT).length}
                    onChange={(e) =>
                      field.onChange(parseBonusAmountInput(e.target.value))
                    }
                    value={field.value}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Day {STREAK_HINT_DAY} base ≈{' '}
                  {formatGuildMoney(streakHint, globalSettings)} · max{' '}
                  {BONUS_MAX_AMOUNT.toLocaleString()}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {rewardMode === 'exponential' && (
          <FormField
            control={form.control}
            name="streakMultiplier"
            render={({ field }) => (
              <FormItem>
                <Label>Streak multiplier</Label>
                <FormControl>
                  <Input
                    variant="muted"
                    type="text"
                    inputMode="decimal"
                    value={String(field.value ?? '')}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.]/g, '')
                      field.onChange(cleaned)
                    }}
                    onBlur={(e) => {
                      const parsed = parseBonusMultiplierInput(e.target.value)
                      field.onChange(parsed ?? 1)
                      field.onBlur()
                    }}
                    step={0.1}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Day {STREAK_HINT_DAY} base ≈{' '}
                  {formatGuildMoney(streakHint, globalSettings)} · max ×
                  {BONUS_MAX_STREAK_MULTIPLIER}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default RewardCurveCard
