'use client'

import { PreviewDay } from 'gambling-bot-shared'
import { formatNumberToReadableString } from 'gambling-bot-shared'
import { Tooltip as TooltipPrimitive } from 'radix-ui'

import {
  Card,
  CardContent
} from '@/components/ui/card'
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type BonusesCalendarProps = {
  preview: PreviewDay[]
  compact?: boolean
}

const chunkIntoWeeks = (days: PreviewDay[]): PreviewDay[][] => {
  const result: PreviewDay[][] = []

  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7))
  }

  return result
}

const getDayCellStyle = (day: PreviewDay) => {
  const isWeekly = day.day % 7 === 0 && day.weekly > 0
  const isMonthly = day.day % 28 === 0 && day.monthly > 0

  if (isMonthly) {
    return 'border-chart-4/50 bg-chart-4/20 hover:bg-chart-4/30'
  }
  if (isWeekly) {
    return 'border-chart-2/50 bg-chart-2/20 hover:bg-chart-2/30'
  }
  if (day.isReset) {
    return 'border-destructive/50 bg-destructive/15 hover:bg-destructive/25'
  }
  return 'border-chart-3/30 bg-chart-3/10 hover:bg-chart-3/20'
}

const DayCell = ({ day }: { day: PreviewDay }) => {
  const { day: dayNumber, reward, base, weekly, monthly, isReset } = day
  const isWeekly = dayNumber % 7 === 0 && weekly > 0
  const isMonthly = dayNumber % 28 === 0 && monthly > 0

  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex aspect-square min-w-0 w-full flex-col items-center justify-center gap-0.5 rounded-md border p-1 text-center',
            'cursor-default transition-colors',
            getDayCellStyle(day)
          )}
        >
          <span className="text-[10px] leading-none text-muted-foreground">
            {dayNumber}
          </span>
          <span className="w-full truncate text-[11px] font-semibold leading-tight text-foreground">
            {formatNumberToReadableString(reward)}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        hideArrow
        sideOffset={4}
        className="border-border/60 bg-background text-foreground shadow-xl"
      >
        <div className="space-y-1.5">
          <p className="font-medium">Day {dayNumber}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-[2px] bg-chart-3" />
              Base: {formatNumberToReadableString(base)}
            </div>
            {weekly > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-chart-2" />
                Weekly: {formatNumberToReadableString(weekly)}
              </div>
            )}
            {monthly > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-chart-4" />
                Monthly: {formatNumberToReadableString(monthly)}
              </div>
            )}
          </div>
          {(isReset || isWeekly || isMonthly) && (
            <div className="flex flex-wrap gap-1 border-t border-border/60 pt-1.5">
              {isReset && (
                <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                  Cap reset
                </span>
              )}
              {isWeekly && (
                <span className="rounded-full bg-chart-2/20 px-1.5 py-0.5 text-[10px] font-medium text-chart-2">
                  Weekly
                </span>
              )}
              {isMonthly && (
                <span className="rounded-full bg-chart-4/20 px-1.5 py-0.5 text-[10px] font-medium text-chart-4">
                  Monthly
                </span>
              )}
            </div>
          )}
        </div>
      </TooltipContent>
    </TooltipPrimitive.Root>
  )
}

const BonusesCalendar = ({ preview, compact = false }: BonusesCalendarProps) => {
  const weeks = chunkIntoWeeks(preview)

  return (
    <Card className="gap-0 border-dashed py-4 shadow-none">
      <CardContent className="space-y-3 pt-0">
        <TooltipProvider delayDuration={200}>
          <div
            className={cn(
              'space-y-2',
              compact && 'max-h-72 overflow-y-auto pr-1'
            )}
          >
            {weeks.map((week, index) => {
              const showDivider = index !== 0 && index % 4 === 0

              return (
                <div key={index} className="space-y-2">
                  {showDivider && (
                    <div className="h-px w-full bg-border/60" />
                  )}

                  <div className="grid grid-cols-7 gap-1.5">
                    {week.map((day) => (
                      <DayCell key={day.day} day={day} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TooltipProvider>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-[2px] bg-chart-3/40" />
            Base
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-[2px] bg-chart-2/40" />
            Weekly
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-[2px] bg-chart-4/40" />
            Monthly
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive" />
            Cap reset
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default BonusesCalendar
