import { describe, expect, it } from 'vitest'

import { parseReportExportParams } from '@/lib/export/parseReportExportParams'

describe('parseReportExportParams', () => {
  it('returns null when dateFrom or dateTo is missing', () => {
    expect(parseReportExportParams(new URLSearchParams())).toBeNull()
    expect(
      parseReportExportParams(new URLSearchParams({ dateFrom: '2026-01-01' }))
    ).toBeNull()
    expect(
      parseReportExportParams(new URLSearchParams({ dateTo: '2026-01-31' }))
    ).toBeNull()
  })

  it('returns the date range when both bounds are present', () => {
    expect(
      parseReportExportParams(
        new URLSearchParams({
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31'
        })
      )
    ).toEqual({ dateFrom: '2026-01-01', dateTo: '2026-01-31' })
  })
})
