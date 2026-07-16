import { DateTime } from 'luxon'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildMultiDayHourAxisTicks,
  buildSingleDayHourAxisTicks,
  fillDailySeries,
  fillHourlySeries,
  fillMonthlySeries,
  fillTaxDailySeries,
  fillTaxHourlySeries,
  fillTaxPeriodSeries,
  formatOverviewDailyAxisTick,
  formatOverviewDayLabel,
  formatOverviewDayNumericMonthLabel,
  formatOverviewDayTooltip,
  formatOverviewHourAxisTick,
  formatOverviewHourLabel,
  formatOverviewHourTooltip,
  formatOverviewMultiDayHourAxisTick,
  formatReportPeriodLabel,
  fromLocalDateString,
  getOverviewHourlyDayCount,
  getOverviewRangeDayCount,
  getOverviewRangeLabel,
  getReportPeriodColumnLabel,
  getReportTaxSummaryDescription,
  getReportsQuickPresetGroups,
  getReportsRangeLabel,
  getReportsSearchablePresetGroups,
  guildTodayDate,
  parseOverviewBucket,
  resolveOverviewDateRange,
  resolveOverviewPnLGranularity,
  resolveReportTaxGranularity,
  resolveReportsDateRange,
  toLocalDateString,
  uses24HourClock
} from '@/features/general/overview/period'

const FIXED_NOW = DateTime.fromISO('2026-07-15T14:30:00', { zone: 'UTC' })

