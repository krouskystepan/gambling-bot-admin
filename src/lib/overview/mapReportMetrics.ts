import type { MonthlyTaxPoint } from '@/features/general/overview/period'

export function mapReportMetrics(row: {
  gamePnL?: number
  cashFlow?: number
  betVolume?: number
  winVolume?: number
  depositVolume?: number
  withdrawVolume?: number
  txCount?: number
}): Omit<MonthlyTaxPoint, 'period'> {
  return {
    gamePnL: row.gamePnL ?? 0,
    cashFlow: row.cashFlow ?? 0,
    betVolume: row.betVolume ?? 0,
    winVolume: row.winVolume ?? 0,
    depositVolume: row.depositVolume ?? 0,
    withdrawVolume: row.withdrawVolume ?? 0,
    txCount: row.txCount ?? 0
  }
}
