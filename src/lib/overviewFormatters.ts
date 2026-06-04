import { formatNumberToReadableString } from 'gambling-bot-shared'
import type { GlobalSettings } from 'gambling-bot-shared'

import {
  formatGuildMoneyCompactSigned,
  formatGuildMoneyExactSigned
} from './guildMoney'

export const formatOverviewCurrency = (
  value: number,
  globalSettings?: Partial<GlobalSettings> | null
) => formatGuildMoneyExactSigned(value, globalSettings)

export const formatOverviewCount = (value: number) =>
  formatNumberToReadableString(value)

/** Compact labels for chart axes (avoids spaced thousands wrapping in narrow ticks). */
export const formatChartAxisCurrency = (
  value: number,
  globalSettings?: Partial<GlobalSettings> | null
) => formatGuildMoneyCompactSigned(value, globalSettings)
