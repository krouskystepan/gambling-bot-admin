'use client'

import { format, startOfDay } from 'date-fns'
import { ChevronDownIcon } from 'lucide-react'
import { DateTime } from 'luxon'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DateTimePickerProps = {
  id?: string
  date?: Date
  time?: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  disabled?: boolean
  disablePastDates?: boolean
  className?: string
}

export function pragueDateTimeFromPicker(
  date: Date,
  time: string
): DateTime | null {
  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null
  }

  const dt = DateTime.fromObject(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour,
      minute
    },
    { zone: 'Europe/Prague' }
  )

  return dt.isValid ? dt : null
}

const DateTimePicker = ({
  id = 'datetime-picker',
  date,
  time = '',
  onDateChange,
  onTimeChange,
  disabled = false,
  disablePastDates = false,
  className
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date | undefined>(date)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center',
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={`${id}-date`}
            disabled={disabled}
            data-empty={!date}
            className={cn(
              'h-9.5 w-full justify-between font-normal sm:flex-1',
              !date && 'text-muted-foreground'
            )}
          >
            {date ? format(date, 'dd.MM.yyyy') : 'Select date'}
            <ChevronDownIcon className="size-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            month={month ?? date}
            onMonthChange={setMonth}
            disabled={
              disablePastDates ? { before: startOfDay(new Date()) } : undefined
            }
            onSelect={(nextDate) => {
              onDateChange(nextDate)
              if (nextDate) setMonth(nextDate)
              setOpen(false)
            }}
            className="p-3"
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        id={`${id}-time`}
        value={time}
        disabled={disabled}
        onChange={(event) => onTimeChange(event.target.value)}
        className="h-9.5 w-full appearance-none bg-background sm:w-32 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </div>
  )
}

export default DateTimePicker
