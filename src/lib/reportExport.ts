import type {
  SourcePnLRow,
  StaffTaxRow
} from '@/actions/database/report.action'
import type { MonthlyTaxPoint } from '@/features/general/overview/period'
import { toCsv } from '@/lib/csv'

const REPORT_METRIC_HEADERS = [
  'gamePnL',
  'cashFlow',
  'betVolume',
  'winVolume',
  'depositVolume',
  'withdrawVolume',
  'txCount'
] as const

function metricRow(
  metrics: Omit<MonthlyTaxPoint, 'period'>
): (string | number)[] {
  return [
    metrics.gamePnL,
    metrics.cashFlow,
    metrics.betVolume,
    metrics.winVolume,
    metrics.depositVolume,
    metrics.withdrawVolume,
    metrics.txCount
  ]
}

export function pnlBySourceToCsv(rows: SourcePnLRow[]): string {
  return toCsv(
    ['source', ...REPORT_METRIC_HEADERS],
    [...rows.map((row) => [row.source, ...metricRow(row)])]
  )
}

export function guildTaxSummaryToCsv(rows: MonthlyTaxPoint[]): string {
  return toCsv(
    ['period', ...REPORT_METRIC_HEADERS],
    [...rows.map((row) => [row.period, ...metricRow(row)])]
  )
}

export function staffTaxSummaryToCsv(rows: StaffTaxRow[]): string {
  return toCsv(
    ['period', 'handlerId', 'handlerUsername', ...REPORT_METRIC_HEADERS],
    [
      ...rows.map((row) => [
        row.period,
        row.handlerId,
        row.handlerUsername,
        ...metricRow(row)
      ])
    ]
  )
}
