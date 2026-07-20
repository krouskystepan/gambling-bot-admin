import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recordSettingsChange } from '@/lib/settingsAudit/recordSettingsChange'
import SettingsChangeLog from '@/models/SettingsChangeLog'

vi.unmock('@/lib/settingsAudit/recordSettingsChange')

vi.mock('@/models/SettingsChangeLog', () => ({
  default: {
    create: vi.fn()
  }
}))

describe('recordSettingsChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips create when before and after are equal', async () => {
    const result = await recordSettingsChange({
      guildId: 'guild-1',
      changedBy: 'staff-1',
      section: 'global',
      before: { currency: 'CZK' },
      after: { currency: 'CZK' }
    })

    expect(result).toBeNull()
    expect(SettingsChangeLog.create).not.toHaveBeenCalled()
  })

  it('creates expected doc shape with changedPaths', async () => {
    vi.mocked(SettingsChangeLog.create).mockResolvedValue({} as never)

    await recordSettingsChange({
      guildId: 'guild-1',
      changedBy: 'staff-1',
      section: 'casino',
      before: { rtp: 0.96, nested: { a: 1 } },
      after: { rtp: 0.97, nested: { a: 1 } }
    })

    expect(SettingsChangeLog.create).toHaveBeenCalledWith({
      guildId: 'guild-1',
      changedBy: 'staff-1',
      section: 'casino',
      before: { rtp: 0.96, nested: { a: 1 } },
      after: { rtp: 0.97, nested: { a: 1 } },
      changedPaths: ['rtp']
    })
  })

  it('treats undefined before as null on first write', async () => {
    vi.mocked(SettingsChangeLog.create).mockResolvedValue({} as never)

    await recordSettingsChange({
      guildId: 'guild-1',
      changedBy: 'staff-1',
      section: 'vip',
      before: undefined,
      after: { maxMembers: 5 }
    })

    expect(SettingsChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        before: null,
        after: { maxMembers: 5 },
        changedPaths: ['maxMembers']
      })
    )
  })
})
