import { resolveGuildTimezone } from 'gambling-bot-shared'
import { DateTime } from 'luxon'

import { getWholeTimeRange } from '@/lib/overview/datePresets'

const REPORT_SEARCHABLE_START_YEAR = 2025

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

function getPriorCalendarYearBounds(timezone?: string | null) {
  const priorYear = zoneNow(timezone).minus({ years: 1 })
  return {
    start: priorYear.startOf('year'),
    end: priorYear.endOf('year')
  }
}

function getQuarterBounds(
  year: number,
  quarter: 1 | 2 | 3 | 4,
  timezone?: string | null
) {
  const zone = resolveGuildTimezone(timezone)
  const startMonth = (quarter - 1) * 3 + 1
  const start = DateTime.fromObject(
    { year, month: startMonth, day: 1 },
    { zone }
  ).startOf('day')
  const end = start.plus({ months: 3 }).minus({ days: 1 }).endOf('day')
  return { start, end }
}

function getCurrentCalendarYearBounds(timezone?: string | null) {
  const today = zoneNow(timezone)
  return {
    start: today.startOf('year'),
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

export type ReportPreset = {
  label: string
  match: () => OverviewDateRange
}

export type ReportPresetGroup = {
  label: string
  presets: ReportPreset[]
}

function getCurrentQuarter(timezone?: string | null): 1 | 2 | 3 | 4 {
  return Math.ceil(zoneNow(timezone).month / 3) as 1 | 2 | 3 | 4
}

function quarterPresets(
  year: number,
  maxQuarter: number,
  timezone?: string | null
): ReportPreset[] {
  const currentYear = zoneNow(timezone).year
  const today = zoneNow(timezone).endOf('day')

  return ([1, 2, 3, 4] as const)
    .filter((quarter) => quarter <= maxQuarter)
    .map((quarter) => ({
      label: `Q${quarter} ${year}`,
      match: () => {
        const bounds = getQuarterBounds(year, quarter, timezone)
        const end =
          year === currentYear && bounds.end > today ? today : bounds.end
        return toRangeStrings(bounds.start, end)
      }
    }))
}

function getCalendarYearBounds(year: number, timezone?: string | null) {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromObject(
    { year, month: 1, day: 1 },
    { zone }
  ).startOf('day')
  const end = DateTime.fromObject({ year, month: 12, day: 31 }, { zone }).endOf(
    'day'
  )
  return { start, end }
}

function buildCalendarYearPresets(timezone?: string | null): ReportPreset[] {
  const currentYear = zoneNow(timezone).year
  const presets: ReportPreset[] = []

  for (let year = currentYear; year >= REPORT_SEARCHABLE_START_YEAR; year--) {
    if (year === currentYear) {
      presets.push({
        label: `${year} YTD`,
        match: () => {
          const bounds = getCurrentCalendarYearBounds(timezone)
          return toRangeStrings(bounds.start, bounds.end)
        }
      })
      continue
    }

    presets.push({
      label: String(year),
      match: () => {
        const bounds = getCalendarYearBounds(year, timezone)
        return toRangeStrings(bounds.start, bounds.end)
      }
    })
  }

  return presets
}

function buildQuarterSearchPresets(timezone?: string | null): ReportPreset[] {
  const currentYear = zoneNow(timezone).year
  const currentQuarter = getCurrentQuarter(timezone)
  const presets: ReportPreset[] = []

  for (let year = currentYear; year >= REPORT_SEARCHABLE_START_YEAR; year--) {
    const maxQuarter = year === currentYear ? currentQuarter : 4
    presets.push(...quarterPresets(year, maxQuarter, timezone).reverse())
  }

  return presets
}

export function getReportsQuickPresetGroups(
  timezone?: string | null
): ReportPresetGroup[] {
  const priorYear = zoneNow(timezone).year - 1

  return [
    {
      label: 'Quick ranges',
      presets: [
        {
          label: 'Year to date',
          match: () => {
            const bounds = getYearToDateBounds(timezone)
            return toRangeStrings(bounds.start, bounds.end)
          }
        },
        {
          label: 'Month to date',
          match: () => {
            const bounds = getMonthToDateBounds(timezone)
            return toRangeStrings(bounds.start, bounds.end)
          }
        },
        {
          label: 'Last month',
          match: () => {
            const bounds = getLastMonthBounds(timezone)
            return toRangeStrings(bounds.start, bounds.end)
          }
        },
        {
          label: 'Last 7 days',
          match: () => {
            const bounds = getLast7DaysBounds(timezone)
            return toRangeStrings(bounds.start, bounds.end)
          }
        },
        {
          label: `Last year (${priorYear})`,
          match: () => {
            const bounds = getLastYearBounds(timezone)
            return toRangeStrings(bounds.start, bounds.end)
          }
        },
        {
          label: 'All time',
          match: () => {
            const bounds = wholeTimeBounds(timezone)
            return toRangeStrings(bounds.start, bounds.end)
          }
        }
      ]
    }
  ]
}

export function getReportsSearchablePresetGroups(
  timezone?: string | null
): ReportPresetGroup[] {
  return [
    {
      label: 'Calendar years',
      presets: buildCalendarYearPresets(timezone)
    },
    {
      label: 'Quarters',
      presets: buildQuarterSearchPresets(timezone)
    }
  ]
}

function getAllReportsPresets(timezone?: string | null): ReportPreset[] {
  return [
    ...getReportsQuickPresetGroups(timezone).flatMap((group) => group.presets),
    ...getReportsSearchablePresetGroups(timezone).flatMap(
      (group) => group.presets
    )
  ]
}

export function guildTodayDate(timezone?: string | null): Date {
  const today = zoneNow(timezone)
  return new Date(today.year, today.month - 1, today.day, 12)
}

export function resolveReportsDateRange(
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

  const bounds = getPriorCalendarYearBounds(timezone)
  return toRangeStrings(bounds.start, bounds.end)
}

export function getReportsRangeLabel(
  dateFrom: string,
  dateTo: string,
  timezone?: string | null
): string | null {
  for (const preset of getAllReportsPresets(timezone)) {
    const bounds = preset.match()
    if (bounds.dateFrom === dateFrom && bounds.dateTo === dateTo) {
      return preset.label
    }
  }
  return null
}

export type MonthlyTaxPoint = {
  period: string
  gamePnL: number
  cashFlow: number
  betVolume: number
  winVolume: number
  depositVolume: number
  withdrawVolume: number
  txCount: number
}

export type ReportTaxGranularity = 'hour' | 'day' | 'month'

function isSameCalendarMonth(
  range: OverviewDateRange,
  timezone?: string | null
): boolean {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone })
  const end = DateTime.fromISO(range.dateTo, { zone })
  return start.year === end.year && start.month === end.month
}

