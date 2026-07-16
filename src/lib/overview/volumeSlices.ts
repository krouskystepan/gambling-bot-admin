import { CASINO_GAME_IDS, type CasinoGameId } from 'gambling-bot-shared/casino'
import {
  formatCasinoGameLabel,
  formatTransactionSourceLabel
} from 'gambling-bot-shared/common'
import {
  TRANSACTION_SOURCES,
  TTransaction
} from 'gambling-bot-shared/transactions'

import { gamePnLSum } from '@/lib/overview/transactionTotals'

export type VolumeSlice = {
  key: string
  label: string
  amount: number
  netAmount: number
  color: string
  group: 'source' | 'casino'
}

export type PieRenderSlice = VolumeSlice & {
  pieAmount: number
  groupedSlices?: VolumeSlice[]
}

/** Slices below this share of total volume are merged into the pie "Others" bucket. */
export const PIE_MIN_SLICE_SHARE = 0.03

/** Minimum arc size for the Others bucket so it stays visible in the donut. */
export const PIE_MIN_OTHERS_DISPLAY_SHARE = 0.02

export const PIE_OTHERS_SLICE_KEY = 'pie-others'

const OTHERS_SLICE_COLOR = 'var(--muted-foreground)'

type NonCasinoSource = Exclude<TTransaction['source'], 'casino'>

/** Distinct hues for the non-casino source pie (command, manual, system, web). */
const NON_CASINO_SOURCE_PIE_FILLS: Record<NonCasinoSource, string> = {
  command: 'var(--chart-1)',
  manual: 'var(--destructive)',
  system: 'var(--tag-emerald)',
  web: 'var(--tag-cyan)'
}

const CASINO_SOURCE_LEGEND_FILL = 'var(--chart-3)'

/** Fixed hue per game so legend and pie always match and never collide. */
const CASINO_GAME_CHART_FILLS = {
  dice: 'var(--chart-1)',
  coinflip: 'var(--destructive)',
  slots: 'var(--tag-emerald)',
  lottery: 'var(--tag-amber)',
  roulette: 'oklch(0.62 0.22 340)',
  rps: 'var(--tag-cyan)',
  goldenJackpot: 'var(--brand)',
  blackjack: 'var(--tag-sky)',
  prediction: 'var(--chart-2)',
  raffle: 'var(--tag-violet)',
  plinko: 'var(--primary)'
} satisfies Record<CasinoGameId, string>

const casinoGameChartFillMap: Record<string, string> = CASINO_GAME_CHART_FILLS

const NON_CASINO_SOURCES = TRANSACTION_SOURCES.filter(
  (source) => source !== 'casino'
)

const nonCasinoSourceSet = new Set<string>(NON_CASINO_SOURCES)

export const SOURCE_CHART_FILLS: Record<TTransaction['source'], string> = {
  casino: CASINO_SOURCE_LEGEND_FILL,
  ...NON_CASINO_SOURCE_PIE_FILLS
}

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
  return casinoGameChartFillMap[key] ?? 'var(--muted)'
}

