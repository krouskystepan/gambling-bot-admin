import { describe, expect, it } from 'vitest'

import {
  formatDatePickerRange,
  getDatePickerPresets,
  getDatePickerRangeLabel,
  getWholeTimeDateRange,
  rangesMatch,
  safeDate
} from '@/lib/datePickerPresets'

const today = safeDate(new Date(2026, 5, 15))

describe('datePickerPresets', () => {
  it('safeDate normalizes to noon', () => {
    const normalized = safeDate(new Date(2026, 5, 15, 8, 30))
    expect(normalized.getHours()).toBe(12)
    expect(normalized.getDate()).toBe(15)
  })

  it('getDatePickerPresets exposes expected preset labels', () => {
    const labels = getDatePickerPresets(today).map((preset) => preset.label)
    expect(labels).toContain('Today')
    expect(labels).toContain('All time')
  })

  it('rangesMatch compares day boundaries', () => {
    const a = { from: today, to: today }
    const b = { from: safeDate(today), to: safeDate(today) }
    expect(rangesMatch(a, b)).toBe(true)
    expect(
      rangesMatch(a, { from: safeDate(new Date(2026, 5, 14)), to: today })
    ).toBe(false)
  })

  it('getDatePickerRangeLabel resolves preset labels', () => {
    const todayPreset = getDatePickerPresets(today)[0].match()
    expect(
      getDatePickerRangeLabel(todayPreset.from, todayPreset.to, today)
    ).toBe('Today')
    expect(
      getDatePickerRangeLabel(new Date(2020, 0, 1), new Date(2020, 0, 2), today)
    ).toBeNull()
  })

  it('formatDatePickerRange formats readable range', () => {
    expect(formatDatePickerRange(today, today)).toMatch(/Jun 15, 2026/)
  })

  it('getWholeTimeDateRange anchors from whole-time start', () => {
    const range = getWholeTimeDateRange(today)
    expect(range.to).toEqual(today)
    expect(range.from.getFullYear()).toBe(2020)
  })
})
