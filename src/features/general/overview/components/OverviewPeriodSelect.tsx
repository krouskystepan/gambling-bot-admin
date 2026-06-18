'use client'

import { DateRange } from 'react-day-picker'

import { useState } from 'react'

import DatePicker from '@/components/DatePicker'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useUpdateUrl } from '@/hooks/useUpdateUrl'

import { fromLocalDateString, toLocalDateString } from '../period'

type OverviewDateRangePickerProps = {
  dateFrom: string
  dateTo: string
}

const OverviewDateRangePicker = ({
  dateFrom,
  dateTo
}: OverviewDateRangePickerProps) => {
  const updateUrl = useUpdateUrl()
  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 300)

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

  return (
    <DatePicker
      value={range}
      onChange={(next) => {
        if (next?.from && next?.to) {
          setRange(next)
          debouncedUpdateUrl({
            dateFrom: toLocalDateString(next.from),
            dateTo: toLocalDateString(next.to)
          })
          return
        }

        setRange(undefined)
      }}
    />
  )
}

export default OverviewDateRangePicker