function getVolumeSliceLabel(key: string): string {
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
    color: NON_CASINO_SOURCE_PIE_FILLS[key],
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

const RING_ARC_DEGREES = 360

export type PieRingVisualProps = {
  paddingAngle: number
  cornerRadius: number
}

export type CasinoRingVisualProps = PieRingVisualProps

function getPieRingVisualProps(
  slices: Array<VolumeSlice | PieRenderSlice>,
  totalVolume: number,
  arcDegrees: number = RING_ARC_DEGREES,
  options?: { singleSliceCornerRadius?: number }
): PieRingVisualProps {
  const activeSlices = slices.filter((slice) => getSlicePieAmount(slice) > 0)
  const count = activeSlices.length

  if (count === 0 || totalVolume <= 0) {
    return { paddingAngle: 0, cornerRadius: 0 }
  }

  if (count === 1) {
    return {
      paddingAngle: 0,
      cornerRadius: options?.singleSliceCornerRadius ?? 4
    }
  }

  const pieTotal = activeSlices.reduce(
    (sum, slice) => sum + getSlicePieAmount(slice),
    0
  )
  const minShare = Math.min(
    ...activeSlices.map((slice) => getSlicePieAmount(slice) / pieTotal)
  )
  const minSliceDegrees = minShare * arcDegrees

  if (minSliceDegrees < 5) {
    return { paddingAngle: 0.5, cornerRadius: 3 }
  }

  if (minSliceDegrees < 10) {
    return { paddingAngle: 1, cornerRadius: 5 }
  }

  return { paddingAngle: 2, cornerRadius: 6 }
}

export function getSourceRingVisualProps(
  slices: Array<VolumeSlice | PieRenderSlice>,
  totalVolume: number
): PieRingVisualProps {
  return getPieRingVisualProps(slices, totalVolume)
}

export function getCasinoRingVisualProps(
  slices: Array<VolumeSlice | PieRenderSlice>,
  totalVolume: number
): PieRingVisualProps {
  return getPieRingVisualProps(slices, totalVolume, RING_ARC_DEGREES, {
    singleSliceCornerRadius: 6
  })
}

function getSlicePieAmount(slice: VolumeSlice | PieRenderSlice): number {
  return 'pieAmount' in slice ? slice.pieAmount : slice.amount
}

export function buildPieRenderSlices(
  slices: VolumeSlice[],
  options?: {
    minShare?: number
    minOthersDisplayShare?: number
    othersLabel?: string
  }
): PieRenderSlice[] {
  const minShare = options?.minShare ?? PIE_MIN_SLICE_SHARE
  const minOthersDisplayShare =
    options?.minOthersDisplayShare ?? PIE_MIN_OTHERS_DISPLAY_SHARE
  const othersLabel = options?.othersLabel ?? 'Others'

  const active = slices
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const total = active.reduce((sum, slice) => sum + slice.amount, 0)
  if (total <= 0) return []

  const main: VolumeSlice[] = []
  const grouped: VolumeSlice[] = []

  for (const slice of active) {
    if (slice.amount / total >= minShare) {
      main.push(slice)
    } else {
      grouped.push(slice)
    }
  }

  if (main.length === 0 && grouped.length > 0) {
    main.push(grouped[0]!)
    grouped.shift()
  }

  const result: PieRenderSlice[] = main.map((slice) => ({
    ...slice,
    pieAmount: slice.amount
  }))

  if (grouped.length > 0) {
    const othersAmount = grouped.reduce((sum, slice) => sum + slice.amount, 0)
    const othersNet = grouped.reduce((sum, slice) => sum + slice.netAmount, 0)

    result.push({
      key: PIE_OTHERS_SLICE_KEY,
      label: othersLabel,
      amount: othersAmount,
      netAmount: othersNet,
      color: OTHERS_SLICE_COLOR,
      group: grouped[0]?.group ?? 'casino',
      pieAmount: othersAmount,
      groupedSlices: grouped
    })
  }

  const othersSlice = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)
  if (othersSlice) {
    const minPieAmount = total * minOthersDisplayShare
    if (othersSlice.pieAmount < minPieAmount) {
      const deficit = minPieAmount - othersSlice.pieAmount
      const largest = result
        .filter((slice) => slice.key !== PIE_OTHERS_SLICE_KEY)
        .sort((a, b) => b.pieAmount - a.pieAmount)[0]

      if (largest && largest.pieAmount > deficit) {
        othersSlice.pieAmount = minPieAmount
        largest.pieAmount -= deficit
      }
    }
  }

  return result.sort((a, b) => b.pieAmount - a.pieAmount)
}

function getCatalogSlicesFoldedIntoOthers(
  catalogSlices: VolumeSlice[],
  pieRenderSlices: PieRenderSlice[]
): VolumeSlice[] {
  const pieKeys = new Set(
    pieRenderSlices
      .filter((slice) => slice.key !== PIE_OTHERS_SLICE_KEY)
      .map((slice) => slice.key)
  )

  return catalogSlices
    .filter((slice) => !pieKeys.has(slice.key))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label))
}

function enrichPieOthersFromCatalog(
  catalogSlices: VolumeSlice[],
  pieRenderSlices: PieRenderSlice[]
): PieRenderSlice[] {
  const foldedIntoOthers = getCatalogSlicesFoldedIntoOthers(
    catalogSlices,
    pieRenderSlices
  )
  if (foldedIntoOthers.length === 0) return pieRenderSlices

  const othersInPie = pieRenderSlices.find(
    (slice) => slice.key === PIE_OTHERS_SLICE_KEY
  )
  if (!othersInPie) return pieRenderSlices

  return pieRenderSlices.map((slice) =>
    slice.key === PIE_OTHERS_SLICE_KEY
      ? { ...slice, groupedSlices: foldedIntoOthers }
      : slice
  )
}

