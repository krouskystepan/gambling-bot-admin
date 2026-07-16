import { describe, expect, it } from 'vitest'

import {
  EXCLUDE_STAFF_AUDIT_TRANSACTION_FILTER,
  LEGACY_CASINO_GAME_KEY,
  buildCasinoGameMetaFilter,
  buildTransactionMatchFilters,
  buildTransactionQuery
} from '@/lib/transactions/transactionFilters'
import { buildTransactionMatch } from '@/lib/transactions/transactionQuery'

describe('transactionFilters', () => {
  it('buildCasinoGameMetaFilter handles legacy and real games', () => {
    expect(buildCasinoGameMetaFilter(['dice', LEGACY_CASINO_GAME_KEY])).toEqual(
      {
        $or: [
          { 'meta.game': { $in: ['dice'] } },
          { 'meta.game': { $exists: false } },
          { 'meta.game': null }
        ]
      }
    )
    expect(buildCasinoGameMetaFilter([LEGACY_CASINO_GAME_KEY])).toEqual({
      $or: [{ 'meta.game': { $exists: false } }, { 'meta.game': null }]
    })
    expect(buildCasinoGameMetaFilter(['dice'])).toEqual({
      'meta.game': { $in: ['dice'] }
    })
  })

  it('buildTransactionMatchFilters composes user, staff, source, and casino filters', () => {
    const filters = buildTransactionMatchFilters({
      search: 'alice',
      staffId: 'staff-1',
      referenceId: 'ref-1',
      filterType: ['bet'],
      filterSource: ['casino', 'web'],
      filterCasinoGame: ['dice']
    })

    expect(filters).toEqual(
      expect.arrayContaining([
        { userId: expect.any(RegExp) },
        { handledBy: 'staff-1' },
        { referenceId: expect.any(RegExp) },
        { type: { $in: ['bet'] } },
        expect.objectContaining({ $or: expect.any(Array) }),
        EXCLUDE_STAFF_AUDIT_TRANSACTION_FILTER
      ])
    )
  })

  it('buildTransactionQuery wraps filters with guildId', () => {
    expect(buildTransactionQuery('guild-1', [])).toEqual({ guildId: 'guild-1' })
    expect(buildTransactionQuery('guild-1', [{ userId: 'u1' }])).toEqual({
      guildId: 'guild-1',
      $and: [{ userId: 'u1' }]
    })
  })

  it('buildTransactionMatchFilters handles casino-only and mixed source filters', () => {
    const casinoOnly = buildTransactionMatchFilters({
      filterSource: ['casino'],
      filterCasinoGame: ['dice']
    })
    expect(casinoOnly).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'casino' }),
        EXCLUDE_STAFF_AUDIT_TRANSACTION_FILTER
      ])
    )

    const sourceOnly = buildTransactionMatchFilters({
      filterSource: ['web', 'command']
    })
    expect(sourceOnly).toEqual(
      expect.arrayContaining([{ source: { $in: ['web', 'command'] } }])
    )

    const casinoGameWithoutSource = buildTransactionMatchFilters({
      filterCasinoGame: ['dice']
    })
    expect(casinoGameWithoutSource).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'casino',
          'meta.game': { $in: ['dice'] }
        })
      ])
    )
  })
})

describe('transactionQuery', () => {
  it('buildTransactionMatch adds createdAt range when dates are present', () => {
    const match = buildTransactionMatch(
      'guild-1',
      {
        userId: 'user-1',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31'
      },
      'UTC'
    )

    expect(match).toEqual(
      expect.objectContaining({
        guildId: 'guild-1',
        $and: expect.arrayContaining([
          { userId: 'user-1' },
          { createdAt: expect.any(Object) },
          EXCLUDE_STAFF_AUDIT_TRANSACTION_FILTER
        ])
      })
    )
  })

  it('buildTransactionMatch omits createdAt without dates', () => {
    const match = buildTransactionMatch('guild-1', { userId: 'user-1' }, 'UTC')
    const andFilters = (match.$and ?? []) as Record<string, unknown>[]
    expect(andFilters.some((filter) => 'createdAt' in filter)).toBe(false)
  })
})
