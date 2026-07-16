import { describe, expect, it } from 'vitest'

import { parseTransactionExportParams } from '@/lib/export/parseTransactionExportParams'

describe('parseTransactionExportParams', () => {
  it('returns undefined for missing optional params', () => {
    expect(parseTransactionExportParams(new URLSearchParams())).toEqual({
      search: undefined,
      staffId: undefined,
      referenceId: undefined,
      filterType: undefined,
      filterSource: undefined,
      filterCasinoGame: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: undefined,
      userId: undefined
    })
  })

  it('parses filters and resolves referenceId fallbacks', () => {
    const params = new URLSearchParams({
      search: 'foo',
      staffId: 'staff-1',
      betId: 'bet-legacy',
      filterType: 'bet,win,',
      filterSource: 'casino',
      filterCasinoGame: 'dice,slots',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      sort: 'createdAt',
      userId: 'user-1'
    })

    expect(parseTransactionExportParams(params)).toEqual({
      search: 'foo',
      staffId: 'staff-1',
      referenceId: 'bet-legacy',
      filterType: ['bet', 'win'],
      filterSource: ['casino'],
      filterCasinoGame: ['dice', 'slots'],
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      sort: 'createdAt',
      userId: 'user-1'
    })
  })

  it('prefers referenceId over betId and adminSearch', () => {
    const params = new URLSearchParams({
      referenceId: 'ref-1',
      betId: 'bet-1',
      adminSearch: 'admin-1'
    })
    expect(parseTransactionExportParams(params).referenceId).toBe('ref-1')
  })
})
