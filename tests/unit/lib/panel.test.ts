import { beforeEach, describe, expect, it, vi } from 'vitest'

import { connectToDatabase } from '@/lib/db'
import {
  blockPanelFeatureAction,
  blockPanelMaintenanceAction
} from '@/lib/panel/panelFeatureActionGuard.server'
import {
  PANEL_FEATURE_DISABLED_MESSAGES,
  getPanelFeatureBlockMessage,
  isPanelFeatureBlocking,
  isPanelMaintenanceBlocking
} from '@/lib/panel/panelGlobalFeatureGuard'
import GuildConfiguration from '@/models/GuildConfiguration'

vi.unmock('@/lib/panel/panelFeatureActionGuard.server')

vi.mock('@/lib/db', () => ({
  connectToDatabase: vi.fn()
}))
vi.mock('@/models/GuildConfiguration', () => ({
  default: {
    findOne: vi.fn()
  }
}))

const disabledSettings = {
  disableDeposits: true
}

describe('panelGlobalFeatureGuard', () => {
  it('returns maintenance and feature messages', () => {
    expect(PANEL_FEATURE_DISABLED_MESSAGES.deposit).toContain('Deposits')
    expect(isPanelMaintenanceBlocking({ maintenanceMode: true }, false)).toBe(
      true
    )
    expect(isPanelMaintenanceBlocking({ maintenanceMode: true }, true)).toBe(
      false
    )
    expect(
      isPanelFeatureBlocking({ maintenanceMode: true }, 'deposit', false)
    ).toBe(true)
    expect(isPanelFeatureBlocking(disabledSettings, 'deposit', true)).toBe(true)
    expect(
      isPanelFeatureBlocking({ maintenanceMode: true }, 'deposit', true)
    ).toBe(false)
    expect(
      getPanelFeatureBlockMessage({ maintenanceMode: true }, 'deposit', false)
    ).toBe(PANEL_FEATURE_DISABLED_MESSAGES.maintenance)
    expect(
      getPanelFeatureBlockMessage(disabledSettings, 'deposit', false)
    ).toBe(PANEL_FEATURE_DISABLED_MESSAGES.deposit)
    expect(getPanelFeatureBlockMessage(null, 'deposit', false)).toBeNull()
    expect(
      isPanelFeatureBlocking({ maintenanceMode: false }, 'deposit', false)
    ).toBe(false)
    expect(isPanelFeatureBlocking(undefined, 'deposit', false)).toBe(false)
  })
})

describe('panelFeatureActionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToDatabase).mockResolvedValue(undefined)
  })

  it('blockPanelFeatureAction returns message when feature disabled', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          globalSettings: { disableDeposits: true }
        })
      })
    } as never)

    await expect(
      blockPanelFeatureAction('guild-1', 'deposit', {
        session: {} as never,
        isAdmin: false,
        isManager: true
      })
    ).resolves.toEqual({
      success: false,
      message: PANEL_FEATURE_DISABLED_MESSAGES.deposit
    })
  })

  it('blockPanelFeatureAction returns null when allowed', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ globalSettings: {} })
      })
    } as never)

    await expect(
      blockPanelFeatureAction('guild-1', 'deposit', {
        session: {} as never,
        isAdmin: true,
        isManager: true
      })
    ).resolves.toBeNull()
  })

  it('blockPanelMaintenanceAction blocks non-admin managers', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          globalSettings: { maintenanceMode: true }
        })
      })
    } as never)

    await expect(
      blockPanelMaintenanceAction('guild-1', {
        session: {} as never,
        isAdmin: false,
        isManager: true
      })
    ).resolves.toEqual({
      success: false,
      message: PANEL_FEATURE_DISABLED_MESSAGES.maintenance
    })
  })

  it('blockPanelMaintenanceAction returns null when maintenance is off', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ globalSettings: {} })
      })
    } as never)

    await expect(
      blockPanelMaintenanceAction('guild-1', {
        session: {} as never,
        isAdmin: false,
        isManager: true
      })
    ).resolves.toBeNull()
  })
})
