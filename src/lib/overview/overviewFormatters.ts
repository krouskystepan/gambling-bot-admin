import {
  type GlobalSettings,
  getCurrencyPlacement,
  getCurrencySymbol
} from 'gambling-bot-shared'
import { formatNumberToReadableString } from 'gambling-bot-shared'

import {
  formatGuildMoneyCompactSigned,
  formatGuildMoneyExactSigned
} from '@/lib/guild/guildMoney'

function formatOneDecimalCompactAmount(amount: number): string {
  const abs = Math.abs(amount)

  if (abs >= 1_000_000) {
    const millions = Math.round((abs / 1_000_000) * 10) / 10
    return `${millions}M`
  }

  if (abs >= 1_000) {
    const thousands = Math.round((abs / 1_000) * 10) / 10
    return `${thousands}k`
  }

  return String(Math.round(abs))
}

function formatWholeCompactSigned(
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return formatGuildMoneyCompactSigned(0, globalSettings)

  const formatted = formatOneDecimalCompactAmount(rounded)
  const symbol = getCurrencySymbol(globalSettings)
  const sign = rounded < 0 ? '-' : ''

  if (getCurrencyPlacement(globalSettings) === 'suffix') {
    return `${sign}${formatted}${symbol}`
  }

  return `${sign}${symbol}${formatted}`
}

export const formatOverviewCurrency = (
  value: number,
  globalSettings?: Partial<GlobalSettings> | null
) => {
  if (Math.abs(value) >= 1_000_000) {
    return formatGuildMoneyCompactSigned(value, globalSettings)
  }

  return formatGuildMoneyExactSigned(value, globalSettings)
}

export const formatOverviewCount = (value: number) =>
  formatNumberToReadableString(value)

/** Compact axis labels with one decimal in k/M (e.g. $1.5M). */
export const formatChartAxisCurrency = (
  value: number,
  globalSettings?: Partial<GlobalSettings> | null
) => formatWholeCompactSigned(value, globalSettings)
