import { describe, expect, it } from 'vitest'

import {
  buildStaffTaxPeriodGroupStage,
  buildTaxPeriodGroupStage,
  getTaxPeriodMongoFormat
} from '@/lib/overview/transactionTotals'

describe('transactionTotals builders', () => {
  it('getTaxPeriodMongoFormat maps granularity', () => {
    expect(getTaxPeriodMongoFormat('hour')).toBe('%Y-%m-%dT%H:00')
    expect(getTaxPeriodMongoFormat('day')).toBe('%Y-%m-%d')
    expect(getTaxPeriodMongoFormat('month')).toBe('%Y-%m')
  })

  it('buildTaxPeriodGroupStage snapshots period grouping', () => {
    expect(buildTaxPeriodGroupStage('Europe/Prague', 'day')).toEqual({
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: 'Europe/Prague'
          }
        },
        gamePnL: expect.any(Object),
        cashFlow: expect.any(Object),
        betVolume: expect.any(Object),
        winVolume: expect.any(Object),
        depositVolume: expect.any(Object),
        withdrawVolume: expect.any(Object),
        txCount: { $sum: 1 }
      }
    })
  })

  it('buildStaffTaxPeriodGroupStage groups by period and handler', () => {
    const stage = buildStaffTaxPeriodGroupStage('Europe/Prague', 'month')
    expect(stage.$group._id).toEqual({
      period: {
        $dateToString: {
          format: '%Y-%m',
          date: '$createdAt',
          timezone: 'Europe/Prague'
        }
      },
      handlerId: '$handledBy'
    })
  })
})