describe('overview period helpers', () => {
  describe('local date string conversions', () => {
    it('round-trips calendar dates via local noon', () => {
      const date = new Date(2026, 0, 5, 15, 30)
      expect(toLocalDateString(date)).toBe('2026-01-05')
      expect(fromLocalDateString('2026-01-05')).toEqual(
        new Date(2026, 0, 5, 12)
      )
    })
  })

  describe('resolveOverviewDateRange', () => {
    it('prefers explicit bounds', () => {
      expect(
        resolveOverviewDateRange({
          dateFrom: '2026-02-01',
          dateTo: '2026-02-10'
        })
      ).toEqual({ dateFrom: '2026-02-01', dateTo: '2026-02-10' })
    })

    it('defaults to year-to-date in timezone', () => {
      const range = resolveOverviewDateRange(undefined, 'Europe/Prague')
      expect(range.dateFrom).toMatch(/^\d{4}-01-01$/)
      expect(range.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('defaults when only one bound is provided', () => {
      const onlyFrom = resolveOverviewDateRange(
        { dateFrom: '2026-02-01' },
        'UTC'
      )
      const onlyTo = resolveOverviewDateRange({ dateTo: '2026-02-10' }, 'UTC')

      expect(onlyFrom.dateFrom).toMatch(/^\d{4}-01-01$/)
      expect(onlyTo.dateFrom).toMatch(/^\d{4}-01-01$/)
    })
  })

  describe('range day count and PnL granularity', () => {
    it('counts inclusive days and picks PnL granularity', () => {
      const range = { dateFrom: '2026-01-01', dateTo: '2026-01-03' }
      expect(getOverviewRangeDayCount(range, 'UTC')).toBe(3)
      expect(resolveOverviewPnLGranularity(range, 'UTC')).toBe('hour')
      expect(
        resolveOverviewPnLGranularity(
          { dateFrom: '2026-01-01', dateTo: '2026-01-10' },
          'UTC'
        )
      ).toBe('day')
    })
  })

  describe('overview series fill helpers', () => {
    it('fillDailySeries zero-fills missing days', () => {
      const filled = fillDailySeries(
        { dateFrom: '2026-01-01', dateTo: '2026-01-03' },
        [{ date: '2026-01-02', gamePnL: 5, cashFlow: 1, txCount: 2 }],
        'UTC'
      )
      expect(filled).toHaveLength(3)
      expect(filled[0]).toEqual({
        date: '2026-01-01',
        gamePnL: 0,
        cashFlow: 0,
        txCount: 0
      })
      expect(filled[1]?.gamePnL).toBe(5)
    })

    it('fillHourlySeries zero-fills hours in range', () => {
      const filled = fillHourlySeries(
        { dateFrom: '2026-01-01', dateTo: '2026-01-01' },
        [
          {
            date: '2026-01-01T12:00',
            gamePnL: 3,
            cashFlow: 0,
            txCount: 1
          }
        ],
        'UTC'
      )
      expect(filled).toHaveLength(24)
      expect(
        filled.find((point) => point.date === '2026-01-01T12:00')?.gamePnL
      ).toBe(3)
    })
  })

  describe('reports date range and presets', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(FIXED_NOW.toJSDate())
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('resolveReportsDateRange prefers explicit bounds or defaults to prior year', () => {
      expect(
        resolveReportsDateRange({
          dateFrom: '2026-02-01',
          dateTo: '2026-02-10'
        })
      ).toEqual({ dateFrom: '2026-02-01', dateTo: '2026-02-10' })

      expect(resolveReportsDateRange(undefined, 'UTC')).toEqual({
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31'
      })

      expect(
        resolveReportsDateRange({ dateFrom: '2026-01-01' }, 'UTC')
      ).toEqual({
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31'
      })
    })

    it('guildTodayDate returns guild-local calendar date at noon', () => {
      expect(guildTodayDate('UTC')).toEqual(new Date(2026, 6, 15, 12))
    })

    it('getReportsQuickPresetGroups match() returns bounded ranges', () => {
      const groups = getReportsQuickPresetGroups('UTC')
      expect(groups).toHaveLength(1)

      for (const preset of groups[0]?.presets ?? []) {
        const bounds = preset.match()
        expect(bounds.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(bounds.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(bounds.dateFrom <= bounds.dateTo).toBe(true)
      }

      const allTime = groups[0]?.presets.find((p) => p.label === 'All time')
      const allTimeBounds = allTime?.match()
      expect(allTimeBounds?.dateTo).toBe('2026-07-15')
      expect(allTimeBounds?.dateFrom).toMatch(/^20(19-12-31|20-01-01)$/)

      const lastYear = groups[0]?.presets.find((p) =>
        p.label.startsWith('Last year')
      )
      expect(lastYear?.match()).toEqual({
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31'
      })
    })

    it('getReportsSearchablePresetGroups match() covers years and quarters', () => {
      const groups = getReportsSearchablePresetGroups('UTC')
      const yearPresets = groups.find((g) => g.label === 'Calendar years')
      const quarterPresets = groups.find((g) => g.label === 'Quarters')

      expect(yearPresets?.presets.some((p) => p.label === '2026 YTD')).toBe(
        true
      )
      expect(yearPresets?.presets.some((p) => p.label === '2025')).toBe(true)

      for (const preset of yearPresets?.presets ?? []) {
        const bounds = preset.match()
        expect(bounds.dateFrom <= bounds.dateTo).toBe(true)
      }

      const q3Current = quarterPresets?.presets.find(
        (p) => p.label === 'Q3 2026'
      )
      expect(q3Current?.match()).toEqual({
        dateFrom: '2026-07-01',
        dateTo: '2026-07-15'
      })

      const q4Prior = quarterPresets?.presets.find((p) => p.label === 'Q4 2025')
      expect(q4Prior?.match()).toEqual({
        dateFrom: '2025-10-01',
        dateTo: '2025-12-31'
      })

      for (const preset of quarterPresets?.presets ?? []) {
        preset.match()
      }
    })

    it('getReportsRangeLabel matches presets and returns null for custom ranges', () => {
      const ytd = getReportsQuickPresetGroups('UTC')[0]?.presets.find(
        (p) => p.label === 'Year to date'
      )
      const bounds = ytd?.match()
      expect(bounds).toBeDefined()

      expect(
        getReportsRangeLabel(bounds!.dateFrom, bounds!.dateTo, 'UTC')
      ).toBe('Year to date')

      expect(getReportsRangeLabel('2020-05-01', '2020-05-31', 'UTC')).toBeNull()
    })

    it('getOverviewRangeLabel matches overview presets or returns custom label', () => {
      const range = resolveOverviewDateRange(undefined, 'UTC')
      expect(getOverviewRangeLabel(range.dateFrom, range.dateTo, 'UTC')).toBe(
        'Year to date (1 Jan – today)'
      )

      expect(getOverviewRangeLabel('2020-05-01', '2020-05-31', 'UTC')).toBe(
        'Custom range'
      )
    })
  })

  describe('report tax granularity and series', () => {
    it('resolveReportTaxGranularity picks hour, day, or month', () => {
      expect(
        resolveReportTaxGranularity(
          { dateFrom: '2026-01-01', dateTo: '2026-01-01' },
          'UTC'
        )
      ).toBe('hour')

      expect(
        resolveReportTaxGranularity(
          { dateFrom: '2026-01-01', dateTo: '2026-01-15' },
          'UTC'
        )
      ).toBe('day')

      expect(
        resolveReportTaxGranularity(
          { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
          'UTC'
        )
      ).toBe('day')

      expect(
        resolveReportTaxGranularity(
          { dateFrom: '2026-01-15', dateTo: '2026-02-10' },
          'UTC'
        )
      ).toBe('day')

      expect(
        resolveReportTaxGranularity(
          { dateFrom: '2026-01-01', dateTo: '2026-03-15' },
          'UTC'
        )
      ).toBe('month')
    })

    it('fillTaxHourlySeries, fillTaxDailySeries, and fillMonthlySeries zero-fill gaps', () => {
      const hourly = fillTaxHourlySeries(
        { dateFrom: '2026-01-01', dateTo: '2026-01-01' },
        [
          {
            period: '2026-01-01T12:00',
            gamePnL: 1,
            cashFlow: 2,
            betVolume: 3,
            winVolume: 4,
            depositVolume: 5,
            withdrawVolume: 6,
            txCount: 7
          }
        ],
        'UTC'
      )
      expect(hourly).toHaveLength(24)
      expect(hourly[12]?.gamePnL).toBe(1)
      expect(hourly[0]?.txCount).toBe(0)

      const daily = fillTaxDailySeries(
        { dateFrom: '2026-01-01', dateTo: '2026-01-03' },
        [
          {
            period: '2026-01-02',
            gamePnL: 10,
            cashFlow: 0,
            betVolume: 0,
            winVolume: 0,
            depositVolume: 0,
            withdrawVolume: 0,
            txCount: 1
          }
        ],
        'UTC'
      )
      expect(daily).toHaveLength(3)
      expect(daily[1]?.gamePnL).toBe(10)

      const monthly = fillMonthlySeries(
        { dateFrom: '2026-01-15', dateTo: '2026-03-10' },
        [
          {
            period: '2026-02',
            gamePnL: 99,
            cashFlow: 0,
            betVolume: 0,
            winVolume: 0,
            depositVolume: 0,
            withdrawVolume: 0,
            txCount: 2
          }
        ],
        'UTC'
      )
      expect(monthly.map((point) => point.period)).toEqual([
        '2026-01',
        '2026-02',
        '2026-03'
      ])
      expect(monthly[1]?.gamePnL).toBe(99)
    })

    it('fillTaxPeriodSeries delegates to the matching filler', () => {
      const range = { dateFrom: '2026-01-01', dateTo: '2026-01-01' }
      const point = {
        period: '2026-01-01T00:00',
        gamePnL: 1,
        cashFlow: 0,
        betVolume: 0,
        winVolume: 0,
        depositVolume: 0,
        withdrawVolume: 0,
        txCount: 1
      }

      expect(fillTaxPeriodSeries(range, [point], 'hour', 'UTC')).toHaveLength(
        24
      )
      expect(
        fillTaxPeriodSeries(
          { dateFrom: '2026-01-01', dateTo: '2026-01-02' },
          [{ ...point, period: '2026-01-01' }],
          'day',
          'UTC'
        )
      ).toHaveLength(2)
      expect(
        fillTaxPeriodSeries(
          { dateFrom: '2026-01-01', dateTo: '2026-03-01' },
          [{ ...point, period: '2026-02' }],
          'month',
          'UTC'
        )
      ).toHaveLength(3)
    })
  })

  describe('report tax labels and descriptions', () => {
    it('getReportPeriodColumnLabel returns column headers', () => {
      expect(getReportPeriodColumnLabel('hour')).toBe('Hour')
      expect(getReportPeriodColumnLabel('day')).toBe('Day')
      expect(getReportPeriodColumnLabel('month')).toBe('Month')
    })

    it('formatReportPeriodLabel formats by granularity', () => {
      expect(formatReportPeriodLabel('2026-03', 'month', 'UTC')).toBe(
        'March 2026'
      )
      expect(formatReportPeriodLabel('2026-03-05', 'day', 'UTC')).toBe(
        '5 Mar 2026'
      )
      expect(formatReportPeriodLabel('2026-03-05T14:00', 'hour', 'UTC')).toBe(
        '5. March 2026 14:00'
      )
    })

    it('getReportTaxSummaryDescription varies by kind and granularity', () => {
      expect(getReportTaxSummaryDescription('guild', 'hour')).toContain(
        'Hourly house P&L'
      )
      expect(getReportTaxSummaryDescription('guild', 'day')).toContain(
        'Daily house P&L'
      )
      expect(getReportTaxSummaryDescription('guild', 'month')).toContain(
        'Monthly house P&L'
      )
      expect(getReportTaxSummaryDescription('staff', 'hour')).toContain(
        'Hourly totals for transactions'
      )
      expect(getReportTaxSummaryDescription('staff', 'day')).toContain(
        'Daily totals for transactions'
      )
      expect(getReportTaxSummaryDescription('staff', 'month')).toContain(
        'Monthly totals for transactions'
      )
    })
  })

  describe('overview chart formatting', () => {
    const bucket = DateTime.fromISO('2026-03-05T14:30:00', { zone: 'UTC' })

    it('parseOverviewBucket resolves guild timezone', () => {
      const parsed = parseOverviewBucket('2026-03-05T14:30:00', 'UTC')
      expect(parsed.hour).toBe(14)
      expect(parsed.zoneName).toBe('UTC')
    })

    it('uses24HourClock distinguishes American and other zones', () => {
      expect(uses24HourClock('UTC')).toBe(true)
      expect(uses24HourClock('Europe/Prague')).toBe(true)
      expect(uses24HourClock('America/New_York')).toBe(false)
    })

    it('formats hour labels for 24h and 12h clocks', () => {
      expect(formatOverviewHourLabel(bucket, 'UTC')).toBe('14:00')
      expect(formatOverviewHourAxisTick(bucket.startOf('day'), 14, 'UTC')).toBe(
        '14:00'
      )

      const nyBucket = bucket.setZone('America/New_York')
      expect(formatOverviewHourLabel(nyBucket, 'America/New_York')).toMatch(
        /\d{1,2}(AM|PM)/
      )
      expect(formatOverviewHourTooltip(nyBucket, 'America/New_York')).toMatch(
        /\d{1,2}:\d{2}(AM|PM)/
      )
    })

    it('formats day labels and axis ticks', () => {
      expect(formatOverviewDayLabel(bucket)).toBe('5. March')
      expect(formatOverviewDayNumericMonthLabel(bucket)).toBe('5. 3')
      expect(formatOverviewDayTooltip(bucket)).toBe('5. March 2026')
      expect(formatOverviewDailyAxisTick('2026-03-05', 'UTC')).toBe('5. March')
    })

    it('formatOverviewHourTooltip uses 24h in non-American zones', () => {
      expect(formatOverviewHourTooltip(bucket, 'UTC')).toBe(
        '5. March 2026 14:30'
      )
    })

    it('formatOverviewMultiDayHourAxisTick adapts to day count', () => {
      expect(formatOverviewMultiDayHourAxisTick(bucket, 5, 'UTC')).toBe(
        '5. March'
      )
      expect(formatOverviewMultiDayHourAxisTick(bucket, 2, 'UTC')).toBe(
        '5. March 14:00'
      )
      expect(formatOverviewMultiDayHourAxisTick(bucket, 3, 'UTC')).toBe(
        '5. 3 14:00'
      )
    })

    it('getOverviewHourlyDayCount counts distinct calendar days', () => {
      expect(
        getOverviewHourlyDayCount([
          { date: '2026-01-01T00:00', gamePnL: 0, cashFlow: 0, txCount: 0 },
          { date: '2026-01-01T12:00', gamePnL: 0, cashFlow: 0, txCount: 0 },
          { date: '2026-01-02T00:00', gamePnL: 0, cashFlow: 0, txCount: 0 }
        ])
      ).toBe(2)
    })

    it('buildSingleDayHourAxisTicks keeps standard hour ticks', () => {
      const points = Array.from({ length: 24 }, (_, hour) => ({
        date: `2026-01-01T${String(hour).padStart(2, '0')}:00`,
        gamePnL: 0,
        cashFlow: 0,
        txCount: 0
      }))

      expect(buildSingleDayHourAxisTicks(points, 'UTC')).toEqual([
        '2026-01-01T00:00',
        '2026-01-01T03:00',
        '2026-01-01T06:00',
        '2026-01-01T09:00',
        '2026-01-01T12:00',
        '2026-01-01T15:00',
        '2026-01-01T18:00',
        '2026-01-01T21:00'
      ])
    })

    it('buildMultiDayHourAxisTicks adapts to day count', () => {
      const fiveDayPoints = [
        '2026-01-01T00:00',
        '2026-01-01T12:00',
        '2026-01-02T00:00',
        '2026-01-02T12:00'
      ].map((date) => ({ date, gamePnL: 0, cashFlow: 0, txCount: 0 }))

      expect(buildMultiDayHourAxisTicks(fiveDayPoints, 5, 'UTC')).toEqual([
        '2026-01-01T00:00',
        '2026-01-02T00:00'
      ])

      expect(buildMultiDayHourAxisTicks(fiveDayPoints, 2, 'UTC')).toEqual([
        '2026-01-01T00:00',
        '2026-01-01T12:00',
        '2026-01-02T00:00',
        '2026-01-02T12:00'
      ])
    })
  })
})
