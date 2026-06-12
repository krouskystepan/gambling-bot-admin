'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'
import { cn } from '@/lib/utils'

import {
  fromLocalDateString,
  getReportsQuickPresetGroups,
  getReportsRangeLabel,
  guildTodayDate,
  toLocalDateString
} from '../../overview/period'
import ReportsSearchablePeriodSelect from './ReportsSearchablePeriodSelect'

type ReportsPeriodSelectProps = {
  dateFrom: string
  dateTo: string
  timezone: string
}

const ReportsPeriodSelect = ({
  dateFrom,
  dateTo,
  timezone
}: ReportsPeriodSelectProps) => {
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)
  const quickGroups = getReportsQuickPresetGroups(timezone)
  const activePresetLabel = getReportsRangeLabel(dateFrom, dateTo, timezone)
  const guildToday = guildTodayDate(timezone)

  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: fromLocalDateString(dateFrom),
    to: fromLocalDateString(dateTo)
  }))
  const [prevBounds, setPrevBounds] = useState({ dateFrom, dateTo })

  if (dateFrom !== prevBounds.dateFrom || dateTo !== prevBounds.dateTo) {
    setPrevBounds({ dateFrom, dateTo })
    setRange({
      from: fromLocalDateString(dateFrom),
      to: fromLocalDateString(dateTo)
    })
  }

  const applyRange = (next: { from: Date; to: Date }) => {
    setRange(next)
    debouncedUpdateUrl({
      dateFrom: toLocalDateString(next.from),
      dateTo: toLocalDateString(next.to)
    })
  }

  const applyRangeStrings = (next: { dateFrom: string; dateTo: string }) => {
    applyRange({
      from: fromLocalDateString(next.dateFrom),
      to: fromLocalDateString(next.dateTo)
    })
  }

  const triggerLabel =
    activePresetLabel ??
    (range?.from && range.to ? (
      <>
        {format(range.from, 'LLL dd, y')} – {format(range.to, 'LLL dd, y')}
      </>
    ) : (
      'Custom range'
    ))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9.5 min-w-[17rem] justify-start text-left font-normal',
            !activePresetLabel && !range?.from && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="-ms-1 opacity-60" size={16} />
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex max-sm:flex-col">
          <div className="border-b py-3 sm:w-48 sm:border-r sm:border-b-0">
            <div className="flex flex-col gap-4 px-2">
              {quickGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-muted-foreground mb-1.5 px-2 text-xs font-medium tracking-wide uppercase">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.presets.map((preset) => {
                      const isActive = preset.label === activePresetLabel

                      return (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'justify-start font-normal',
                            isActive && 'bg-accent text-accent-foreground'
                          )}
                          onClick={() => applyRangeStrings(preset.match())}
                        >
                          {preset.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-muted-foreground mb-1.5 px-2 text-xs font-medium tracking-wide uppercase">
                  Years & quarters
                </p>
                <ReportsSearchablePeriodSelect
                  timezone={timezone}
                  activeLabel={activePresetLabel}
                  onSelect={applyRangeStrings}
                />
              </div>
            </div>
          </div>

          <div className="p-2">
            <p className="text-muted-foreground mb-2 px-1 text-xs font-medium tracking-wide uppercase">
              Custom range
            </p>
            <Calendar
              mode="range"
              selected={range}
              onSelect={(next) => {
                if (next?.from && next.to) {
                  applyRange({
                    from: fromLocalDateString(toLocalDateString(next.from)),
                    to: fromLocalDateString(toLocalDateString(next.to))
                  })
                  return
                }

                setRange(undefined)
              }}
              month={range?.to ?? range?.from ?? guildToday}
              numberOfMonths={2}
              disabled={[{ after: guildToday }]}
              showOutsideDays={false}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ReportsPeriodSelect
