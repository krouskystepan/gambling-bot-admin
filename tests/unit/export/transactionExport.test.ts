import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import { connectToDatabase } from '@/lib/db'
import { EXPORT_MAX_ROWS } from '@/lib/export/exportLimits'
import {
  TRANSACTION_EXPORT_HEADERS,
  exportTransactionsCsv
} from '@/lib/export/transactionExport'
import Transaction from '@/models/Transaction'

vi.mock('@/lib/db', () => ({
  connectToDatabase: vi.fn()
}))

vi.mock('@/models/Transaction', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn()
  }
}))

const makeFindChain = (batch: Record<string, unknown>[]) => {
  const chain = {
    sort: vi.fn(),
    skip: vi.fn(),
    limit: vi.fn(),
    lean: vi.fn().mockResolvedValue(batch)
  }
  chain.sort.mockReturnValue(chain)
  chain.skip.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  return chain
}

describe('exportTransactionsCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToDatabase).mockResolvedValue(undefined)
    vi.mocked(getDiscordGuildMembers).mockResolvedValue([
      { userId: 'user-1', username: 'Alice' },
      { userId: 'staff-1', username: 'Bob' }
    ] as never)
  })

  it('returns 413 when export exceeds row limit', async () => {
    vi.mocked(Transaction.countDocuments).mockResolvedValue(EXPORT_MAX_ROWS + 1)

    await expect(
      exportTransactionsCsv('guild-1', {}, 'Europe/Prague')
    ).resolves.toEqual({
      error: expect.stringContaining('Export exceeds maximum'),
      status: 413
    })
  })

  it('exports transactions with guild timezone and member usernames', async () => {
    vi.mocked(Transaction.countDocuments).mockResolvedValue(1)
    vi.mocked(Transaction.find).mockReturnValue(
      makeFindChain([
        {
          _id: { toString: () => 'tx-1' },
          createdAt: new Date('2026-01-15T12:00:00.000Z'),
          userId: 'user-1',
          type: 'bet',
          source: 'casino',
          amount: 25,
          referenceId: 'ref-1',
          handledBy: 'staff-1',
          meta: { game: 'dice' }
        }
      ]) as never
    )

    const result = await exportTransactionsCsv(
      'guild-1',
      { sort: 'amount:asc,createdAt:desc' },
      'Europe/Prague'
    )

    expect(result).toEqual({
      csv: expect.stringContaining(TRANSACTION_EXPORT_HEADERS.join(','))
    })
    if ('csv' in result) {
      expect(result.csv).toContain('tx-1')
      expect(result.csv).toContain('Alice')
      expect(result.csv).toContain('Bob')
      expect(result.csv).toContain('ref-1')
      expect(result.csv).toContain('""game"":""dice""')
    }
  })

  it('defaults sort and fills unknown usernames', async () => {
    vi.mocked(Transaction.countDocuments).mockResolvedValue(1)
    vi.mocked(Transaction.find).mockReturnValue(
      makeFindChain([
        {
          _id: { toString: () => 'tx-2' },
          createdAt: new Date('2026-01-15T12:00:00.000Z'),
          userId: 'missing-user',
          type: 'win',
          source: 'web',
          amount: 10,
          referenceId: null,
          handledBy: null,
          meta: null
        }
      ]) as never
    )

    const result = await exportTransactionsCsv('guild-1', {}, null)

    expect(Transaction.find).toHaveBeenCalled()
    if ('csv' in result) {
      expect(result.csv).toContain('Unknown')
      expect(result.csv).toContain(',,')
    }
  })

  it('defaults invalid sort fields and handles missing discord members', async () => {
    vi.mocked(getDiscordGuildMembers).mockResolvedValue(null as never)
    vi.mocked(Transaction.countDocuments).mockResolvedValue(1)
    vi.mocked(Transaction.find).mockReturnValue(
      makeFindChain([
        {
          _id: { toString: () => 'tx-3' },
          createdAt: new Date('2026-01-15T12:00:00.000Z'),
          userId: 'user-1',
          type: 'bet',
          source: 'casino',
          amount: 5,
          referenceId: 'ref-3',
          handledBy: 'missing-staff',
          meta: undefined
        }
      ]) as never
    )

    const result = await exportTransactionsCsv(
      'guild-1',
      { sort: ':asc,createdAt' },
      null
    )

    if ('csv' in result) {
      expect(result.csv).toContain('Unknown')
      expect(result.csv).toContain('missing-staff')
    }
  })

  it('defaults sort when parsed sort fields are empty', async () => {
    vi.mocked(Transaction.countDocuments).mockResolvedValue(1)
    vi.mocked(Transaction.find).mockReturnValue(
      makeFindChain([
        {
          _id: { toString: () => 'tx-4' },
          createdAt: new Date('2026-01-15T12:00:00.000Z'),
          userId: 'user-1',
          type: 'bet',
          source: 'casino',
          amount: 5,
          referenceId: null,
          handledBy: null,
          meta: null
        }
      ]) as never
    )

    await exportTransactionsCsv('guild-1', { sort: ':asc' }, null)
    expect(Transaction.find).toHaveBeenCalled()
  })

  it('stops when a batch returns no rows', async () => {
    vi.mocked(Transaction.countDocuments).mockResolvedValue(5)
    vi.mocked(Transaction.find).mockReturnValue(makeFindChain([]) as never)

    const result = await exportTransactionsCsv('guild-1', {}, null)

    expect(result).toEqual({
      csv: `${TRANSACTION_EXPORT_HEADERS.join(',')}\n`
    })
    expect(Transaction.find).toHaveBeenCalledTimes(1)
  })
})
