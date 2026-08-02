import { describe, expect, it } from 'vitest'

import { mapUserBanRecord } from '@/lib/moderation/mapUserBanRecord'

describe('mapUserBanRecord', () => {
  const resolveUsername = (id: string | null | undefined) => {
    if (id === 'staff-1') return 'nova'
    if (id === 'staff-2') return 'kaito'
    return undefined
  }

  it('maps an active ban and resolves the banner username', () => {
    const bannedAt = new Date('2026-01-15T12:00:00.000Z')

    expect(
      mapUserBanRecord(
        {
          banId: 'ban-1',
          bannedAt,
          bannedBy: 'staff-1',
          banReason: 'Abuse',
          unbannedAt: null,
          unbannedBy: null
        },
        resolveUsername
      )
    ).toEqual({
      banId: 'ban-1',
      bannedAt,
      bannedBy: 'staff-1',
      bannedByUsername: 'nova',
      banReason: 'Abuse',
      unbannedAt: null,
      unbannedBy: null,
      unbannedByUsername: undefined,
      unbanReason: undefined
    })
  })

  it('maps an ended ban and normalizes nullish reason fields', () => {
    const bannedAt = new Date('2026-01-01T08:00:00.000Z')
    const unbannedAt = new Date('2026-01-10T09:00:00.000Z')

    expect(
      mapUserBanRecord(
        {
          banId: 'ban-2',
          bannedAt,
          bannedBy: 'staff-1',
          banReason: null,
          unbannedAt,
          unbannedBy: 'staff-2',
          unbanReason: null
        },
        resolveUsername
      )
    ).toEqual({
      banId: 'ban-2',
      bannedAt,
      bannedBy: 'staff-1',
      bannedByUsername: 'nova',
      banReason: undefined,
      unbannedAt,
      unbannedBy: 'staff-2',
      unbannedByUsername: 'kaito',
      unbanReason: undefined
    })
  })
})
