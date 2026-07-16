import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import { describe, expect, it } from 'vitest'

import {
  resolveStaffActionDetailHref,
  resolveStaffActionLabel
} from '@/lib/staffAudit/staffActionLabels'
import {
  buildAtmRejectionMatch,
  buildStaffTransactionMatch,
  buildUserBanStaffActionUnionStages,
  emptyStaffActionCategoryCounts,
  shouldIncludeAtmRejectionUnion,
  shouldIncludeBanUnion,
  shouldIncludeUnbanUnion
} from '@/lib/staffAudit/staffActionQuery'
import {
  enrichStaffActionRows,
  mapStaffActionRows
} from '@/lib/staffAudit/staffActionRows'

describe('staffActionLabels', () => {
  it('resolves labels for major admin actions', () => {
    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.ATM_REJECT }
      })
    ).toMatchObject({ label: 'ATM rejected', category: 'atm' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.RAFFLE_CANCEL }
      })
    ).toMatchObject({ label: 'Raffle canceled', category: 'raffle' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_PAYOUT }
      })
    ).toMatchObject({ label: 'Prediction paid out', category: 'prediction' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_END }
      })
    ).toMatchObject({ label: 'Prediction ended', category: 'prediction' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_CANCEL }
      })
    ).toMatchObject({ label: 'Prediction canceled', category: 'prediction' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_RESET_PAYOUT }
      })
    ).toMatchObject({
      label: 'Prediction payout reset',
      category: 'prediction'
    })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.VIP_EXTEND }
      })
    ).toMatchObject({ label: 'VIP extended', category: 'vip' })

    expect(
      resolveStaffActionLabel({
        type: 'withdraw',
        meta: { requestId: 'req-2' }
      })
    ).toMatchObject({ label: 'ATM withdraw approved', badge: 'WITHDRAW' })

    expect(
      resolveStaffActionLabel({ type: 'deposit', sourceType: 'atmRequest' })
    ).toMatchObject({ label: 'ATM rejected' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.VIP_REMOVE }
      })
    ).toMatchObject({ label: 'VIP removed' })

    expect(
      resolveStaffActionLabel({ type: undefined, source: undefined })
    ).toMatchObject({ label: 'Staff action' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.BLACKJACK_FORCE_CLOSE }
      })
    ).toMatchObject({ label: 'Blackjack force closed' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_BAN }
      })
    ).toMatchObject({ label: 'Player banned', category: 'ban' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_UNBAN }
      })
    ).toMatchObject({ label: 'Player unbanned', category: 'unban' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_CREATE }
      })
    ).toMatchObject({ label: 'Staff note added', category: 'user' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_UPDATE }
      })
    ).toMatchObject({ label: 'Staff note updated' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_DELETE }
      })
    ).toMatchObject({ label: 'Staff note deleted' })

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.VIP_BUY }
      })
    ).toMatchObject({ label: 'VIP created', category: 'vip' })

    expect(
      resolveStaffActionLabel({
        type: 'deposit',
        meta: { requestId: 'req-1' }
      })
    ).toMatchObject({ label: 'ATM deposit approved', category: 'atm' })

    expect(resolveStaffActionLabel({ type: 'deposit' })).toMatchObject({
      label: 'Deposit',
      category: 'balance'
    })
    expect(resolveStaffActionLabel({ type: 'withdraw' })).toMatchObject({
      label: 'Withdrawal'
    })
    expect(resolveStaffActionLabel({ type: 'bonus' })).toMatchObject({
      label: 'Bonus'
    })
    expect(
      resolveStaffActionLabel({ meta: { adminAction: 'custom-action' } })
    ).toMatchObject({ label: 'custom-action' })
  })

  it('resolves detail hrefs for supported actions', () => {
    expect(
      resolveStaffActionDetailHref('guild-1', {
        subjectUserId: 'user-1',
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_UNBAN }
      })
    ).toBe('/dashboard/g/guild-1/users/user-1')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        meta: { adminAction: STAFF_ADMIN_ACTIONS.ATM_REJECT },
        referenceId: 'req-9'
      })
    ).toBe('/dashboard/g/guild-1/transactions?referenceId=req-9')

    expect(
      resolveStaffActionLabel({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.VIP_ADD_MEMBER }
      })
    ).toMatchObject({ sublabel: 'Member added' })

    expect(
      resolveStaffActionDetailHref('guild-1', {
        meta: { predictionId: 'pred-only' }
      })
    ).toBe('/dashboard/g/guild-1/predictions?search=pred-only')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        type: 'deposit',
        referenceId: 'req-3'
      })
    ).toBe('/dashboard/g/guild-1/transactions?referenceId=req-3')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        subjectUserId: 'user-1',
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_UPDATE }
      })
    ).toBe('/dashboard/g/guild-1/users/user-1')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        meta: { drawId: 'draw-1', predictionId: 'pred-1' }
      })
    ).toBe('/dashboard/g/guild-1/raffles?search=draw-1')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        meta: { predictionId: 'pred-1' }
      })
    ).toBe('/dashboard/g/guild-1/predictions?search=pred-1')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        subjectUserId: 'user-1',
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_DELETE }
      })
    ).toBe('/dashboard/g/guild-1/users/user-1')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        type: 'withdraw',
        referenceId: 'req-4'
      })
    ).toBe('/dashboard/g/guild-1/transactions?referenceId=req-4')

    expect(
      resolveStaffActionDetailHref('guild-1', {
        sourceType: 'atmRequest',
        referenceId: 'req-5'
      })
    ).toBe('/dashboard/g/guild-1/transactions?referenceId=req-5')

    expect(resolveStaffActionDetailHref('guild-1', {})).toBeUndefined()
  })
})

