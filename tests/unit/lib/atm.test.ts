import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ATM_ACTIONS_DEPOSIT_TITLE,
  ATM_ACTIONS_WITHDRAW_TITLE,
  atmActionsDepositDescription,
  atmActionsWithdrawDescription,
  atmApprovedDepositDescription,
  atmApprovedWithdrawDescription,
  atmRejectedDescription
} from '@/lib/atm/atmUserFacingCopy'
import { getAtmQueueSnapshot } from '@/lib/atmQueue/getAtmQueueSnapshot'
import { connectToDatabase } from '@/lib/db'
import AtmRequest from '@/models/AtmRequest'

vi.mock('@/lib/db', () => ({
  connectToDatabase: vi.fn()
}))

vi.mock('@/models/AtmRequest', () => ({
  default: {
    aggregate: vi.fn()
  }
}))

describe('atmUserFacingCopy', () => {
  it('renders user-facing ATM copy', () => {
    expect(ATM_ACTIONS_DEPOSIT_TITLE).toBe('ATM - Deposit')
    expect(ATM_ACTIONS_WITHDRAW_TITLE).toBe('ATM - Withdrawal')
    expect(atmActionsDepositDescription('$10', 'u1', '$100')).toContain('<@u1>')
    expect(atmActionsWithdrawDescription('$5', 'u1', '$95')).toContain('$5')
    expect(atmApprovedDepositDescription('$10')).toContain('$10')
    expect(atmApprovedWithdrawDescription('$5')).toContain('$5')
    expect(atmRejectedDescription('Deposit', '$10')).toContain('rejected')
  })
})

describe('getAtmQueueSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToDatabase).mockResolvedValue(undefined)
  })

  it('maps aggregate stats into revision string', async () => {
    vi.mocked(AtmRequest.aggregate).mockResolvedValue([
      {
        total: 4,
        pending: 2,
        latestUpdatedAt: new Date('2026-01-15T12:00:00.000Z')
      }
    ])

    await expect(getAtmQueueSnapshot('guild-1')).resolves.toEqual({
      revision: '2:4:2026-01-15T12:00:00.000Z',
      pending: 2,
      total: 4,
      latestUpdatedAt: '2026-01-15T12:00:00.000Z'
    })
  })

  it('defaults empty stats', async () => {
    vi.mocked(AtmRequest.aggregate).mockResolvedValue([])

    await expect(getAtmQueueSnapshot('guild-1')).resolves.toEqual({
      revision: '0:0:',
      pending: 0,
      total: 0,
      latestUpdatedAt: null
    })
  })
})
