import { describe, expect, it } from 'vitest'

import { isGuildStaffFromRoles } from '@/lib/discord/guildStaff'

describe('isGuildStaffFromRoles', () => {
  it('treats the guild owner as staff', () => {
    expect(
      isGuildStaffFromRoles({
        userId: 'owner-1',
        roles: [],
        managerRoleId: 'manager',
        adminRoleIds: ['admin'],
        ownerId: 'owner-1'
      })
    ).toBe(true)
  })

  it('treats manager role holders as staff', () => {
    expect(
      isGuildStaffFromRoles({
        userId: 'u1',
        roles: ['manager'],
        managerRoleId: 'manager',
        adminRoleIds: [],
        ownerId: 'owner-1'
      })
    ).toBe(true)
  })

  it('treats admin role holders as staff', () => {
    expect(
      isGuildStaffFromRoles({
        userId: 'u1',
        roles: ['admin'],
        managerRoleId: null,
        adminRoleIds: ['admin'],
        ownerId: null
      })
    ).toBe(true)
  })

  it('returns false when no staff signal matches', () => {
    expect(
      isGuildStaffFromRoles({
        userId: 'u1',
        roles: ['member'],
        managerRoleId: 'manager',
        adminRoleIds: ['admin'],
        ownerId: 'owner-1'
      })
    ).toBe(false)
  })
})