describe('staffActionQuery', () => {
  it('union inclusion helpers default to true', () => {
    expect(shouldIncludeAtmRejectionUnion()).toBe(true)
    expect(shouldIncludeBanUnion(['ban'])).toBe(true)
    expect(shouldIncludeUnbanUnion()).toBe(true)
    expect(shouldIncludeUnbanUnion(['balance'])).toBe(false)
  })

  it('buildStaffTransactionMatch applies filters and categories', () => {
    const match = buildStaffTransactionMatch(
      'guild-1',
      {
        staffId: 'staff-1',
        search: 'alice',
        filterAction: ['balance', 'atm'],
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31'
      },
      'UTC'
    )

    expect(match.$and).toEqual(
      expect.arrayContaining([
        { guildId: 'guild-1' },
        { handledBy: 'staff-1' },
        expect.objectContaining({ userId: expect.any(RegExp) }),
        expect.objectContaining({ createdAt: expect.any(Object) }),
        expect.objectContaining({ $or: expect.any(Array) })
      ])
    )
  })

  it('union inclusion helpers respect explicit filters', () => {
    expect(shouldIncludeAtmRejectionUnion(['balance'])).toBe(false)
    expect(shouldIncludeAtmRejectionUnion(undefined)).toBe(true)
    expect(shouldIncludeBanUnion()).toBe(true)
    expect(shouldIncludeUnbanUnion(['balance'])).toBe(false)
    expect(shouldIncludeUnbanUnion(['unban'])).toBe(true)
  })

  it('buildAtmRejectionMatch applies date filters', () => {
    const match = buildAtmRejectionMatch(
      'guild-1',
      { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
      'UTC'
    )
    expect(match.$and).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ handledAt: expect.any(Object) })
      ])
    )
  })

  it('buildStaffTransactionMatch covers each action category', () => {
    for (const category of [
      'balance',
      'atm',
      'vip',
      'raffle',
      'prediction',
      'ban',
      'unban',
      'user'
    ] as const) {
      const match = buildStaffTransactionMatch('guild-1', {
        filterAction: [category]
      })
      expect(match.$and).toEqual(
        expect.arrayContaining([{ $or: expect.any(Array) }])
      )
    }
  })

  it('buildAtmRejectionMatch supports staff and search filters', () => {
    const match = buildAtmRejectionMatch(
      'guild-1',
      { staffId: 'staff-1', search: 'bob' },
      'UTC'
    )
    expect(match.$and).toEqual(
      expect.arrayContaining([
        { guildId: 'guild-1' },
        { status: 'rejected' },
        { handledBy: 'staff-1' },
        expect.objectContaining({ userId: expect.any(RegExp) })
      ])
    )
  })

  it('buildUserBanStaffActionUnionStages uses single-filter ban match', () => {
    const stages = buildUserBanStaffActionUnionStages(
      'guild-1',
      {},
      null,
      'userbans',
      { includeBan: true, includeUnban: false }
    )
    expect(
      (
        stages[0] as {
          $unionWith: { pipeline: Array<{ $match: Record<string, unknown> }> }
        }
      ).$unionWith.pipeline[0].$match
    ).toEqual({
      guildId: 'guild-1'
    })
  })

  it('buildUserBanStaffActionUnionStages can include only unban union', () => {
    const stages = buildUserBanStaffActionUnionStages(
      'guild-1',
      {},
      null,
      'userbans',
      { includeBan: false, includeUnban: true }
    )
    expect(stages).toHaveLength(1)
  })

  it('buildStaffTransactionMatch works without category filters', () => {
    const match = buildStaffTransactionMatch('guild-1', { staffId: 'staff-1' })
    expect(match.$and).toEqual(
      expect.arrayContaining([{ guildId: 'guild-1' }, { handledBy: 'staff-1' }])
    )
  })

  it('buildUserBanStaffActionUnionStages collapses single-filter ban match', () => {
    const stages = buildUserBanStaffActionUnionStages(
      'guild-1',
      {},
      null,
      'userbans',
      { includeBan: true, includeUnban: false }
    )
    expect(stages[0]).toHaveProperty('$unionWith')
  })

  it('buildAtmRejectionMatch supports minimal guild filter', () => {
    expect(buildAtmRejectionMatch('guild-1', {}, null)).toEqual({
      $and: [
        { guildId: 'guild-1' },
        { status: 'rejected' },
        { handledBy: { $exists: true, $ne: null } }
      ]
    })
  })

  it('buildUserBanStaffActionUnionStages handles search filters', () => {
    const stages = buildUserBanStaffActionUnionStages(
      'guild-1',
      { search: 'alice' },
      null,
      'userbans',
      { includeBan: true, includeUnban: false }
    )
    expect(stages).toHaveLength(1)
  })

  it('buildUserBanStaffActionUnionStages emits ban and unban unions', () => {
    const stages = buildUserBanStaffActionUnionStages(
      'guild-1',
      { staffId: 'staff-1', dateFrom: '2026-01-01', dateTo: '2026-01-31' },
      'UTC',
      'userbans',
      { includeBan: true, includeUnban: true }
    )

    expect(stages).toHaveLength(2)
    expect(stages[0]).toHaveProperty('$unionWith')
    expect(stages[1]).toHaveProperty('$unionWith')
  })

  it('buildStaffTransactionMatch handles unknown categories via default branch', () => {
    const match = buildStaffTransactionMatch('guild-1', {
      filterAction: ['unknown-category' as never]
    })
    expect(match.$and).toEqual(expect.arrayContaining([{ $or: [{}] }]))
  })

  it('emptyStaffActionCategoryCounts zeroes all categories', () => {
    expect(emptyStaffActionCategoryCounts()).toMatchObject({
      balance: 0,
      atm: 0,
      vip: 0
    })
  })
})

