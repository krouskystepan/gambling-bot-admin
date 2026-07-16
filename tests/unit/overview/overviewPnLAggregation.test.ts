import { describe, expect, it } from 'vitest'

import { buildPnLTimeGroupStage } from '@/lib/overview/overviewPnLAggregation'

describe('buildPnLTimeGroupStage', () => {
  it('uses hourly format for hour granularity', () => {
    expect(buildPnLTimeGroupStage('Europe/Prague', 'hour')).toEqual({
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%dT%H:00',
            date: '$createdAt',
            timezone: 'Europe/Prague'
          }
        },
        gamePnL: expect.any(Object),
        cashFlow: expect.any(Object),
        txCount: { $sum: 1 }
      }
    })
  })

  it('uses daily format for day granularity', () => {
    const stage = buildPnLTimeGroupStage('UTC', 'day')
    expect(stage.$group._id).toEqual({
      $dateToString: {
        format: '%Y-%m-%d',
        date: '$createdAt',
        timezone: 'UTC'
      }
    })
  })
})
