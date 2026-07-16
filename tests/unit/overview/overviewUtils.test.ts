import { describe, expect, it } from 'vitest'

import { WHOLE_TIME_START, getWholeTimeRange } from '@/lib/overview/datePresets'
import {
  formatChartAxisCurrency,
  formatOverviewCount,
  formatOverviewCurrency
} from '@/lib/overview/overviewFormatters'
import {
  getRtpStatus,
  hasRtpWarning,
  isRtpOutOfRange,
  skipsCasinoRtpCheck
} from '@/lib/overview/rtpWarnings'
import {
  buildSetupHealth,
  countSetupHealthIssues
} from '@/lib/overview/setupHealth'

describe('datePresets', () => {
  it('getWholeTimeRange starts at WHOLE_TIME_START and ends end-of-day', () => {
    const end = new Date(2026, 5, 15, 10, 30)
    const range = getWholeTimeRange(end)
    expect(range.from).toEqual(
      new Date(
        WHOLE_TIME_START.getFullYear(),
        WHOLE_TIME_START.getMonth(),
        WHOLE_TIME_START.getDate(),
        0,
        0,
        0,
        0
      )
    )
    expect(range.to.getHours()).toBe(23)
    expect(range.to.getDate()).toBe(15)
  })

  it('getWholeTimeRange defaults end to today', () => {
    const range = getWholeTimeRange()
    expect(range.from.getFullYear()).toBe(2020)
    expect(range.to).toBeInstanceOf(Date)
  })
})

describe('rtpWarnings', () => {
  it('skipsCasinoRtpCheck only for known skip games', () => {
    expect(skipsCasinoRtpCheck('blackjack')).toBe(true)
    expect(skipsCasinoRtpCheck('prediction')).toBe(true)
    expect(skipsCasinoRtpCheck('winAnnouncements')).toBe(true)
    expect(skipsCasinoRtpCheck('dice')).toBe(false)
  })

  it('isRtpOutOfRange flags extremes', () => {
    expect(isRtpOutOfRange(100)).toBe(true)
    expect(isRtpOutOfRange(90)).toBe(true)
    expect(isRtpOutOfRange(95)).toBe(false)
  })

  it('hasRtpWarning handles null, number, and record', () => {
    expect(hasRtpWarning(null)).toBe(false)
    expect(hasRtpWarning(undefined)).toBe(false)
    expect(hasRtpWarning(95)).toBe(false)
    expect(hasRtpWarning(101)).toBe(true)
    expect(hasRtpWarning({ a: 95, b: 80 })).toBe(true)
    expect(hasRtpWarning({ a: 95, b: 96 })).toBe(false)
  })

  it('getRtpStatus returns hidden/ok/high/low', () => {
    expect(getRtpStatus(95, true)).toBe('hidden')
    expect(getRtpStatus(null, false)).toBe('hidden')
    expect(getRtpStatus(95, false)).toBe('ok')
    expect(getRtpStatus(100, false)).toBe('high')
    expect(getRtpStatus(90, false)).toBe('low')
    expect(getRtpStatus({ x: 95, y: 101 }, false)).toBe('high')
    expect(getRtpStatus({ x: 95, y: 85 }, false)).toBe('low')
  })
})

describe('overviewFormatters', () => {
  const prefixSettings = {
    currencySymbol: '$',
    currencyPlacement: 'prefix' as const
  }
  const suffixSettings = {
    currencySymbol: ' Kč',
    currencyPlacement: 'suffix' as const
  }

  it('formatOverviewCurrency switches compact at 1M', () => {
    expect(formatOverviewCurrency(1_500, prefixSettings)).toContain('1')
    expect(formatOverviewCurrency(1_500_000, prefixSettings)).toMatch(/M/i)
  })

  it('formatOverviewCount formats readable counts', () => {
    expect(formatOverviewCount(1200)).toBeTruthy()
  })

  it('formatChartAxisCurrency covers k/M/raw and sign/placement', () => {
    expect(formatChartAxisCurrency(0, prefixSettings)).toBeTruthy()
    expect(formatChartAxisCurrency(500, prefixSettings)).toContain('500')
    expect(formatChartAxisCurrency(1_500, prefixSettings)).toContain('1.5k')
    expect(formatChartAxisCurrency(2_500_000, prefixSettings)).toContain('2.5M')
    expect(formatChartAxisCurrency(-1_500, prefixSettings)).toContain('-')
    expect(formatChartAxisCurrency(1_500, suffixSettings)).toContain('Kč')
  })
})

describe('setupHealth helpers', () => {
  it('countSetupHealthIssues counts failed checks', () => {
    expect(
      countSetupHealthIssues([
        { id: 'a', label: 'A', ok: true },
        { id: 'b', label: 'B', ok: false }
      ])
    ).toBe(1)
  })

  it('buildSetupHealth adds numeric RTP warning when out of range', () => {
    const checks = buildSetupHealth('g1', {
      guildId: 'g1',
      casinoSettings: {
        dice: { winMultiplier: 7, maxBet: 0, minBet: 0 }
      }
    } as never)

    const rtp = checks.find((check) => check.id === 'rtp-dice')
    expect(rtp).toMatchObject({
      ok: false,
      warning: true,
      rtpStatus: 'high'
    })
    expect(rtp?.label).toMatch(/RTP out of range \(\d+\.\d+%\)/)
  })

  it('buildSetupHealth formats record RTP labels', () => {
    const checks = buildSetupHealth('g1', {
      guildId: 'g1',
      casinoSettings: {
        roulette: {
          winMultipliers: {
            number: 50,
            color: 2,
            parity: 1.95,
            range: 1.95,
            dozen: 2.85,
            column: 2.85
          },
          maxBet: 0,
          minBet: 0
        }
      }
    } as never)

    const rtp = checks.find((check) => check.id === 'rtp-roulette')
    expect(rtp?.label).toMatch(/:/)
  })

  it('buildSetupHealth skips missing game settings entries', () => {
    const checks = buildSetupHealth('g1', {
      guildId: 'g1',
      casinoSettings: {
        dice: undefined
      }
    } as never)
    expect(checks.every((c) => !c.id.startsWith('rtp-dice'))).toBe(true)
  })
})
