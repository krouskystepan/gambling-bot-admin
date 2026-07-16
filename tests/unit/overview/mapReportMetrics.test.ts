import { describe, expect, it } from 'vitest'

import { mapReportMetrics } from '@/lib/overview/mapReportMetrics'

describe('mapReportMetrics', () => {
  it('coerces missing metrics to zero', () => {
    expect(mapReportMetrics({})).toEqual({
      gamePnL: 0,
      cashFlow: 0,
      betVolume: 0,
      winVolume: 0,
      depositVolume: 0,
      withdrawVolume: 0,
      txCount: 0
    })
  })

  it('preserves provided metrics', () => {
    expect(
      mapReportMetrics({
        gamePnL: 1,
        cashFlow: 2,
        betVolume: 3,
        winVolume: 4,
        depositVolume: 5,
        withdrawVolume: 6,
        txCount: 7
      })
    ).toEqual({
      gamePnL: 1,
      cashFlow: 2,
      betVolume: 3,
      winVolume: 4,
      depositVolume: 5,
      withdrawVolume: 6,
      txCount: 7
    })
  })
})
