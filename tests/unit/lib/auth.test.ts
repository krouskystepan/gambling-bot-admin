import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authOptions } from '@/lib/auth/authOptions'
import {
  getAuthToken,
  getAuthTokenFromRequest,
  isValidAuthToken
} from '@/lib/auth/authToken'
import {
  getSessionOrNull,
  requireSession,
  safeCallbackUrl
} from '@/lib/auth/requireSession'
import {
  PRESENTATION_HEADER,
  PRESENTATION_USER_ID
} from '@/lib/presentation/constants'

const { getToken, redirect, getServerSession, headers } = vi.hoisted(() => ({
  getToken: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  getServerSession: vi.fn(),
  headers: vi.fn().mockResolvedValue(new Headers())
}))

vi.mock('next-auth/jwt', () => ({ getToken }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn() }),
  headers
}))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('next-auth/providers/discord', () => ({
  default: vi.fn((config: unknown) => config)
}))

describe('authToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    headers.mockResolvedValue(new Headers())
    process.env.NEXTAUTH_SECRET = 'secret'
    delete process.env.VERCEL
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  it('isValidAuthToken requires access token without error', () => {
    expect(isValidAuthToken({ accessToken: 'x' } as never)).toBe(true)
    expect(isValidAuthToken({ accessToken: 'x', error: 'x' } as never)).toBe(
      false
    )
    expect(isValidAuthToken(null)).toBe(false)
  })

  it('getAuthTokenFromRequest uses secure cookies on https', async () => {
    process.env.NEXTAUTH_URL = 'https://example.com'
    getToken.mockResolvedValue({ accessToken: 'token' })
    const request = { headers: new Headers() } as never

    await expect(getAuthTokenFromRequest(request)).resolves.toEqual({
      accessToken: 'token'
    })
    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({ secureCookie: true })
    )
  })

  it('getAuthToken uses secure cookies when only Vercel is set', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    process.env.VERCEL = '1'
    getToken.mockResolvedValue(null)

    await getAuthToken()
    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({ secureCookie: true })
    )
  })

  it('getAuthToken uses non-secure cookies when NEXTAUTH_URL is unset', async () => {
    delete process.env.NEXTAUTH_URL
    delete process.env.VERCEL
    getToken.mockResolvedValue(null)

    await getAuthToken()
    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({ secureCookie: false })
    )
  })
})

describe('authOptions callbacks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))
  })

  it('jwt callback returns token when expiry is missing', async () => {
    const { authOptions } = await import('@/lib/auth/authOptions')
    const token = await authOptions.callbacks!.jwt!({
      token: { accessToken: 'access' }
    } as never)
    expect(token.accessTokenExpires).toBeGreaterThan(Date.now())
  })

  it('jwt callback stores account fields and extends expired tokens', async () => {
    const initial = await authOptions.callbacks!.jwt!({
      token: { name: 'Old' },
      account: {
        access_token: 'access',
        providerAccountId: 'user-1'
      },
      profile: { name: 'Alice', image: 'pic.png' }
    } as never)

    expect(initial).toMatchObject({
      accessToken: 'access',
      userId: 'user-1',
      name: 'Alice',
      picture: 'pic.png'
    })

    const fresh = await authOptions.callbacks!.jwt!({
      token: {
        accessToken: 'access',
        accessTokenExpires: Date.now() + 60_000
      }
    } as never)
    expect(fresh.accessToken).toBe('access')

    const extended = await authOptions.callbacks!.jwt!({
      token: {
        accessToken: 'access',
        accessTokenExpires: Date.now() - 1
      }
    } as never)
    expect(extended.accessTokenExpires).toBeGreaterThan(Date.now())
  })

  it('session callback handles missing user and non-string picture', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: undefined },
      token: {
        accessToken: null,
        userId: null,
        error: 'RefreshError',
        picture: 123
      }
    } as never)

    expect(session).toMatchObject({
      accessToken: null,
      userId: null,
      error: 'RefreshError'
    })
  })

  it('jwt callback uses token fallbacks when profile is missing', async () => {
    const result = await authOptions.callbacks!.jwt!({
      token: { name: 'Carry', picture: 'keep.png' },
      account: {
        access_token: 'access',
        providerAccountId: 'user-1'
      }
    } as never)

    expect(result).toMatchObject({ name: 'Carry', picture: 'keep.png' })
  })

  it('session callback preserves existing user fields when token omits them', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: { name: 'Fallback', image: 'fallback.png' } },
      token: {}
    } as never)

    expect(session.user).toEqual({
      name: 'Fallback',
      image: 'fallback.png'
    })
  })

  it('session callback prefers token values over user fallbacks', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: { name: 'Fallback', image: 'fallback.png' } },
      token: {
        accessToken: 'access',
        userId: 'user-1',
        name: 'TokenName',
        picture: 'token.png'
      }
    } as never)

    expect(session.user).toEqual({
      name: 'TokenName',
      image: 'token.png'
    })
  })

  it('session callback nulls user fields when token and session lack values', async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: { name: null, image: null } },
      token: { name: null, picture: null }
    } as never)

    expect(session.user).toEqual({
      name: null,
      image: null
    })
  })
})