function buildPieLegendFromCatalog(
  catalogSlices: VolumeSlice[],
  pieRenderSlices: PieRenderSlice[]
): PieRenderSlice[] {
  const othersInPie = pieRenderSlices.find(
    (slice) => slice.key === PIE_OTHERS_SLICE_KEY
  )

  const foldedIntoOthers = getCatalogSlicesFoldedIntoOthers(
    catalogSlices,
    pieRenderSlices
  )

  const legendSlices: PieRenderSlice[] = pieRenderSlices
    .filter((slice) => slice.key !== PIE_OTHERS_SLICE_KEY)
    .map((slice) => ({ ...slice }))

  if (foldedIntoOthers.length === 0) {
    return legendSlices
  }

  if (othersInPie) {
    legendSlices.push({
      ...othersInPie,
      groupedSlices: foldedIntoOthers
    })
  } else {
    const othersAmount = foldedIntoOthers.reduce(
      (sum, slice) => sum + slice.amount,
      0
    )
    const othersNet = foldedIntoOthers.reduce(
      (sum, slice) => sum + slice.netAmount,
      0
    )

    legendSlices.push({
      key: PIE_OTHERS_SLICE_KEY,
      label: 'Others',
      amount: othersAmount,
      netAmount: othersNet,
      color: OTHERS_SLICE_COLOR,
      group: foldedIntoOthers[0]?.group ?? 'casino',
      pieAmount: othersAmount,
      groupedSlices: foldedIntoOthers
    })
  }

  return legendSlices
}

export function enrichPieOthersGroupedSlices(
  casinoSlices: VolumeSlice[],
  pieRenderSlices: PieRenderSlice[]
): PieRenderSlice[] {
  return enrichPieOthersFromCatalog(
    buildCasinoGameLegendSlices(casinoSlices),
    pieRenderSlices
  )
}

export function enrichSourcePieOthersGroupedSlices(
  sourceSlices: VolumeSlice[],
  pieRenderSlices: PieRenderSlice[]
): PieRenderSlice[] {
  return enrichPieOthersFromCatalog(
    getNonCasinoSourceSlices(sourceSlices),
    pieRenderSlices
  )
}

export function buildCasinoPieLegendSlices(
  casinoSlices: VolumeSlice[],
  pieRenderSlices: PieRenderSlice[]
): PieRenderSlice[] {
  return buildPieLegendFromCatalog(
    buildCasinoGameLegendSlices(casinoSlices),
    pieRenderSlices
  ).sort((a, b) => b.amount - a.amount)
}

export function buildSourcePieLegendSlices(
  pieRenderSlices: PieRenderSlice[],
  casinoSlice?: VolumeSlice
): PieRenderSlice[] {
  const pieLegend = pieRenderSlices.map((slice) => ({ ...slice }))

  if (!casinoSlice) {
    return pieLegend.sort((a, b) => b.amount - a.amount)
  }

  return [{ ...casinoSlice, pieAmount: casinoSlice.amount }, ...pieLegend].sort(
    (a, b) => b.amount - a.amount
  )
}

export function getNonCasinoSourceSlices(
  sourceSlices: VolumeSlice[]
): VolumeSlice[] {
  return sourceSlices.filter(
    (slice) => slice.key !== 'casino' && slice.amount > 0
  )
}

export function getCasinoSourceSlice(
  sourceSlices: VolumeSlice[]
): VolumeSlice | undefined {
  return sourceSlices.find(
    (slice) => slice.key === 'casino' && slice.amount > 0
  )
}

export function sumVolumeSliceAmounts(slices: VolumeSlice[]): number {
  return slices.reduce((sum, slice) => sum + slice.amount, 0)
}

export function buildCasinoGameLegendSlices(
  activeSlices: VolumeSlice[]
): VolumeSlice[] {
  const sliceByKey = new Map(activeSlices.map((slice) => [slice.key, slice]))

  return CASINO_GAME_IDS.map((id) => {
    const existing = sliceByKey.get(id)
    if (existing) return existing

    return {
      key: id,
      label: formatCasinoGameLabel(id),
      amount: 0,
      netAmount: 0,
      color: CASINO_GAME_CHART_FILLS[id],
      group: 'casino' as const
    }
  }).sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label))
}

export function getSourcePieSlices(sourceSlices: VolumeSlice[]): VolumeSlice[] {
  return getNonCasinoSourceSlices(sourceSlices)
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
      color: CASINO_SOURCE_LEGEND_FILL,
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

export { casinoGameChartFillMap, CASINO_GAME_CHART_FILLS }
