import { describe, expect, it } from 'vitest'

import { buildSetupHealth } from '@/lib/overview/setupHealth'

describe('buildSetupHealth', () => {
  it('flags missing required channel and role setup', () => {
    const checks = buildSetupHealth('guild-1', null)
    const byId = Object.fromEntries(checks.map((check) => [check.id, check]))

    expect(byId['atm-actions']?.ok).toBe(false)
    expect(byId['atm-logs']?.ok).toBe(false)
    expect(byId['manager-role']?.ok).toBe(false)
    expect(byId['casino-channels']?.ok).toBe(false)
    expect(byId['vip-owner-role']?.href).toBe(
      '/dashboard/g/guild-1/vip-settings'
    )
  })

  it('marks configured channels and roles as ok', () => {
    const checks = buildSetupHealth('guild-1', {
      guildId: 'guild-1',
      managerRoleId: 'role-1',
      atmChannelIds: { actions: 'a', logs: 'l' },
      casinoChannelIds: ['c1'],
      vipSettings: {
        roleOwnerId: 'owner',
        roleMemberId: 'member',
        categoryId: 'cat'
      }
    } as never)

    expect(
      checks.filter((check) => !check.id.startsWith('rtp-')).every((c) => c.ok)
    ).toBe(true)
  })
})