describe('requireSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    headers.mockResolvedValue(new Headers())
    getToken.mockResolvedValue({ accessToken: 'token' })
  })

  it('safeCallbackUrl rejects unsafe urls', () => {
    expect(safeCallbackUrl('/dashboard/users')).toBe('/dashboard/users')
    expect(safeCallbackUrl('//evil.com')).toBe('/dashboard')
    expect(safeCallbackUrl(undefined)).toBe('/dashboard')
  })

  it('getSessionOrNull returns null for invalid auth', async () => {
    getToken.mockResolvedValue(null)
    await expect(getSessionOrNull()).resolves.toBeNull()
  })

  it('getSessionOrNull returns session when valid', async () => {
    getServerSession.mockResolvedValue({
      accessToken: 'token',
      user: { name: 'Alice' }
    })
    await expect(getSessionOrNull()).resolves.toMatchObject({
      accessToken: 'token'
    })
  })

  it('getSessionOrNull returns null when second session read is invalid', async () => {
    getServerSession
      .mockResolvedValueOnce({ accessToken: 'token', user: { name: 'Alice' } })
      .mockResolvedValueOnce({ accessToken: null, error: 'Expired' })
    await expect(getSessionOrNull()).resolves.toBeNull()
  })

  it('getSessionOrNull returns presentation session when header is set', async () => {
    headers.mockResolvedValue(new Headers({ [PRESENTATION_HEADER]: '1' }))
    await expect(getSessionOrNull()).resolves.toMatchObject({
      userId: PRESENTATION_USER_ID,
      accessToken: 'presentation'
    })
  })

  it('requireSession redirects when token is invalid', async () => {
    getToken.mockResolvedValue(null)
    await expect(requireSession()).rejects.toThrow('REDIRECT:/login')
  })

  it('requireSession returns session when auth is valid', async () => {
    getServerSession.mockResolvedValue({
      accessToken: 'token',
      user: { name: 'Alice' }
    })
    await expect(requireSession()).resolves.toMatchObject({
      accessToken: 'token'
    })
  })

  it('requireSession redirects when second session read is invalid', async () => {
    getServerSession
      .mockResolvedValueOnce({ accessToken: 'token', user: { name: 'Alice' } })
      .mockResolvedValueOnce({ accessToken: null, error: 'Expired' })
    await expect(requireSession()).rejects.toThrow('REDIRECT:/login')
  })

  it('requireSession returns presentation session when header is set', async () => {
    headers.mockResolvedValue(new Headers({ [PRESENTATION_HEADER]: '1' }))
    await expect(requireSession()).resolves.toMatchObject({
      userId: PRESENTATION_USER_ID,
      accessToken: 'presentation'
    })
  })
})
