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

    expect(checks.filter((check) => !check.warning).every((c) => c.ok)).toBe(
      true
    )
  })

  it('warns when 21+3 pays suitedTrips on a 2-deck shoe', () => {
    const checks = buildSetupHealth('guild-1', {
      guildId: 'guild-1',
      casinoSettings: {
        blackjack: {
          deckCount: 2,
          plusThreeMultipliers: {
            suitedTrips: 101,
            straightFlush: 41,
            threeOfAKind: 31,
            straight: 11,
            flush: 6
          }
        }
      }
    } as never)

    const warning = checks.find(
      (check) => check.id === 'blackjack-plusThree-impossible'
    )
    expect(warning?.ok).toBe(false)
    expect(warning?.warning).toBe(true)
    expect(warning?.href).toBe(
      '/dashboard/g/guild-1/casino-settings?game=blackjack'
    )
    expect(warning?.label).toMatch(/Suited Trips/)
    expect(warning?.label).toMatch(/2 decks/)
    expect(warning?.label).toMatch(/Set that 21\+3 payout to 0/)
  })

  it('does not warn about suitedTrips when that payout is disabled', () => {
    const checks = buildSetupHealth('guild-1', {
      guildId: 'guild-1',
      casinoSettings: {
        blackjack: {
          deckCount: 2,
          plusThreeMultipliers: {
            suitedTrips: 0,
            straightFlush: 41,
            threeOfAKind: 31,
            straight: 11,
            flush: 6
          }
        }
      }
    } as never)

    expect(
      checks.every((check) => check.id !== 'blackjack-plusThree-impossible')
    ).toBe(true)
  })
})