export function resolveReportTaxGranularity(
  range: OverviewDateRange,
  timezone?: string | null
): ReportTaxGranularity {
  const dayCount = getOverviewRangeDayCount(range, timezone)
  if (dayCount <= 1) return 'hour'
  if (isSameCalendarMonth(range, timezone) || dayCount <= 30) return 'day'
  return 'month'
}

function emptyTaxPeriodPoint(period: string): MonthlyTaxPoint {
  return {
    period,
    gamePnL: 0,
    cashFlow: 0,
    betVolume: 0,
    winVolume: 0,
    depositVolume: 0,
    withdrawVolume: 0,
    txCount: 0
  }
}

export function fillTaxHourlySeries(
  range: OverviewDateRange,
  points: MonthlyTaxPoint[],
  timezone?: string | null
): MonthlyTaxPoint[] {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone }).startOf('day')
  const end = DateTime.fromISO(range.dateTo, { zone }).endOf('day')
  const byPeriod = new Map(points.map((point) => [point.period, point]))

  const hours: MonthlyTaxPoint[] = []
  let cursor = start
  while (cursor <= end) {
    const period = cursor.toFormat(HOURLY_BUCKET_FORMAT)
    hours.push(byPeriod.get(period) ?? emptyTaxPeriodPoint(period))
    cursor = cursor.plus({ hours: 1 })
  }

  return hours
}

export function fillTaxDailySeries(
  range: OverviewDateRange,
  points: MonthlyTaxPoint[],
  timezone?: string | null
): MonthlyTaxPoint[] {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone }).startOf('day')
  const end = DateTime.fromISO(range.dateTo, { zone }).startOf('day')
  const byPeriod = new Map(points.map((point) => [point.period, point]))

  const days: MonthlyTaxPoint[] = []
  let cursor = start
  while (cursor <= end) {
    const period = cursor.toFormat('yyyy-MM-dd')
    days.push(byPeriod.get(period) ?? emptyTaxPeriodPoint(period))
    cursor = cursor.plus({ days: 1 })
  }

  return days
}

export function fillTaxPeriodSeries(
  range: OverviewDateRange,
  points: MonthlyTaxPoint[],
  granularity: ReportTaxGranularity,
  timezone?: string | null
): MonthlyTaxPoint[] {
  switch (granularity) {
    case 'hour':
      return fillTaxHourlySeries(range, points, timezone)
    case 'day':
      return fillTaxDailySeries(range, points, timezone)
    case 'month':
      return fillMonthlySeries(range, points, timezone)
  }
}

export function getReportPeriodColumnLabel(
  granularity: ReportTaxGranularity
): string {
  switch (granularity) {
    case 'hour':
      return 'Hour'
    case 'day':
      return 'Day'
    case 'month':
      return 'Month'
  }
}

