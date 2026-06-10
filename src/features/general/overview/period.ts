import { resolveGuildTimezone } from 'gambling-bot-shared'
import { DateTime } from 'luxon'

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

const toRangeStrings = (start: DateTime, end: DateTime): OverviewDateRange => ({
  dateFrom: start.toFormat('yyyy-MM-dd'),
  dateTo: end.toFormat('yyyy-MM-dd')
})

const zoneNow = (timezone?: string | null) =>
  DateTime.now().setZone(resolveGuildTimezone(timezone))

function wholeTimeBounds(timezone?: string | null) {
  const { from, to } = getWholeTimeRange()
  return {
    start: DateTime.fromJSDate(from, { zone: resolveGuildTimezone(timezone) }),
    end: DateTime.fromJSDate(to, { zone: resolveGuildTimezone(timezone) })
  }
}

function getYearToDateBounds(timezone?: string | null) {
  const today = zoneNow(timezone)
  return {
    start: today.startOf('year'),
    end: today.endOf('day')
  }
}

function getMonthToDateBounds(timezone?: string | null) {
  const today = zoneNow(timezone)
  return {
    start: today.startOf('month'),
    end: today.endOf('day')
  }
}

function getLastMonthBounds(timezone?: string | null) {
  const previousMonth = zoneNow(timezone).minus({ months: 1 })
  return {
    start: previousMonth.startOf('month'),
    end: previousMonth.endOf('month')
  }
}

function getLastYearBounds(timezone?: string | null) {
  const previousYear = zoneNow(timezone).minus({ years: 1 })
  return {
    start: previousYear.startOf('year'),
    end: previousYear.endOf('year')
  }
}

function getLast7DaysBounds(timezone?: string | null) {
  const today = zoneNow(timezone)
  return {
    start: today.minus({ days: 6 }).startOf('day'),
    end: today.endOf('day')
  }
}

const buildPresetLabels = (timezone?: string | null) => [
  {
    label: 'All time',
    match: () => {
      const b = wholeTimeBounds(timezone)
      return toRangeStrings(b.start, b.end)
    }
  },
  {
    label: 'Year to date (1 Jan – today)',
    match: () => {
      const b = getYearToDateBounds(timezone)
      return toRangeStrings(b.start, b.end)
    }
  },
  {
    label: 'Month to date (1st – today)',
    match: () => {
      const b = getMonthToDateBounds(timezone)
      return toRangeStrings(b.start, b.end)
    }
  },
  {
    label: 'Last month',
    match: () => {
      const b = getLastMonthBounds(timezone)
      return toRangeStrings(b.start, b.end)
    }
  },
  {
    label: 'Last year (1 Jan – 31 Dec)',
    match: () => {
      const b = getLastYearBounds(timezone)
      return toRangeStrings(b.start, b.end)
    }
  },
  {
    label: 'Last 7 days',
    match: () => {
      const b = getLast7DaysBounds(timezone)
      return toRangeStrings(b.start, b.end)
    }
  }
]

export function resolveOverviewDateRange(
  searchParams?: {
    dateFrom?: string
    dateTo?: string
  },
  timezone?: string | null
): OverviewDateRange {
  const { dateFrom, dateTo } = searchParams ?? {}

  if (dateFrom && dateTo) {
    return { dateFrom, dateTo }
  }

  const bounds = getYearToDateBounds(timezone)
  return toRangeStrings(bounds.start, bounds.end)
}

export function getOverviewRangeLabel(
  dateFrom: string,
  dateTo: string,
  timezone?: string | null
): string {
  for (const preset of buildPresetLabels(timezone)) {
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

export type OverviewPnLGranularity = 'day' | 'hour'

export type OverviewPnLSeries = {
  granularity: OverviewPnLGranularity
  points: OverviewDailyPoint[]
}

export function getOverviewRangeDayCount(
  range: OverviewDateRange,
  timezone?: string | null
): number {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone }).startOf('day')
  const end = DateTime.fromISO(range.dateTo, { zone }).startOf('day')
  return Math.floor(end.diff(start, 'days').days) + 1
}

export function resolveOverviewPnLGranularity(
  range: OverviewDateRange,
  timezone?: string | null
): OverviewPnLGranularity {
  return getOverviewRangeDayCount(range, timezone) <= 3 ? 'hour' : 'day'
}

const HOURLY_BUCKET_FORMAT = "yyyy-MM-dd'T'HH:00"

export const SINGLE_DAY_HOUR_AXIS_TICKS = [0, 3, 6, 9, 12, 15, 18, 21] as const

export function parseOverviewBucket(
  dateKey: string,
  timezone?: string | null
): DateTime {
  return DateTime.fromISO(dateKey, { zone: resolveGuildTimezone(timezone) })
}

export function uses24HourClock(timezone?: string | null): boolean {
  const zone = resolveGuildTimezone(timezone)
  return !zone.startsWith('America/')
}

export function formatOverviewHourLabel(
  bucket: DateTime,
  timezone?: string | null
): string {
  if (uses24HourClock(timezone)) {
    return bucket.toFormat('H:00')
  }

  return bucket.toFormat('h a').replace(' AM', 'AM').replace(' PM', 'PM')
}

export function formatOverviewHourAxisTick(
  dayStart: DateTime,
  hour: number,
  timezone?: string | null
): string {
  return formatOverviewHourLabel(dayStart.plus({ hours: hour }), timezone)
}

export function formatOverviewHourTooltip(
  bucket: DateTime,
  timezone?: string | null
): string {
  if (uses24HourClock(timezone)) {
    return bucket.toFormat('MMM d, yyyy HH:mm')
  }

  return bucket
    .toFormat('MMM d, yyyy h:mm a')
    .replace(' AM', 'AM')
    .replace(' PM', 'PM')
}

export function fillHourlySeries(
  range: OverviewDateRange,
  points: OverviewDailyPoint[],
  timezone?: string | null
): OverviewDailyPoint[] {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone }).startOf('day')
  const end = DateTime.fromISO(range.dateTo, { zone }).endOf('day')
  const byDate = new Map(points.map((p) => [p.date, p]))

  const hours: OverviewDailyPoint[] = []
  let cursor = start
  while (cursor <= end) {
    const date = cursor.toFormat(HOURLY_BUCKET_FORMAT)
    hours.push(
      byDate.get(date) ?? {
        date,
        gamePnL: 0,
        cashFlow: 0,
        txCount: 0
      }
    )
    cursor = cursor.plus({ hours: 1 })
  }

  return hours
}

export function fillDailySeries(
  range: OverviewDateRange,
  points: OverviewDailyPoint[],
  timezone?: string | null
): OverviewDailyPoint[] {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone }).startOf('day')
  const end = DateTime.fromISO(range.dateTo, { zone }).startOf('day')
  const byDate = new Map(points.map((p) => [p.date, p]))

  const days: OverviewDailyPoint[] = []
  let cursor = start
  while (cursor <= end) {
    const date = cursor.toFormat('yyyy-MM-dd')
    days.push(
      byDate.get(date) ?? {
        date,
        gamePnL: 0,
        cashFlow: 0,
        txCount: 0
      }
    )
    cursor = cursor.plus({ days: 1 })
  }

  return days
}
