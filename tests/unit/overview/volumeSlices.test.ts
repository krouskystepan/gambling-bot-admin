import { describe, expect, it, vi } from 'vitest'

import {
  PIE_OTHERS_SLICE_KEY,
  type PieRenderSlice,
  type VolumeSlice,
  buildCasinoGameLegendSlices,
  buildCasinoPieLegendSlices,
  buildPieRenderSlices,
  buildSourcePieLegendSlices,
  buildVolumeSlices,
  enrichPieOthersGroupedSlices,
  enrichSourcePieOthersGroupedSlices,
  getCasinoRingVisualProps,
  getCasinoSourceSlice,
  getNonCasinoSourceSlices,
  getSourcePieSlices,
  getSourceRingVisualProps,
  splitVolumeSlices,
  sumVolumeSliceAmounts
} from '@/lib/overview/volumeSlices'

function makeSlice(
  overrides: Partial<VolumeSlice> & Pick<VolumeSlice, 'key' | 'amount'>
): VolumeSlice {
  return {
    label: overrides.key,
    netAmount: 0,
    color: 'var(--chart-1)',
    group: 'casino',
    ...overrides
  }
}

describe('volumeSlices', () => {
  it('buildVolumeSlices keeps positive non-casino sources and sorts games', () => {
    const slices = buildVolumeSlices([
      { _id: 'web', amount: 40, netAmount: 10 },
      { _id: 'command', amount: 0, netAmount: 0 },
      { _id: 'dice', amount: 100, netAmount: -20 },
      { _id: 'slots', amount: 50, netAmount: 5 }
    ])

    expect(slices.map((slice) => slice.key)).toEqual(['web', 'dice', 'slots'])
    expect(slices[0]).toMatchObject({
      key: 'web',
      group: 'source',
      amount: 40,
      netAmount: 10
    })
    expect(slices[1]).toMatchObject({
      key: 'dice',
      group: 'casino',
      amount: 100
    })
  })

  it('buildVolumeSlices handles legacy casino key, unknown games, and missing netAmount', () => {
    const slices = buildVolumeSlices([
      { _id: 'casino', amount: 25 },
      { _id: 'unknownGame', amount: 15, netAmount: 1 },
      { _id: 'web', amount: 10, netAmount: 3 },
      { _id: 'dice', amount: undefined as unknown as number, netAmount: 4 }
    ])

    expect(slices.find((slice) => slice.key === 'casino')).toMatchObject({
      label: 'CASINO',
      amount: 25,
      netAmount: 0,
      group: 'casino'
    })
    expect(slices.find((slice) => slice.key === 'unknownGame')).toMatchObject({
      color: 'var(--muted)',
      netAmount: 1
    })
    expect(slices.find((slice) => slice.key === 'dice')).toBeUndefined()
  })

  it('buildVolumeSlices treats missing mapped net amounts as zero for games', () => {
    const originalGet = Map.prototype.get
    const getSpy = vi.spyOn(Map.prototype, 'get').mockImplementation(function (
      this: Map<string, { amount: number; netAmount?: number }>,
      key
    ) {
      const value = originalGet.call(this, key)
      if (value && key === 'dice') {
        return { amount: value.amount }
      }
      return value
    })

    try {
      const slices = buildVolumeSlices([
        { _id: 'dice', amount: 10, netAmount: 3 }
      ])
      expect(slices.find((slice) => slice.key === 'dice')).toMatchObject({
        amount: 10,
        netAmount: 0
      })
    } finally {
      getSpy.mockRestore()
    }
  })

  it('splitVolumeSlices aggregates casino games under source casino', () => {
    const { sourceSlices, casinoSlices } = splitVolumeSlices([
      {
        key: 'web',
        label: 'WEB',
        amount: 20,
        netAmount: 5,
        color: 'x',
        group: 'source'
      },
      {
        key: 'dice',
        label: 'DICE',
        amount: 30,
        netAmount: -10,
        color: 'y',
        group: 'casino'
      },
      {
        key: 'slots',
        label: 'SLOTS',
        amount: 10,
        netAmount: 2,
        color: 'z',
        group: 'casino'
      }
    ])

    expect(casinoSlices.map((slice) => slice.key)).toEqual(['dice', 'slots'])
    expect(sourceSlices.find((slice) => slice.key === 'casino')).toMatchObject({
      amount: 40,
      netAmount: -8,
      group: 'source'
    })
  })

  it('splitVolumeSlices omits casino source when no casino volume', () => {
    const { sourceSlices } = splitVolumeSlices([
      makeSlice({ key: 'web', amount: 10, group: 'source' })
    ])

    expect(sourceSlices.some((slice) => slice.key === 'casino')).toBe(false)
  })

  it('splitVolumeSlices sorts unknown source keys after known sources', () => {
    const { sourceSlices } = splitVolumeSlices([
      makeSlice({ key: 'unknown-source', amount: 10, group: 'source' }),
      makeSlice({ key: 'web', amount: 20, group: 'source' })
    ])

    expect(sourceSlices.map((slice) => slice.key)).toEqual([
      'web',
      'unknown-source'
    ])
  })

  it('splitVolumeSlices keeps unknown source keys in the source list', () => {
    const { sourceSlices } = splitVolumeSlices([
      makeSlice({ key: 'zzz', amount: 5, group: 'source' }),
      makeSlice({ key: 'aaa', amount: 10, group: 'source' })
    ])

    expect(sourceSlices.map((slice) => slice.key).sort()).toEqual([
      'aaa',
      'zzz'
    ])
  })
})

