import { PermissionFlagsBits } from 'discord-api-types/v10'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hasGuildManageAccess } from '@/lib/discord/discordPermissions'
import {
  discordApiRequest,
  discordBotRequest,
  redirectToLogin
} from '@/lib/discord/discordReq'
import { discordMessageLink } from '@/lib/discord/messageLink'
import {
  VIP_CHANNEL_ACCESS,
  VIP_CHANNEL_READ_ONLY
} from '@/lib/discord/vipChannelPermissions'

const { redirect, axiosRequest, isAxiosError } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  axiosRequest: vi.fn(),
  isAxiosError: vi.fn()
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('axios', () => ({
  default: {
    request: axiosRequest,
    isAxiosError
  }
}))

describe('discord helpers', () => {
  it('discordMessageLink formats channel url', () => {
    expect(discordMessageLink('g', 'c', 'm')).toBe(
      'https://discord.com/channels/g/c/m'
    )
  })

  it('vip channel permission constants include expected bits', () => {
    expect(VIP_CHANNEL_ACCESS).toContain(PermissionFlagsBits.ViewChannel)
    expect(VIP_CHANNEL_READ_ONLY.deny).toContain(
      PermissionFlagsBits.SendMessages
    )
  })

  it('hasGuildManageAccess handles owner, admin, manage guild, and invalid perms', () => {
    expect(hasGuildManageAccess({ owner: true })).toBe(true)
    expect(
      hasGuildManageAccess({
        permissions: PermissionFlagsBits.Administrator
      })
    ).toBe(true)
    expect(
      hasGuildManageAccess({
        permissions: PermissionFlagsBits.ManageGuild
      })
    ).toBe(true)
    expect(hasGuildManageAccess({ permissions: BigInt(0) })).toBe(false)
    expect(hasGuildManageAccess({ permissions: null })).toBe(false)
    expect(hasGuildManageAccess({ permissions: 'not-a-number' })).toBe(false)
  })
})

describe('discordReq', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DISCORD_BOT_TOKEN = 'bot-token'
    isAxiosError.mockReturnValue(false)
  })

  it('redirectToLogin throws redirect', () => {
    expect(() => redirectToLogin()).toThrow('REDIRECT:/login')
  })

  it('discordApiRequest redirects when session is missing', async () => {
    await expect(
      discordApiRequest(null, { url: '/users/@me' })
    ).rejects.toThrow('REDIRECT:/login')
  })

  it('discordApiRequest returns data on success', async () => {
    axiosRequest.mockResolvedValue({ data: { id: '1' } })
    await expect(
      discordApiRequest({ accessToken: 'token' } as never, {
        url: '/users/@me'
      })
    ).resolves.toEqual({ id: '1' })
  })

  it('discordApiRequest rethrows unknown errors', async () => {
    isAxiosError.mockReturnValue(false)
    axiosRequest.mockRejectedValue(new Error('network'))
    await expect(
      discordApiRequest({ accessToken: 'token' } as never, {
        url: '/users/@me'
      })
    ).rejects.toThrow('network')
  })

  it('discordApiRequest redirects on 401 and throws on 429', async () => {
    isAxiosError.mockReturnValue(true)
    axiosRequest.mockRejectedValue({ response: { status: 401 } })
    await expect(
      discordApiRequest({ accessToken: 'token' } as never, {
        url: '/users/@me'
      })
    ).rejects.toThrow('REDIRECT:/api/auth/clear-session')

    axiosRequest.mockRejectedValue({ response: { status: 429 } })
    await expect(
      discordApiRequest({ accessToken: 'token' } as never, {
        url: '/users/@me'
      })
    ).rejects.toThrow('DiscordRateLimited')
  })

  it('discordApiRequest propagates axios errors without a response', async () => {
    isAxiosError.mockReturnValue(true)
    axiosRequest.mockRejectedValue({ response: undefined })
    await expect(
      discordApiRequest({ accessToken: 'token' } as never, {
        url: '/users/@me'
      })
    ).rejects.toEqual({ response: undefined })
  })

  it('discordApiRequest throws on 429 without nested response fields', async () => {
    isAxiosError.mockReturnValue(true)
    axiosRequest.mockRejectedValue({ response: { status: 429 } })
    await expect(
      discordApiRequest({ accessToken: 'token' } as never, {
        url: '/users/@me'
      })
    ).rejects.toThrow('DiscordRateLimited')

    axiosRequest.mockRejectedValue(new Error('no response'))
    isAxiosError.mockReturnValue(true)
    await expect(discordBotRequest({ url: '/guilds' })).rejects.toThrow(
      'no response'
    )
  })

  it('discordBotRequest validates token and handles errors', async () => {
    delete process.env.DISCORD_BOT_TOKEN
    await expect(discordBotRequest({ url: '/guilds' })).rejects.toThrow(
      'DISCORD_BOT_TOKEN missing'
    )

    process.env.DISCORD_BOT_TOKEN = 'bot-token'
    axiosRequest.mockResolvedValue({ data: { ok: true } })
    await expect(discordBotRequest({ url: '/guilds' })).resolves.toEqual({
      ok: true
    })

    isAxiosError.mockReturnValue(true)
    axiosRequest.mockRejectedValue({ response: { status: 401 } })
    await expect(discordBotRequest({ url: '/guilds' })).rejects.toThrow(
      'Invalid Discord bot token'
    )

    axiosRequest.mockRejectedValue({ response: { status: 429 } })
    await expect(discordBotRequest({ url: '/guilds' })).rejects.toThrow(
      'DiscordRateLimited'
    )

    isAxiosError.mockReturnValue(false)
    axiosRequest.mockRejectedValue(new Error('network'))
    await expect(discordBotRequest({ url: '/guilds' })).rejects.toThrow(
      'network'
    )
  })
})
