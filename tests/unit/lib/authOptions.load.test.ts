import { afterEach, describe, expect, it, vi } from 'vitest'

describe('authOptions required env', () => {
  const envBackup = { ...process.env }

  afterEach(() => {
    process.env = { ...envBackup }
    vi.resetModules()
  })

  it('throws when Discord client env vars are missing', async () => {
    vi.resetModules()
    delete process.env.DISCORD_CLIENT_ID
    process.env.DISCORD_CLIENT_SECRET = 'secret'
    process.env.NEXTAUTH_SECRET = 'auth-secret'

    await expect(import('@/lib/auth/authOptions')).rejects.toThrow(
      'Missing env variable: DISCORD_CLIENT_ID'
    )
  })
})