describe('getSourceRingVisualProps', () => {
  it('returns zero padding when there are no active slices or volume', () => {
    expect(getSourceRingVisualProps([], 100)).toEqual({
      paddingAngle: 0,
      cornerRadius: 0
    })
    expect(
      getSourceRingVisualProps([makeSlice({ key: 'a', amount: 0 })], 100)
    ).toEqual({ paddingAngle: 0, cornerRadius: 0 })
    expect(
      getSourceRingVisualProps([makeSlice({ key: 'a', amount: 10 })], 0)
    ).toEqual({ paddingAngle: 0, cornerRadius: 0 })
  })

  it('returns single-slice styling', () => {
    expect(
      getSourceRingVisualProps([makeSlice({ key: 'a', amount: 100 })], 100)
    ).toEqual({ paddingAngle: 0, cornerRadius: 4 })
  })

  it('returns small-slice styling when the smallest arc is under 5 degrees', () => {
    const slices = [
      makeSlice({ key: 'large', amount: 990 }),
      makeSlice({ key: 'tiny', amount: 10 })
    ]

    expect(getSourceRingVisualProps(slices, 1000)).toEqual({
      paddingAngle: 0.5,
      cornerRadius: 3
    })
  })

  it('returns medium-slice styling when the smallest arc is under 10 degrees', () => {
    const slices = [
      makeSlice({ key: 'large', amount: 975 }),
      makeSlice({ key: 'small', amount: 25 })
    ]

    expect(getSourceRingVisualProps(slices, 1000)).toEqual({
      paddingAngle: 1,
      cornerRadius: 5
    })
  })

  it('returns large-slice styling when the smallest arc is at least 10 degrees', () => {
    const slices = [
      makeSlice({ key: 'a', amount: 700 }),
      makeSlice({ key: 'b', amount: 300 })
    ]

    expect(getSourceRingVisualProps(slices, 1000)).toEqual({
      paddingAngle: 2,
      cornerRadius: 6
    })
  })

  it('uses pieAmount when present on slices', () => {
    const slices: PieRenderSlice[] = [
      { ...makeSlice({ key: 'a', amount: 100 }), pieAmount: 990 },
      { ...makeSlice({ key: 'b', amount: 100 }), pieAmount: 10 }
    ]

    expect(getSourceRingVisualProps(slices, 1000)).toEqual({
      paddingAngle: 0.5,
      cornerRadius: 3
    })
  })
})

