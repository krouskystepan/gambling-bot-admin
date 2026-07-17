import { resolveGuildTimezone } from 'gambling-bot-shared/guild'
import {
  TRANSACTION_SOURCES,
  type TTransaction
} from 'gambling-bot-shared/transactions'
import { DateTime } from 'luxon'

import type {
  SourcePnLRow,
  StaffTaxRow
} from '@/actions/database/report.action'
import {
  type MonthlyTaxPoint,
  type OverviewDateRange,
  fillTaxPeriodSeries,
  resolveReportTaxGranularity
} from '@/features/general/overview/period'

import { DEMO_TIMEZONE, getDemoUsername } from './demoGuild'
import { type DemoRawTx, getDemoRawTransactions } from './demoTransactions'

const zone = resolveGuildTimezone(DEMO_TIMEZONE)

function emptyMetrics(): Omit<MonthlyTaxPoint, 'period'> {
  return {
    gamePnL: 0,
    cashFlow: 0,
    betVolume: 0,
    winVolume: 0,
    depositVolume: 0,
    withdrawVolume: 0,
    txCount: 0
  }
}

function addMetrics(target: Omit<MonthlyTaxPoint, 'period'>, row: DemoRawTx) {
  if (row.type === 'bet' || row.type === 'vip') target.gamePnL += row.amount
  if (row.type === 'win' || row.type === 'bonus' || row.type === 'refund') {
    target.gamePnL -= row.amount
  }
  if (row.type === 'deposit') {
    target.cashFlow += row.amount
    target.depositVolume += row.amount
  }
  if (row.type === 'withdraw') {
    target.cashFlow -= row.amount
    target.withdrawVolume += row.amount
  }
  if (row.type === 'bet') target.betVolume += row.amount
  if (row.type === 'win') target.winVolume += row.amount
  target.txCount += 1
}

function inRange(row: DemoRawTx, range: OverviewDateRange): boolean {
  const from = new Date(`${range.dateFrom}T00:00:00`)
  const to = new Date(`${range.dateTo}T23:59:59.999`)
  return row.createdAt >= from && row.createdAt <= to
}

function periodKey(date: Date, granularity: 'hour' | 'day' | 'month'): string {
  const dt = DateTime.fromJSDate(date, { zone })
  if (granularity === 'hour') return dt.toFormat("yyyy-MM-dd'T'HH:00")
  if (granularity === 'month') return dt.toFormat('yyyy-MM')
  return dt.toFormat('yyyy-MM-dd')
}

function rangeRows(range: OverviewDateRange): DemoRawTx[] {
  return getDemoRawTransactions().filter((row) => inRange(row, range))
}

export function getDemoPnLBySource(range: OverviewDateRange): SourcePnLRow[] {
  const rows = rangeRows(range)
  const bySource = new Map<
    TTransaction['source'],
    Omit<MonthlyTaxPoint, 'period'>
  >()

  for (const row of rows) {
    const entry = bySource.get(row.source) ?? emptyMetrics()
    addMetrics(entry, row)
    bySource.set(row.source, entry)
  }

  return TRANSACTION_SOURCES.map((source) => ({
    source,
    ...(bySource.get(source) ?? emptyMetrics())
  }))
}

export function getDemoGuildTaxPeriodSummary(
  range: OverviewDateRange
): MonthlyTaxPoint[] {
  const granularity = resolveReportTaxGranularity(range, DEMO_TIMEZONE)
  const rows = rangeRows(range)
  const byPeriod = new Map<string, MonthlyTaxPoint>()

  for (const row of rows) {
    const period = periodKey(row.createdAt, granularity)
    const entry = byPeriod.get(period) ?? { period, ...emptyMetrics() }
    addMetrics(entry, row)
    byPeriod.set(period, entry)
  }

  return fillTaxPeriodSeries(
    range,
    Array.from(byPeriod.values()),
    granularity,
    DEMO_TIMEZONE
  )
}

export function getDemoStaffTaxPeriodSummary(
  range: OverviewDateRange
): StaffTaxRow[] {
  const granularity = resolveReportTaxGranularity(range, DEMO_TIMEZONE)
  const rows = rangeRows(range).filter((row) => row.handledBy)

  const byHandler = new Map<string, Map<string, MonthlyTaxPoint>>()
  for (const row of rows) {
    const handlerId = row.handledBy!
    const period = periodKey(row.createdAt, granularity)
    const periods = byHandler.get(handlerId) ?? new Map()
    const entry = periods.get(period) ?? { period, ...emptyMetrics() }
    addMetrics(entry, row)
    periods.set(period, entry)
    byHandler.set(handlerId, periods)
  }

  const result: StaffTaxRow[] = []
  for (const [handlerId, periods] of byHandler) {
    const filled = fillTaxPeriodSeries(
      range,
      Array.from(periods.values()),
      granularity,
      DEMO_TIMEZONE
    )
    for (const point of filled) {
      result.push({
        ...point,
        handlerId,
        handlerUsername: getDemoUsername(handlerId)
      })
    }
  }

  return result.sort(
    (a, b) =>
      a.period.localeCompare(b.period) ||
      a.handlerUsername.localeCompare(b.handlerUsername)
  )
}
