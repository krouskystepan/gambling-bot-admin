'use client'

import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears
} from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { useState } from 'react'

import { cn } from '@/lib/utils'

import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

function safe(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
}

const DatePicker = ({
  onChange,
  initialRange
}: {
  onChange: (range: { from: Date; to: Date } | undefined) => void
  initialRange?: DateRange
}) => {
  const today = safe(new Date())

  const [month, setMonth] = useState<Date>(
    initialRange?.to ?? initialRange?.from ?? today
  )

  const yesterday = {
    from: safe(subDays(today, 1)),
    to: safe(subDays(today, 1))
  }
  const last7Days = { from: safe(subDays(today, 6)), to: today }
  const last30Days = { from: safe(subDays(today, 29)), to: today }
  const monthToDate = { from: safe(startOfMonth(today)), to: today }
  const lastMonth = {
    from: safe(startOfMonth(subMonths(today, 1))),
    to: safe(endOfMonth(subMonths(today, 1)))
  }
  const yearToDate = { from: safe(startOfYear(today)), to: today }
  const lastYear = {
    from: safe(startOfYear(subYears(today, 1))),
    to: safe(endOfYear(subYears(today, 1)))
  }

  function apply(range: { from: Date; to: Date }) {
    setMonth(range.to)
    onChange(range)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9.5 w-64 justify-start text-left font-normal',
            !initialRange && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="-ms-1 opacity-60" size={16} />
          {initialRange?.from ? (
            initialRange.to ? (
              <>
                {format(initialRange.from, 'LLL dd, y')} -{' '}
                {format(initialRange.to, 'LLL dd, y')}
              </>
            ) : (
              format(initialRange.from, 'LLL dd, y')
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="center">
        <div className="flex max-sm:flex-col">
          <div className="py-4 sm:w-32 sm:border-r">
            <div className="flex flex-col px-2 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply({ from: today, to: today })}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(yesterday)}
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(last7Days)}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(last30Days)}
              >
                Last 30 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(monthToDate)}
              >
                Month to date
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(lastMonth)}
              >
                Last month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apply(yearToDate)}
              >
                Year to date
              </Button>
              <Button variant="ghost" size="sm" onClick={() => apply(lastYear)}>
                Last year
              </Button>
            </div>
          </div>

          <Calendar
            mode="range"
            selected={initialRange}
            onSelect={(r) => {
              if (r?.from && r.to) apply({ from: safe(r.from), to: safe(r.to) })
              else onChange(undefined)
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
