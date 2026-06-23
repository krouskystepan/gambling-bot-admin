import {
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears
} from 'date-fns'

import { getWholeTimeRange } from '@/lib/overview/datePresets'

export function safeDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
}

export type DatePickerPreset = {
  label: string
  match: () => { from: Date; to: Date }
}

export function getDatePickerPresets(
  today = safeDate(new Date())
): DatePickerPreset[] {
  const yesterday = {
    from: safeDate(subDays(today, 1)),
    to: safeDate(subDays(today, 1))
  }
  const last7Days = { from: safeDate(subDays(today, 6)), to: today }
  const last30Days = { from: safeDate(subDays(today, 29)), to: today }
  const monthToDate = { from: safeDate(startOfMonth(today)), to: today }
  const lastMonth = {
    from: safeDate(startOfMonth(subMonths(today, 1))),
    to: safeDate(endOfMonth(subMonths(today, 1)))
  }
  const yearToDate = { from: safeDate(startOfYear(today)), to: today }
  const lastYear = {
    from: safeDate(startOfYear(subYears(today, 1))),
    to: safeDate(endOfYear(subYears(today, 1)))
  }
  const wholeTime = {
    from: safeDate(getWholeTimeRange().from),
    to: today
  }

  return [
    { label: 'Today', match: () => ({ from: today, to: today }) },
    { label: 'Yesterday', match: () => yesterday },
    { label: 'Last 7 days', match: () => last7Days },
    { label: 'Last 30 days', match: () => last30Days },
    { label: 'Month to date', match: () => monthToDate },
    { label: 'Last month', match: () => lastMonth },
    { label: 'Year to date', match: () => yearToDate },
    { label: 'Last year', match: () => lastYear },
    { label: 'All time', match: () => wholeTime }
  ]
}

export function getWholeTimeDateRange(today = safeDate(new Date())) {
  return {
    from: safeDate(getWholeTimeRange().from),
    to: today
  }
}

export function rangesMatch(
  a: { from: Date; to: Date },
  b: { from: Date; to: Date }
) {
  return isSameDay(a.from, b.from) && isSameDay(a.to, b.to)
}

export function getDatePickerRangeLabel(
  from: Date,
  to: Date,
  today = safeDate(new Date())
): string | null {
  for (const preset of getDatePickerPresets(today)) {
    const range = preset.match()
    if (rangesMatch({ from, to }, range)) {
      return preset.label
    }
  }
  return null
}

export function formatDatePickerRange(from: Date, to: Date) {
  return `${format(from, 'LLL dd, y')} - ${format(to, 'LLL dd, y')}`
}