export function formatReportPeriodLabel(
  period: string,
  granularity: ReportTaxGranularity,
  timezone?: string | null
): string {
  const zone = resolveGuildTimezone(timezone)

  if (granularity === 'month') {
    return DateTime.fromISO(`${period}-01`, { zone }).toFormat('LLLL yyyy')
  }

  if (granularity === 'day') {
    return DateTime.fromISO(period, { zone }).toFormat('d MMM yyyy')
  }

  return formatOverviewHourTooltip(
    parseOverviewBucket(period, timezone),
    timezone
  )
}

export function getReportTaxSummaryDescription(
  kind: 'guild' | 'staff',
  granularity: ReportTaxGranularity
): string {
  const interval =
    granularity === 'hour'
      ? 'Hourly'
      : granularity === 'day'
        ? 'Daily'
        : 'Monthly'

  if (kind === 'guild') {
    return `${interval} house P&L, cash flow, and volume totals for the guild.`
  }

  return `${interval} totals for transactions handled by staff members.`
}

export function fillMonthlySeries(
  range: OverviewDateRange,
  points: MonthlyTaxPoint[],
  timezone?: string | null
): MonthlyTaxPoint[] {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(range.dateFrom, { zone }).startOf('month')
  const end = DateTime.fromISO(range.dateTo, { zone }).startOf('month')
  const byPeriod = new Map(points.map((point) => [point.period, point]))

  const months: MonthlyTaxPoint[] = []
  let cursor = start
  while (cursor <= end) {
    const period = cursor.toFormat('yyyy-MM')
    months.push(
      byPeriod.get(period) ?? {
        period,
        gamePnL: 0,
        cashFlow: 0,
        betVolume: 0,
        winVolume: 0,
        depositVolume: 0,
        withdrawVolume: 0,
        txCount: 0
      }
    )
    cursor = cursor.plus({ months: 1 })
  }

  return months
}

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
  return getOverviewRangeDayCount(range, timezone) <= 5 ? 'hour' : 'day'
}

export function getOverviewHourlyDayCount(
  points: OverviewDailyPoint[]
): number {
  return new Set(points.map((point) => point.date.slice(0, 10))).size
}

const HOURLY_BUCKET_FORMAT = "yyyy-MM-dd'T'HH:00"

export const SINGLE_DAY_HOUR_AXIS_TICKS = [0, 3, 6, 9, 12, 15, 18, 21] as const
export const MULTI_DAY_HOUR_AXIS_TICKS = [0, 12] as const

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

export function formatOverviewDayLabel(bucket: DateTime): string {
  return bucket.toFormat('d. MMMM')
}

export function formatOverviewDayNumericMonthLabel(bucket: DateTime): string {
  return bucket.toFormat('d. M')
}

export function formatOverviewDailyAxisTick(
  dateKey: string,
  timezone?: string | null
): string {
  return formatOverviewDayLabel(
    DateTime.fromISO(dateKey, { zone: resolveGuildTimezone(timezone) })
  )
}

export function formatOverviewDayTooltip(bucket: DateTime): string {
  return bucket.toFormat('d. MMMM yyyy')
}

export function formatOverviewMultiDayHourAxisTick(
  bucket: DateTime,
  dayCount: number,
  timezone?: string | null
): string {
  if (dayCount === 5) {
    return formatOverviewDayLabel(bucket)
  }

  const time = formatOverviewHourLabel(bucket, timezone)

  if (dayCount === 2) {
    return `${formatOverviewDayLabel(bucket)} ${time}`
  }

  return `${formatOverviewDayNumericMonthLabel(bucket)} ${time}`
}

export function buildSingleDayHourAxisTicks(
  points: OverviewDailyPoint[],
  timezone?: string | null
): string[] {
  return points
    .filter((point) =>
      (SINGLE_DAY_HOUR_AXIS_TICKS as readonly number[]).includes(
        parseOverviewBucket(point.date, timezone).hour
      )
    )
    .map((point) => point.date)
}

export function buildMultiDayHourAxisTicks(
  points: OverviewDailyPoint[],
  dayCount: number,
  timezone?: string | null
): string[] {
  if (dayCount === 5) {
    return points
      .filter((point) => parseOverviewBucket(point.date, timezone).hour === 0)
      .map((point) => point.date)
  }

  return points
    .filter((point) =>
      (MULTI_DAY_HOUR_AXIS_TICKS as readonly number[]).includes(
        parseOverviewBucket(point.date, timezone).hour
      )
    )
    .map((point) => point.date)
}

export function formatOverviewHourTooltip(
  bucket: DateTime,
  timezone?: string | null
): string {
  if (uses24HourClock(timezone)) {
    return bucket.toFormat('d. MMMM yyyy HH:mm')
  }

  return bucket
    .toFormat('d. MMMM yyyy h:mm a')
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
