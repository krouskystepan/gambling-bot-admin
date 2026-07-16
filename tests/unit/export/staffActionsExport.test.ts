import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchStaffActionsForExport } from '@/actions/database/staffActions.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { connectToDatabase } from '@/lib/db'
import { EXPORT_MAX_ROWS } from '@/lib/export/exportLimits'
import {
  STAFF_ACTIONS_EXPORT_HEADERS,
  exportStaffActionsCsv,
  parseStaffActionsExportParams
} from '@/lib/export/staffActionsExport'
import { enrichStaffActionRows } from '@/lib/staffAudit/staffActionRows'

vi.mock('@/lib/db', () => ({
  connectToDatabase: vi.fn()
}))

vi.mock('@/actions/database/staffActions.action', () => ({
  fetchStaffActionsForExport: vi.fn()
}))

vi.mock('@/lib/staffAudit/staffActionRows', () => ({
  enrichStaffActionRows: vi.fn()
}))

describe('parseStaffActionsExportParams', () => {
  it('returns undefined filters when params are missing', () => {
    expect(parseStaffActionsExportParams(new URLSearchParams())).toEqual({
      search: undefined,
      staffId: undefined,
      filterAction: undefined,
      dateFrom: undefined,
      dateTo: undefined
    })
  })

  it('parses valid filterAction categories and ignores invalid values', () => {
    const params = new URLSearchParams({
      search: 'alice',
      staffId: 'staff-1',
      filterAction: 'atm,ban,invalid',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31'
    })

    expect(parseStaffActionsExportParams(params)).toEqual({
      search: 'alice',
      staffId: 'staff-1',
      filterAction: ['atm', 'ban'],
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31'
    })
  })
})

describe('exportStaffActionsCsv', () => {
  const actionRow = {
    id: 'row-1',
    occurredAt: new Date('2026-01-15T12:00:00.000Z'),
    actorId: 'staff-1',
    actorUsername: null,
    subjectUserId: 'user-1',
    subjectUsername: 'Alice',
    actionLabel: 'ATM approve',
    category: 'atm',
    amount: 50,
    notes: null,
    meta: { requestId: 'req-1', adminAction: 'approve' },
    sourceType: 'atmRequest' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToDatabase).mockResolvedValue(undefined)
    vi.mocked(getDiscordGuildMembers).mockResolvedValue([
      { userId: 'staff-1', username: 'Bob' }
    ] as never)
    vi.mocked(enrichStaffActionRows).mockImplementation(
      (_guildId, rows) =>
        rows.map((row) => ({
          ...row,
          actorUsername: 'Bob',
          actionLabel: 'ATM approve'
        })) as never
    )
  })

  it('returns 413 when export exceeds row limit', async () => {
    vi.mocked(fetchStaffActionsForExport).mockResolvedValue({
      total: EXPORT_MAX_ROWS + 1,
      rows: []
    })

    await expect(
      exportStaffActionsCsv('guild-1', {}, 'Europe/Prague')
    ).resolves.toEqual({
      error: expect.stringContaining('Export exceeds maximum'),
      status: 413
    })
  })

  it('exports enriched staff actions in guild timezone', async () => {
    vi.mocked(fetchStaffActionsForExport)
      .mockResolvedValueOnce({ total: 1, rows: [actionRow] })
      .mockResolvedValueOnce({ total: 1, rows: [actionRow] })

    const result = await exportStaffActionsCsv(
      'guild-1',
      { staffId: 'staff-1' },
      'Europe/Prague'
    )

    expect(result).toEqual({
      csv: expect.stringContaining(STAFF_ACTIONS_EXPORT_HEADERS.join(','))
    })
    if ('csv' in result) {
      expect(result.csv).toContain('staff-1')
      expect(result.csv).toContain('Bob')
      expect(result.csv).toContain('ATM approve')
      expect(result.csv).toContain('req-1')
      expect(result.csv).toContain('approve')
    }
  })

  it('exports rows with defaults for missing enrichment fields', async () => {
    vi.mocked(getDiscordGuildMembers).mockResolvedValue(null as never)
    vi.mocked(enrichStaffActionRows).mockReturnValue([
      {
        occurredAt: actionRow.occurredAt,
        actorId: 'staff-1',
        actorUsername: null,
        subjectUserId: 'user-1',
        subjectUsername: null,
        actionLabel: 'Action',
        category: 'balance',
        amount: null,
        notes: null,
        meta: null
      }
    ] as never)
    vi.mocked(fetchStaffActionsForExport)
      .mockResolvedValueOnce({ total: 1, rows: [actionRow] })
      .mockResolvedValueOnce({ total: 1, rows: [actionRow] })

    const result = await exportStaffActionsCsv('guild-1', {}, null)
    if ('csv' in result) {
      expect(result.csv).toContain('Unknown')
      expect(result.csv).toContain(',0,,,')
    }
  })

  it('stops when a batch returns no rows', async () => {
    vi.mocked(fetchStaffActionsForExport)
      .mockResolvedValueOnce({ total: 2, rows: [] })
      .mockResolvedValueOnce({ total: 2, rows: [] })

    const result = await exportStaffActionsCsv('guild-1', {}, null)

    expect(result).toEqual({
      csv: `${STAFF_ACTIONS_EXPORT_HEADERS.join(',')}\n`
    })
    expect(fetchStaffActionsForExport).toHaveBeenCalledTimes(2)
  })
})
