import {
  CASINO_GAME_IDS,
  TRANSACTION_SOURCES,
  TTransaction,
  formatCasinoGameLabel,
  formatTransactionSourceLabel
} from 'gambling-bot-shared'

import { gamePnLSum } from '@/lib/transactionTotals'

export type VolumeSlice = {
  key: string
  label: string
  amount: number
  netAmount: number
  color: string
  group: 'source' | 'casino'
}

const SOURCE_CHART_FILLS: Record<TTransaction['source'], string> = {
  casino: 'var(--chart-3)',
  command: 'var(--tag-sky)',
  manual: 'var(--tag-amber)',
  system: 'var(--tag-violet)',
  web: 'var(--tag-cyan)'
}

const CASINO_GAME_CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-4)',
  'var(--tag-cyan)',
  'var(--chart-5)',
  'var(--tag-emerald)',
  'var(--tag-violet)',
  'var(--chart-2)',
  'var(--tag-sky)',
  'var(--primary)',
  'var(--chart-4)',
  'var(--tag-cyan)'
] as const

const casinoGameChartFillMap = Object.fromEntries(
  CASINO_GAME_IDS.map((id, index) => [
    id,
    CASINO_GAME_CHART_COLORS[index % CASINO_GAME_CHART_COLORS.length]
  ])
)

const LEGACY_CASINO_FILL = 'var(--chart-3)'

const NON_CASINO_SOURCES = TRANSACTION_SOURCES.filter(
  (source) => source !== 'casino'
)

const nonCasinoSourceSet = new Set<string>(NON_CASINO_SOURCES)

export const volumeAmountGroupStage = {
  $group: {
    _id: {
      $cond: [
        { $eq: ['$source', 'casino'] },
        { $ifNull: ['$meta.game', 'casino'] },
        '$source'
      ]
    },
    amount: { $sum: { $abs: '$amount' } },
    netAmount: gamePnLSum
  }
}

function getVolumeSliceColor(key: string): string {
  if (key in SOURCE_CHART_FILLS) {
    return SOURCE_CHART_FILLS[key as TTransaction['source']]
  }
  if (key === 'casino') {
    return LEGACY_CASINO_FILL
  }
  return casinoGameChartFillMap[key] ?? 'var(--muted)'
}

function getVolumeSliceLabel(key: string): string {
  if (nonCasinoSourceSet.has(key)) {
    return formatTransactionSourceLabel(key)
  }
  if (key === 'casino') {
    return 'CASINO'
  }
  return formatCasinoGameLabel(key)
}

export function buildVolumeSlices(
  rows: { _id: string; amount: number; netAmount?: number }[]
): VolumeSlice[] {
  const rowMap = new Map(
    rows.map((row) => [
      row._id as string,
      { amount: row.amount, netAmount: row.netAmount ?? 0 }
    ])
  )

  const sourceSlices: VolumeSlice[] = NON_CASINO_SOURCES.map((key) => ({
    key,
    label: formatTransactionSourceLabel(key),
    amount: rowMap.get(key)?.amount ?? 0,
    netAmount: rowMap.get(key)?.netAmount ?? 0,
    color: SOURCE_CHART_FILLS[key],
    group: 'source' as const
  })).filter((slice) => slice.amount > 0)

  const gameSlices: VolumeSlice[] = rows
    .map((row) => row._id as string)
    .filter((key) => !nonCasinoSourceSet.has(key))
    .map((key) => ({
      key,
      label: getVolumeSliceLabel(key),
      amount: rowMap.get(key)?.amount ?? 0,
      netAmount: rowMap.get(key)?.netAmount ?? 0,
      color: getVolumeSliceColor(key),
      group: 'casino' as const
    }))
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return [...sourceSlices, ...gameSlices]
}

export function splitVolumeSlices(data: VolumeSlice[]) {
  const nonCasinoSources = data.filter((slice) => slice.group === 'source')
  const allCasinoSlices = data.filter((slice) => slice.group === 'casino')
  const casinoGameSlices = allCasinoSlices.filter(
    (slice) => slice.key !== 'casino'
  )

  const casinoAggregate = allCasinoSlices.reduce(
    (acc, slice) => ({
      amount: acc.amount + slice.amount,
      netAmount: acc.netAmount + slice.netAmount
    }),
    { amount: 0, netAmount: 0 }
  )

  const sourceOrder = new Map(
    TRANSACTION_SOURCES.map((source, index) => [source, index])
  )

  const sourceSlices: VolumeSlice[] = [...nonCasinoSources]
  if (casinoAggregate.amount > 0) {
    sourceSlices.push({
      key: 'casino',
      label: formatTransactionSourceLabel('casino'),
      amount: casinoAggregate.amount,
      netAmount: casinoAggregate.netAmount,
      color: SOURCE_CHART_FILLS.casino,
      group: 'source'
    })
  }

  sourceSlices.sort(
    (a, b) =>
      (sourceOrder.get(a.key as TTransaction['source']) ?? 99) -
      (sourceOrder.get(b.key as TTransaction['source']) ?? 99)
  )

  return {
    sourceSlices,
    casinoSlices: casinoGameSlices
  }
}

export { SOURCE_CHART_FILLS, casinoGameChartFillMap }