describe('getCasinoRingVisualProps', () => {
  it('returns zero padding when there are no active slices', () => {
    expect(getCasinoRingVisualProps([], 50)).toEqual({
      paddingAngle: 0,
      cornerRadius: 0
    })
  })

  it('uses the casino single-slice corner radius', () => {
    expect(
      getCasinoRingVisualProps([makeSlice({ key: 'dice', amount: 50 })], 50)
    ).toEqual({ paddingAngle: 0, cornerRadius: 6 })
  })

  it('returns medium styling for many casino slices', () => {
    const slices = [
      makeSlice({ key: 'dice', amount: 975 }),
      makeSlice({ key: 'slots', amount: 25 })
    ]

    expect(getCasinoRingVisualProps(slices, 1000)).toEqual({
      paddingAngle: 1,
      cornerRadius: 5
    })
  })
})

describe('buildPieRenderSlices', () => {
  it('returns empty when total volume is zero', () => {
    expect(buildPieRenderSlices([])).toEqual([])
    expect(buildPieRenderSlices([makeSlice({ key: 'a', amount: 0 })])).toEqual(
      []
    )
  })

  it('keeps large slices without an others bucket', () => {
    const slices = [
      makeSlice({ key: 'a', amount: 70, group: 'source' }),
      makeSlice({ key: 'b', amount: 30, group: 'source' })
    ]

    const result = buildPieRenderSlices(slices)

    expect(result).toHaveLength(2)
    expect(result.every((slice) => slice.key !== PIE_OTHERS_SLICE_KEY)).toBe(
      true
    )
  })

  it('promotes the largest small slice when every slice is below min share', () => {
    const slices = [
      makeSlice({ key: 'a', amount: 20 }),
      makeSlice({ key: 'b', amount: 15 }),
      makeSlice({ key: 'c', amount: 10 })
    ]

    const result = buildPieRenderSlices(slices, { minShare: 0.5 })
    const others = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)

    expect(result.some((slice) => slice.key === 'a')).toBe(true)
    expect(others?.groupedSlices?.map((slice) => slice.key)).toEqual(['b', 'c'])
  })

  it('applies minOthersDisplayShare deficit from the largest slice', () => {
    const slices = [
      makeSlice({ key: 'main', amount: 990 }),
      makeSlice({ key: 'tiny-a', amount: 5 }),
      makeSlice({ key: 'tiny-b', amount: 5 })
    ]

    const result = buildPieRenderSlices(slices, { minOthersDisplayShare: 0.02 })
    const others = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)!
    const main = result.find((slice) => slice.key === 'main')!

    expect(others.pieAmount).toBe(20)
    expect(main.pieAmount).toBe(980)
    expect(others.amount).toBe(10)
  })

  it('picks the largest main slice when borrowing for others visibility', () => {
    const slices = [
      makeSlice({ key: 'main-a', amount: 400 }),
      makeSlice({ key: 'main-b', amount: 590 }),
      makeSlice({ key: 'tiny', amount: 10 })
    ]

    const result = buildPieRenderSlices(slices, { minOthersDisplayShare: 0.02 })
    const others = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)!
    const largestMain = result.find((slice) => slice.key === 'main-b')!

    expect(others.pieAmount).toBe(20)
    expect(largestMain.pieAmount).toBe(580)
  })

  it('skips deficit adjustment when the largest slice cannot spare enough', () => {
    const slices = [
      makeSlice({ key: 'main', amount: 5, group: 'source' }),
      makeSlice({ key: 'other', amount: 5, group: 'source' })
    ]

    const result = buildPieRenderSlices(slices, {
      minShare: 0.6,
      minOthersDisplayShare: 1
    })
    const others = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)!

    expect(others.pieAmount).toBe(5)
  })

  it('respects custom share, display share, and label options', () => {
    const slices = [
      makeSlice({ key: 'big', amount: 90 }),
      makeSlice({ key: 'sm', amount: 10 })
    ]

    const result = buildPieRenderSlices(slices, {
      minShare: 0.5,
      minOthersDisplayShare: 0.01,
      othersLabel: 'Rest'
    })

    expect(
      result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)?.label
    ).toBe('Rest')
  })

  it('uses the grouped slice group for the others bucket', () => {
    const slices = [
      makeSlice({ key: 'web', amount: 1, group: 'source' }),
      makeSlice({ key: 'manual', amount: 1, group: 'source' })
    ]

    const result = buildPieRenderSlices(slices, { minShare: 0.6 })
    const others = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)

    expect(others?.group).toBe('source')
  })

  it('defaults others group to casino when grouped slices omit it', () => {
    const slices = [
      { key: 'a', label: 'a', amount: 1, netAmount: 0, color: 'c' },
      { key: 'b', label: 'b', amount: 1, netAmount: 0, color: 'c' }
    ] as VolumeSlice[]

    const result = buildPieRenderSlices(slices, { minShare: 0.6 })
    const others = result.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)

    expect(others?.group).toBe('casino')
  })
})

