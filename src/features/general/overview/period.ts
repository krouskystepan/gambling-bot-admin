import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears
} from 'date-fns'

import { getWholeTimeRange } from '@/lib/datePresets'

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromLocalDateString(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export type OverviewDateRange = {
  dateFrom: string
  dateTo: string
}

const PRESET_LABELS: { label: string; match: () => OverviewDateRange }[] =
  [
    { label: 'All time', match: () => boundsToStrings(wholeTimeBounds()) },
    {
      label: 'Year to date (1 Jan – today)',
      match: () => boundsToStrings(getYearToDateBounds())
    },
    {
      label: 'Month to date (1st – today)',
      match: () => boundsToStrings(getMonthToDateBounds())
    },
    {
      label: 'Last month',
      match: () => boundsToStrings(getLastMonthBounds())
    },
    {
      label: 'Last year (1 Jan – 31 Dec)',
      match: () => boundsToStrings(getLastYearBounds())
    },
    {
      label: 'Last 7 days',
      match: () => boundsToStrings(getLast7DaysBounds())
    }
  ]

function boundsToStrings(bounds: { start: Date; end: Date }): OverviewDateRange {
  return {
    dateFrom: format(bounds.start, 'yyyy-MM-dd'),
    dateTo: format(bounds.end, 'yyyy-MM-dd')
  }
}

function wholeTimeBounds() {
  const { from, to } = getWholeTimeRange()
  return { start: from, end: to }
}

function getYearToDateBounds() {
  const today = new Date()
  return { start: startOfDay(startOfYear(today)), end: endOfDay(today) }
}

function getMonthToDateBounds() {
  const today = new Date()
  return { start: startOfDay(startOfMonth(today)), end: endOfDay(today) }
}

function getLastMonthBounds() {
  const today = new Date()
  const previousMonth = subMonths(today, 1)
  return {
    start: startOfDay(startOfMonth(previousMonth)),
    end: endOfDay(endOfMonth(previousMonth))
  }
}

function getLastYearBounds() {
  const today = new Date()
  const previousYear = subYears(today, 1)
  return {
    start: startOfDay(startOfYear(previousYear)),
    end: endOfDay(endOfYear(previousYear))
  }
}

function getLast7DaysBounds() {
  const today = new Date()
  return { start: startOfDay(subDays(today, 6)), end: endOfDay(today) }
}

export function resolveOverviewDateRange(searchParams?: {
  dateFrom?: string
  dateTo?: string
}): OverviewDateRange {
  const { dateFrom, dateTo } = searchParams ?? {}

  if (dateFrom && dateTo) {
    return { dateFrom, dateTo }
  }

  return boundsToStrings(getYearToDateBounds())
}

export function getOverviewRangeLabel(dateFrom: string, dateTo: string): string {
  for (const preset of PRESET_LABELS) {
    const bounds = preset.match()
    if (bounds.dateFrom === dateFrom && bounds.dateTo === dateTo) {
      return preset.label
    }
  }
  return 'Custom range'
}

export type OverviewDailyPoint = {
  date: string
  gamePnL: number
  cashFlow: number
  txCount: number
}

export function fillDailySeries(
  range: OverviewDateRange,
  points: OverviewDailyPoint[]
): OverviewDailyPoint[] {
  const start = startOfDay(new Date(range.dateFrom))
  const end = startOfDay(new Date(range.dateTo))
  const byDate = new Map(points.map((p) => [p.date, p]))

  return eachDayOfInterval({ start, end }).map((day) => {
    const date = format(day, 'yyyy-MM-dd')
    return (
      byDate.get(date) ?? {
        date,
        gamePnL: 0,
        cashFlow: 0,
        txCount: 0
      }
    )
  })
}
