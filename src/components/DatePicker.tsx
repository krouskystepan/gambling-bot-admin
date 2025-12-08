'use client'

import { useState } from 'react'
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'

const DatePicker = ({
  onChange,
  initialRange,
}: {
  onChange: (range: { from: Date; to: Date } | undefined) => void
  initialRange?: DateRange
}) => {
  const today = new Date()

  const [date, setDate] = useState(initialRange)
  const [month, setMonth] = useState(
    initialRange?.to ?? initialRange?.from ?? undefined
  )

  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  }
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  }
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  }
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  }
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  }
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  }
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            'h-[38px] w-64 justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon
            className="-ms-1 opacity-60"
            size={16}
            aria-hidden="true"
          />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'LLL dd, y')} -{' '}
                {format(date.to, 'LLL dd, y')}
              </>
            ) : (
              format(date.from, 'LLL dd, y')
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <div className="flex max-sm:flex-col">
          <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
            <div className="h-full sm:border-e">
              <div className="flex flex-col px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate({
                      from: today,
                      to: today,
                    })
                    setMonth(today)
                    onChange({ from: today, to: today })
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(yesterday)
                    setMonth(yesterday.to)
                    onChange(yesterday)
                  }}
                >
                  Yesterday
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(last7Days)
                    setMonth(last7Days.to)
                    onChange(last7Days)
                  }}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(last30Days)
                    setMonth(last30Days.to)
                    onChange(last30Days)
                  }}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(monthToDate)
                    setMonth(monthToDate.to)
                    onChange(monthToDate)
                  }}
                >
                  Month to date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(lastMonth)
                    setMonth(lastMonth.to)
                    onChange(lastMonth)
                  }}
                >
                  Last month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(yearToDate)
                    setMonth(yearToDate.to)
                    onChange(yearToDate)
                  }}
                >
                  Year to date
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setDate(lastYear)
                    setMonth(lastYear.to)
                    onChange(lastYear)
                  }}
                >
                  Last year
                </Button>
              </div>
            </div>
          </div>
          <Calendar
            mode="range"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate)
              if (newDate?.from && newDate.to) {
                onChange({ from: newDate.from, to: newDate.to })
              } else {
                onChange(undefined)
              }
            }}
            month={month}
            numberOfMonths={2}
            onMonthChange={setMonth}
            className="p-2"
            disabled={[{ after: today }]}
            endMonth={today}
            showOutsideDays={false}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
