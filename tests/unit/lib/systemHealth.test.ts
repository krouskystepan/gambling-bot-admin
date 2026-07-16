import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatAgeMs, formatStaleAge } from '@/lib/systemHealth/formatAge'
import {
  atmStalePendingCutoff,
  blackjackStaleCutoff,
  predictionStuckPayingCutoff
} from '@/lib/systemHealth/thresholds'

describe('systemHealth thresholds', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns cutoffs relative to now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

    expect(blackjackStaleCutoff().toISOString()).toBe(
      '2026-01-14T12:00:00.000Z'
    )
    expect(predictionStuckPayingCutoff().toISOString()).toBe(
      '2026-01-15T11:50:00.000Z'
    )
    expect(atmStalePendingCutoff().toISOString()).toBe(
      '2026-01-14T12:00:00.000Z'
    )
  })
})

describe('formatAge', () => {
  it('formats relative ages and stale labels', () => {
    expect(formatAgeMs(30_000)).toBe('just now')
    expect(formatAgeMs(5 * 60_000)).toBe('5m ago')
    expect(formatAgeMs(3 * 3_600_000)).toBe('3h ago')
    expect(formatAgeMs(2 * 86_400_000)).toBe('2d ago')
    expect(formatStaleAge(2 * 86_400_000)).toBe('Stale 2d')
    expect(formatStaleAge(3 * 3_600_000)).toBe('3h ago')
  })
})