describe('enrichPieOthersGroupedSlices', () => {
  it('returns pie slices unchanged when nothing folds into others', () => {
    const pie = buildPieRenderSlices([makeSlice({ key: 'dice', amount: 100 })])

    expect(enrichPieOthersGroupedSlices([], pie)).toEqual(pie)
  })

  it('returns pie slices unchanged when pie has no others slice', () => {
    const casinoSlices = [makeSlice({ key: 'dice', amount: 100 })]
    const pie = buildPieRenderSlices(casinoSlices)

    expect(enrichPieOthersGroupedSlices(casinoSlices, pie)).toEqual(pie)
  })

  it('enriches others groupedSlices from the casino catalog', () => {
    const casinoSlices = [
      makeSlice({ key: 'dice', amount: 100 }),
      makeSlice({ key: 'slots', amount: 5 }),
      makeSlice({ key: 'coinflip', amount: 3 })
    ]
    const pie = buildPieRenderSlices(casinoSlices)
    const enriched = enrichPieOthersGroupedSlices(casinoSlices, pie)
    const others = enriched.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)

    expect(others?.groupedSlices?.length).toBeGreaterThan(0)
  })
})

describe('enrichSourcePieOthersGroupedSlices', () => {
  it('returns pie slices unchanged when pie has no others slice', () => {
    const sourceSlices = [
      makeSlice({ key: 'web', amount: 100, group: 'source' })
    ]
    const pie = buildPieRenderSlices(sourceSlices)

    expect(enrichSourcePieOthersGroupedSlices(sourceSlices, pie)).toEqual(pie)
  })

  it('enriches others groupedSlices from non-casino source catalog', () => {
    const sourceSlices = [
      makeSlice({ key: 'web', amount: 100, group: 'source' }),
      makeSlice({ key: 'manual', amount: 1, group: 'source' })
    ]
    const pie = buildPieRenderSlices(sourceSlices)
    const enriched = enrichSourcePieOthersGroupedSlices(sourceSlices, pie)
    const others = enriched.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)

    expect(others?.groupedSlices).toEqual([
      expect.objectContaining({ key: 'manual' })
    ])
  })
})

describe('buildCasinoPieLegendSlices', () => {
  it('builds legend from pie render slices with others grouping', () => {
    const casinoSlices = [
      makeSlice({ key: 'dice', amount: 100 }),
      makeSlice({ key: 'slots', amount: 2 })
    ]
    const pie = buildPieRenderSlices(casinoSlices)
    const legend = buildCasinoPieLegendSlices(casinoSlices, pie)

    expect(legend.some((slice) => slice.key === 'dice')).toBe(true)
    expect(legend.some((slice) => slice.key === PIE_OTHERS_SLICE_KEY)).toBe(
      true
    )
  })

  it('creates a synthetic others legend entry when pie omits others', () => {
    const casinoSlices = [
      { key: 'dice', label: 'DICE', amount: 100, netAmount: 0, color: 'x' },
      { key: 'slots', label: 'SLOTS', amount: 1, netAmount: 0, color: 'y' }
    ] as VolumeSlice[]
    const pieOnlyDice: PieRenderSlice[] = [
      { ...makeSlice({ key: 'dice', amount: 100 }), pieAmount: 100 }
    ]

    const legend = buildCasinoPieLegendSlices(casinoSlices, pieOnlyDice)

    const others = legend.find((slice) => slice.key === PIE_OTHERS_SLICE_KEY)

    expect(others).toMatchObject({ amount: 1, group: 'casino' })
    expect(others?.groupedSlices?.some((slice) => slice.key === 'slots')).toBe(
      true
    )
  })

  it('returns pie slices when catalog keys already match pie keys', () => {
    const slices = [makeSlice({ key: 'dice', amount: 100 })]
    const pie = buildPieRenderSlices(slices)

    expect(buildCasinoPieLegendSlices(slices, pie)).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'dice' })])
    )
  })

  it('returns legend without others when every catalog key is in the pie', () => {
    const casinoSlices = [makeSlice({ key: 'dice', amount: 100 })]
    const catalog = buildCasinoGameLegendSlices(casinoSlices)
    const pie = catalog.map((slice) => ({
      ...slice,
      pieAmount: slice.amount
    }))

    const legend = buildCasinoPieLegendSlices(casinoSlices, pie)

    expect(legend.some((slice) => slice.key === PIE_OTHERS_SLICE_KEY)).toBe(
      false
    )
  })
})

