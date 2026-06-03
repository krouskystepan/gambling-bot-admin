import {
  formatNumberToReadableString,
  formatNumberWithSpaces
} from 'gambling-bot-shared'

export const formatOverviewCurrency = (value: number) => {
  const rounded = Math.round(value)
  const base = formatNumberWithSpaces(Math.abs(rounded))
  return rounded < 0 ? `-$${base}` : `$${base}`
}

export const formatOverviewCount = (value: number) =>
  formatNumberToReadableString(value)

/** Compact labels for chart axes (avoids spaced thousands wrapping in narrow ticks). */
export const formatChartAxisCurrency = (value: number) => {
  const rounded = Math.round(value)
  if (rounded === 0) return '$0'
  const compact = formatNumberToReadableString(Math.abs(rounded))
  return rounded < 0 ? `-$${compact}` : `$${compact}`
}
