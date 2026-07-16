import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireGuildAccess } from '@/actions/perms'
import { requireExportAccess } from '@/lib/export/exportAuth'

vi.mock('@/actions/perms', () => ({
  requireGuildAccess: vi.fn()
}))

describe('requireExportAccess', () => {
  beforeEach(() => {
    vi.mocked(requireGuildAccess).mockReset()
  })

  it('maps Unauthorized to 401', async () => {
    vi.mocked(requireGuildAccess).mockResolvedValue({ error: 'Unauthorized' })
    await expect(requireExportAccess('guild-1')).resolves.toEqual({
      error: 'Unauthorized',
      status: 401
    })
  })

  it('maps Rate limited to 429', async () => {
    vi.mocked(requireGuildAccess).mockResolvedValue({
      error: 'Rate limited',
      rateLimited: true
    })
    await expect(requireExportAccess('guild-1')).resolves.toEqual({
      error: 'Rate limited',
      status: 429
    })
  })

  it('maps other access errors to 403', async () => {
    vi.mocked(requireGuildAccess).mockResolvedValue({
      error: 'Insufficient permissions'
    })
    await expect(requireExportAccess('guild-1')).resolves.toEqual({
      error: 'Insufficient permissions',
      status: 403
    })
  })

  it('returns ok when access succeeds', async () => {
    vi.mocked(requireGuildAccess).mockResolvedValue({
      session: {} as never,
      isAdmin: true,
      isManager: true
    })
    await expect(requireExportAccess('guild-1')).resolves.toEqual({ ok: true })
  })
})