describe('buildSourcePieLegendSlices', () => {
  it('sorts pie legend without a casino slice', () => {
    const pie = buildPieRenderSlices([
      makeSlice({ key: 'web', amount: 10, group: 'source' }),
      makeSlice({ key: 'manual', amount: 20, group: 'source' })
    ])
    const legend = buildSourcePieLegendSlices(pie)

    expect(legend[0]!.amount).toBeGreaterThanOrEqual(legend[1]!.amount)
  })

  it('prepends the casino slice when provided', () => {
    const pie = buildPieRenderSlices([
      makeSlice({ key: 'web', amount: 10, group: 'source' })
    ])
    const casino = makeSlice({
      key: 'casino',
      amount: 50,
      group: 'source'
    })

    const legend = buildSourcePieLegendSlices(pie, casino)

    expect(legend.find((slice) => slice.key === 'casino')).toMatchObject({
      pieAmount: 50
    })
  })
})

describe('source slice helpers', () => {
  const sourceSlices: VolumeSlice[] = [
    makeSlice({ key: 'web', amount: 10, group: 'source' }),
    makeSlice({ key: 'casino', amount: 5, group: 'source' }),
    makeSlice({ key: 'command', amount: 0, group: 'source' })
  ]

  it('getNonCasinoSourceSlices filters casino and zero amounts', () => {
    expect(
      getNonCasinoSourceSlices(sourceSlices).map((slice) => slice.key)
    ).toEqual(['web'])
  })

  it('getCasinoSourceSlice returns the active casino aggregate', () => {
    expect(getCasinoSourceSlice(sourceSlices)).toMatchObject({
      key: 'casino',
      amount: 5
    })
    expect(getCasinoSourceSlice([])).toBeUndefined()
  })

  it('getSourcePieSlices mirrors non-casino sources', () => {
    expect(getSourcePieSlices(sourceSlices)).toEqual(
      getNonCasinoSourceSlices(sourceSlices)
    )
  })

  it('sumVolumeSliceAmounts totals slice amounts', () => {
    expect(
      sumVolumeSliceAmounts([
        makeSlice({ key: 'a', amount: 3 }),
        makeSlice({ key: 'b', amount: 7 })
      ])
    ).toBe(10)
  })
})

describe('buildCasinoGameLegendSlices', () => {
  it('includes all catalog games and preserves active slices', () => {
    const active = [makeSlice({ key: 'dice', amount: 50, netAmount: 2 })]
    const legend = buildCasinoGameLegendSlices(active)

    expect(legend.find((slice) => slice.key === 'dice')).toMatchObject({
      amount: 50,
      netAmount: 2
    })
    expect(legend.find((slice) => slice.key === 'slots')?.amount).toBe(0)
    expect(legend.length).toBeGreaterThan(active.length)
  })

  it('sorts zero-amount catalog entries by label when amounts tie', () => {
    const legend = buildCasinoGameLegendSlices([])
    const zeroAmount = legend.filter((slice) => slice.amount === 0)
    const labels = zeroAmount.map((slice) => slice.label)
    const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b))

    expect(labels).toEqual(sortedLabels)
  })
})
