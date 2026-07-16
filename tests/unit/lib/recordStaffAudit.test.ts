import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import Transaction from '@/models/Transaction'

vi.unmock('@/lib/staffAudit/recordStaffAudit')

vi.mock('@/models/Transaction', () => ({
  default: {
    create: vi.fn()
  }
}))

describe('recordStaffAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates zero-amount vip audit transaction', async () => {
    vi.mocked(Transaction.create).mockResolvedValue({} as never)

    await recordStaffAudit({
      guildId: 'guild-1',
      userId: 'user-1',
      handledBy: 'staff-1',
      adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_CREATE,
      notes: 'important'
    })

    expect(Transaction.create).toHaveBeenCalledWith({
      userId: 'user-1',
      guildId: 'guild-1',
      amount: 0,
      type: 'vip',
      source: 'web',
      handledBy: 'staff-1',
      meta: {
        adminAction: STAFF_ADMIN_ACTIONS.USER_NOTE_CREATE,
        notes: 'important'
      }
    })
  })

  it('creates audit transaction without notes', async () => {
    vi.mocked(Transaction.create).mockResolvedValue({} as never)

    await recordStaffAudit({
      guildId: 'guild-1',
      userId: 'user-1',
      handledBy: 'staff-1',
      adminAction: STAFF_ADMIN_ACTIONS.USER_BAN
    })

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: { adminAction: STAFF_ADMIN_ACTIONS.USER_BAN }
      })
    )
  })
})
