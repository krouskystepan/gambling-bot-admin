import { describe, expect, it } from 'vitest'

import { EXPORT_BATCH_SIZE, EXPORT_MAX_ROWS } from '@/lib/export/exportLimits'
import {
  csvAttachmentResponse,
  exportErrorResponse
} from '@/lib/export/exportResponse'
import {
  buildReportExportUrl,
  buildStaffActionsExportUrl,
  buildTransactionExportUrl
} from '@/lib/export/exportUrls'

describe('exportLimits', () => {
  it('exposes batch and max row constants', () => {
    expect(EXPORT_BATCH_SIZE).toBe(2000)
    expect(EXPORT_MAX_ROWS).toBe(100_000)
  })
})

describe('exportUrls', () => {
  it('buildTransactionExportUrl strips pagination and view params', () => {
    expect(
      buildTransactionExportUrl(
        'g1',
        '?page=2&limit=50&view=table&search=alice'
      )
    ).toBe('/api/guilds/g1/export/transactions?search=alice')
  })

  it('buildTransactionExportUrl accepts search without leading ?', () => {
    expect(buildTransactionExportUrl('g1', 'type=bet')).toBe(
      '/api/guilds/g1/export/transactions?type=bet'
    )
  })

  it('buildTransactionExportUrl omits query when empty after strip', () => {
    expect(buildTransactionExportUrl('g1', '?page=1&limit=10')).toBe(
      '/api/guilds/g1/export/transactions'
    )
  })

  it('buildStaffActionsExportUrl strips page and limit', () => {
    expect(
      buildStaffActionsExportUrl('g1', '?page=1&limit=20&staffId=s1')
    ).toBe('/api/guilds/g1/export/staff-actions?staffId=s1')
  })

  it('buildStaffActionsExportUrl accepts search without leading ?', () => {
    expect(buildStaffActionsExportUrl('g1', 'staffId=s1')).toBe(
      '/api/guilds/g1/export/staff-actions?staffId=s1'
    )
  })

  it('buildStaffActionsExportUrl omits query when empty after strip', () => {
    expect(buildStaffActionsExportUrl('g1', '?page=1&limit=10')).toBe(
      '/api/guilds/g1/export/staff-actions'
    )
  })

  it('buildReportExportUrl encodes kind and dates', () => {
    expect(
      buildReportExportUrl('g1', 'pnl-by-source', '2026-01-01', '2026-01-31')
    ).toBe(
      '/api/guilds/g1/export/pnl-by-source?dateFrom=2026-01-01&dateTo=2026-01-31'
    )
  })
})

describe('exportResponse', () => {
  it('csvAttachmentResponse sets csv headers and default status', async () => {
    const res = csvAttachmentResponse('out.csv', 'a,b\n')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(res.headers.get('Content-Disposition')).toBe(
      'attachment; filename="out.csv"'
    )
    expect(await res.text()).toBe('a,b\n')
  })

  it('csvAttachmentResponse allows custom status', () => {
    expect(csvAttachmentResponse('out.csv', 'x', 201).status).toBe(201)
  })

  it('exportErrorResponse returns plain text error', async () => {
    const res = exportErrorResponse('Nope', 413)
    expect(res.status).toBe(413)
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(await res.text()).toBe('Nope')
  })
})
