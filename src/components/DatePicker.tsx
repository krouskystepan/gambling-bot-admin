'use client'

import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { useState } from 'react'

import {
  formatDatePickerRange,
  getDatePickerPresets,
  getDatePickerRangeLabel,
  getWholeTimeDateRange,
  rangesMatch,
  safeDate
} from '@/lib/datePickerPresets'
import { cn } from '@/lib/utils'

import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

const DatePicker = ({
  onChange,
  value,
  initialRange,
  defaultToAllTime = true,
  onOpenChange
}: {
  onChange: (range: { from: Date; to: Date } | undefined) => void
  value?: DateRange
  initialRange?: DateRange
  defaultToAllTime?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const today = safeDate(new Date())
  const presets = getDatePickerPresets(today)
  const wholeTime = getWholeTimeDateRange(today)
  const controlledRange = value ?? initialRange

  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(
    controlledRange?.to ?? controlledRange?.from ?? today
  )
  const [prevControlledRange, setPrevControlledRange] =
    useState(controlledRange)

  if (controlledRange !== prevControlledRange) {
    setPrevControlledRange(controlledRange)
    if (controlledRange?.to ?? controlledRange?.from) {
      setMonth(controlledRange.to ?? controlledRange.from ?? today)
    }
  }

  const displayRange =
    controlledRange?.from && controlledRange.to
      ? {
          from: safeDate(controlledRange.from),
          to: safeDate(controlledRange.to)
        }
      : defaultToAllTime
        ? wholeTime
        : undefined

  const isAllTime =
    !controlledRange?.from && !controlledRange?.to && defaultToAllTime

  const activePresetLabel = displayRange
    ? isAllTime
      ? 'All time'
      : getDatePickerRangeLabel(displayRange.from, displayRange.to, today)
    : null

  const triggerLabel = activePresetLabel
    ? activePresetLabel
    : displayRange
      ? formatDatePickerRange(displayRange.from, displayRange.to)
      : 'Pick a date'

  function apply(range: { from: Date; to: Date }) {
    setMonth(range.to)
    onChange(range)
  }

  function applyPreset(preset: (typeof presets)[number]) {
    const range = preset.match()
    if (preset.label === 'All time' && defaultToAllTime) {
      setMonth(range.to)
      onChange(undefined)
      return
    }
    apply(range)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        onOpenChange?.(nextOpen)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9.5 w-64 justify-start text-left font-normal',
            !displayRange && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="-ms-1 opacity-60" size={16} />
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="center">
        <div className="flex max-sm:flex-col">
          <div className="py-4 sm:w-32 sm:border-r">
            <div className="flex flex-col gap-1 px-2">
              {presets.map((preset) => {
                const presetRange = preset.match()
                const isActive = isAllTime
                  ? preset.label === 'All time'
                  : displayRange
                    ? rangesMatch(displayRange, presetRange)
                    : false

                return (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'justify-start font-normal',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <Calendar
            mode="range"
            selected={
              displayRange
                ? { from: displayRange.from, to: displayRange.to }
                : undefined
            }
            onSelect={(range) => {
              if (range?.from && range.to) {
                apply({ from: safeDate(range.from), to: safeDate(range.to) })
                return
              }
              onChange(undefined)
            }}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={2}
            disabled={[{ after: today }]}
            showOutsideDays={false}
            className="p-2"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