describe('staffActionRows', () => {
  const rawRow = {
    id: 'row-1',
    occurredAt: new Date('2026-01-15T12:00:00.000Z'),
    actorId: 'staff-1',
    subjectUserId: 'user-1',
    amount: 10,
    notes: undefined,
    meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_CREATE },
    txType: 'vip',
    txSource: 'web',
    sourceType: 'transaction' as const
  }

  it('enrichStaffActionRows maps username-only discord data', () => {
    const rows = enrichStaffActionRows(
      'guild-1',
      [rawRow],
      new Map([
        ['staff-1', 'Staff'],
        ['user-1', 'User']
      ])
    )

    expect(rows[0]).toMatchObject({
      actorUsername: 'Staff',
      subjectUsername: 'User',
      actionLabel: 'Staff note added',
      detailHref: '/dashboard/g/guild-1/users/user-1'
    })
  })

  it('mapStaffActionRows preserves string notes', () => {
    const rows = mapStaffActionRows(
      'guild-1',
      [{ ...rawRow, notes: 'kept' }],
      new Map()
    )
    expect(rows[0].notes).toBe('kept')
  })

  it('mapStaffActionRows preserves nickname and avatar data', () => {
    const rows = mapStaffActionRows(
      'guild-1',
      [rawRow],
      new Map([
        ['staff-1', { username: 'Staff', nickname: 'S', avatar: '/staff.png' }],
        ['user-1', { username: 'User', nickname: null, avatar: '/user.png' }]
      ])
    )

    expect(rows[0]).toMatchObject({
      actorAvatar: '/staff.png',
      subjectAvatar: '/user.png',
      subjectNickname: null,
      notes: null
    })
  })

  it('mapStaffActionRows defaults missing amount to null', () => {
    const { amount: _amount, ...rowWithoutAmount } = rawRow
    const rows = mapStaffActionRows('guild-1', [rowWithoutAmount], new Map())
    expect(rows[0].amount).toBeNull()
  })

  it('enrichStaffActionRows defaults unknown users', () => {
    const rows = enrichStaffActionRows('guild-1', [rawRow], new Map())
    expect(rows[0]).toMatchObject({
      actorUsername: 'Unknown',
      subjectUsername: 'Unknown'
    })
  })
})
