import { formatMoney, formatMoneyExact } from 'gambling-bot-shared/common'
import { type GlobalSettings } from 'gambling-bot-shared/guild'

export function formatGuildMoney(
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string {
  return formatMoney(amount, globalSettings)
}

export function formatGuildMoneyExact(
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string {
  return formatMoneyExact(amount, globalSettings)
}

/** Full-precision KPI / table amounts with correct sign placement. */
export function formatGuildMoneyExactSigned(
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string {
  const rounded = Math.round(amount)
  if (rounded < 0) {
    return `-${formatMoneyExact(Math.abs(rounded), globalSettings)}`
  }
  return formatMoneyExact(rounded, globalSettings)
}

/** Compact chart axis labels with correct sign placement. */
export function formatGuildMoneyCompactSigned(
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return formatMoney(0, globalSettings)
  if (rounded < 0) return `-${formatMoney(Math.abs(rounded), globalSettings)}`
  return formatMoney(rounded, globalSettings)
}
