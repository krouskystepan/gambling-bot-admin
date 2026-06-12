'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  type GlobalSettings,
  formatTransactionSourceLabel
} from 'gambling-bot-shared'

import type {
  SourcePnLRow,
  StaffTaxRow
} from '@/actions/database/report.action'
import {
  type MonthlyTaxPoint,
  type ReportTaxGranularity,
  formatReportPeriodLabel,
  getReportPeriodColumnLabel
} from '@/features/general/overview/period'
import { formatGuildMoneyExactSigned } from '@/lib/guildMoney'

type ReportMetrics = {
  gamePnL: number
  cashFlow: number
  betVolume: number
  winVolume: number
  depositVolume: number
  withdrawVolume: number
  txCount: number
}

function moneyColumn<T extends ReportMetrics>(
  accessorKey: keyof ReportMetrics,
  header: string,
  globalSettings: GlobalSettings
): ColumnDef<T> {
  return {
    accessorKey,
    header,
    size: 110,
    cell: ({ row }) =>
      formatGuildMoneyExactSigned(
        row.getValue(accessorKey as string) as number,
        globalSettings
      )
  }
}

function reportMetricColumns<T extends ReportMetrics>(
  globalSettings: GlobalSettings
): ColumnDef<T>[] {
  return [
    moneyColumn<T>('gamePnL', 'Game P&L', globalSettings),
    moneyColumn<T>('cashFlow', 'Cash flow', globalSettings),
    moneyColumn<T>('betVolume', 'Bet volume', globalSettings),
    moneyColumn<T>('winVolume', 'Win volume', globalSettings),
    moneyColumn<T>('depositVolume', 'Deposits', globalSettings),
    moneyColumn<T>('withdrawVolume', 'Withdrawals', globalSettings),
    {
      accessorKey: 'txCount',
      header: 'Transactions',
      size: 110,
      cell: ({ row }) => (row.getValue('txCount') as number).toLocaleString()
    }
  ]
}

export function guildTaxColumns(
  globalSettings: GlobalSettings,
  granularity: ReportTaxGranularity,
  timezone: string
): ColumnDef<MonthlyTaxPoint>[] {
  return [
    {
      accessorKey: 'period',
      header: getReportPeriodColumnLabel(granularity),
      size: granularity === 'hour' ? 180 : 120,
      cell: ({ row }) =>
        formatReportPeriodLabel(
          row.getValue('period') as string,
          granularity,
          timezone
        )
    },
    ...reportMetricColumns<MonthlyTaxPoint>(globalSettings)
  ]
}

export function staffTaxColumns(
  globalSettings: GlobalSettings,
  granularity: ReportTaxGranularity,
  timezone: string
): ColumnDef<StaffTaxRow>[] {
  return [
    {
      accessorKey: 'period',
      header: getReportPeriodColumnLabel(granularity),
      size: granularity === 'hour' ? 180 : 120,
      cell: ({ row }) =>
        formatReportPeriodLabel(
          row.getValue('period') as string,
          granularity,
          timezone
        )
    },
    {
      accessorKey: 'handlerUsername',
      header: 'Handler',
      enableSorting: false,
      size: 160,
      cell: ({ row }) => (
        <div>
          {row.original.handlerUsername}
          <br />
          <span className="text-xs text-muted-foreground">
            ({row.original.handlerId})
          </span>
        </div>
      )
    },
    ...reportMetricColumns<StaffTaxRow>(globalSettings)
  ]
}

export function sourcePnLColumns(
  globalSettings: GlobalSettings
): ColumnDef<SourcePnLRow>[] {
  return [
    {
      accessorKey: 'source',
      header: 'Source',
      size: 120,
      cell: ({ row }) =>
        formatTransactionSourceLabel(
          row.getValue('source') as SourcePnLRow['source']
        )
    },
    ...reportMetricColumns<SourcePnLRow>(globalSettings)
  ]
}
