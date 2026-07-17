import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getUserGuilds } from '@/actions/discord/guilds.action'
import { requireSession } from '@/lib/auth/requireSession'
import { connectToDatabase } from '@/lib/db'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import {
  formatGuildMoney,
  formatGuildMoneyCompactSigned,
  formatGuildMoneyExact,
  formatGuildMoneyExactSigned
} from '@/lib/guild/guildMoney'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'
import { canAccessSection } from '@/lib/guild/guildSectionAccess'
import {
  guildDateRangeMatch,
  nowInGuildTimezone,
  userGuildDateRangeMatch
} from '@/lib/guild/guildTimezone'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import { loadUserGuildsResult } from '@/lib/guild/userGuilds'
import { DEMO_GUILD_ID } from '@/lib/presentation/constants'
import GuildConfiguration from '@/models/GuildConfiguration'

vi.unmock('@/lib/guild/revalidateHealth')

const { revalidatePath } = vi.hoisted(() => ({
  revalidatePath: vi.fn()
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/db', () => ({
  connectToDatabase: vi.fn()
}))
vi.mock('@/models/GuildConfiguration', () => ({
  default: {
    findOne: vi.fn()
  }
}))
vi.mock('@/actions/discord/guilds.action', () => ({
  getUserGuilds: vi.fn()
}))
vi.mock('@/lib/auth/requireSession', () => ({
  requireSession: vi.fn()
}))

const settings = { currencySymbol: '$', currencyPlacement: 'prefix' as const }

describe('guildMoney formatters', () => {
  it('formats signed and compact amounts', () => {
    expect(formatGuildMoney(1000, settings)).toContain('1')
    expect(formatGuildMoneyExact(1000, settings)).toContain('1')
    expect(formatGuildMoneyExactSigned(-100, settings)).toContain('-')
    expect(formatGuildMoneyCompactSigned(0, settings)).toContain('0')
    expect(formatGuildMoneyCompactSigned(-1500, settings)).toContain('-')
    expect(formatGuildMoneyCompactSigned(1500, settings)).toContain('1')
  })
})

describe('guildSectionAccess', () => {
  it('gates sections by role', () => {
    expect(
      canAccessSection('dev', { isAdmin: false, isManager: false, isDev: true })
    ).toBe(true)
    expect(
      canAccessSection('global-settings', {
        isAdmin: true,
        isManager: false,
        isDev: false
      })
    ).toBe(true)
    expect(
      canAccessSection('users', {
        isAdmin: false,
        isManager: true,
        isDev: false
      })
    ).toBe(true)
    expect(
      canAccessSection('users', {
        isAdmin: false,
        isManager: false,
        isDev: false
      })
    ).toBe(false)
  })
})

describe('guild timezone helpers', () => {
  it('builds date range matches and now helper', () => {
    const match = guildDateRangeMatch('g1', '2026-01-01', '2026-01-31', 'UTC')
    expect(match.guildId).toBe('g1')
    expect(match.createdAt.$gte).toBeInstanceOf(Date)

    const userMatch = userGuildDateRangeMatch(
      'g1',
      'user-1',
      '2026-01-01',
      '2026-01-31',
      'UTC'
    )
    expect(userMatch.userId).toBe('user-1')
    expect(nowInGuildTimezone('UTC').zoneName).toBe('UTC')
  })
})

describe('revalidateGuildHealth', () => {
  it('revalidates guild layout path', () => {
    revalidateGuildHealth('guild-1')
    expect(revalidatePath).toHaveBeenCalledWith(
      '/dashboard/g/guild-1',
      'layout'
    )
  })
})

describe('guildBasePath', () => {
  it('uses /present for the demo guild and dashboard otherwise', () => {
    expect(guildBasePath(DEMO_GUILD_ID)).toBe('/present')
    expect(guildBasePath('guild-1')).toBe('/dashboard/g/guild-1')
  })
})

describe('getGuildGlobalSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToDatabase).mockResolvedValue(undefined)
  })

  it('normalizes stored settings', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          globalSettings: { currencySymbol: '€' }
        })
      })
    } as never)

    await expect(getGuildGlobalSettings('guild-1')).resolves.toMatchObject({
      currencySymbol: '€'
    })
  })

  it('returns demo settings for the demo guild', async () => {
    await expect(getGuildGlobalSettings(DEMO_GUILD_ID)).resolves.toMatchObject({
      currencySymbol: expect.any(String)
    })
    expect(connectToDatabase).not.toHaveBeenCalled()
  })
})

describe('loadUserGuildsResult', () => {
  beforeEach(() => {
    vi.mocked(requireSession).mockResolvedValue({
      accessToken: 'token'
    } as never)
  })

  it('returns guilds on success', async () => {
    vi.mocked(getUserGuilds).mockResolvedValue([{ id: 'g1' }] as never)
    await expect(loadUserGuildsResult()).resolves.toEqual({
      ok: true,
      guilds: [{ id: 'g1' }]
    })
  })

  it('maps rate limit errors', async () => {
    vi.mocked(getUserGuilds).mockRejectedValue(new Error('DiscordRateLimited'))
    await expect(loadUserGuildsResult()).resolves.toEqual({
      ok: false,
      reason: 'rate-limited'
    })
  })

  it('rethrows unknown errors', async () => {
    vi.mocked(getUserGuilds).mockRejectedValue(new Error('boom'))
    await expect(loadUserGuildsResult()).rejects.toThrow('boom')
  })
})
