import { hasDevAccess } from 'gambling-bot-shared/dev'
import mongoose from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getGuildChannels,
  invalidateGuildChannelsCache
} from '@/actions/discord/channel.action'
import { isBotInGuild } from '@/actions/discord/utils.action'
import { getSessionOrNull } from '@/lib/auth/requireSession'
import { connectToDatabase } from '@/lib/db'
import {
  getDevBotPresence,
  getDevChannelChecks,
  getDevDatabaseStatus,
  getDevEnvStatus,
  getDevFeatureFlags,
  getDevGuildConfig,
  getDevGuildCounts,
  getDevRecentTransactions,
  invalidateDevDiscordCaches
} from '@/lib/dev/devGuildDiagnostics'
import { requireDevAction } from '@/lib/dev/requireDevAction'
import { serializeForDev } from '@/lib/dev/serializeDevJson'
import AtmRequest from '@/models/AtmRequest'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'
import User from '@/models/User'

vi.mock('@/lib/auth/requireSession', () => ({
  getSessionOrNull: vi.fn()
}))
vi.mock('gambling-bot-shared/dev', () => ({
  hasDevAccess: vi.fn()
}))
vi.mock('@/lib/db', () => ({
  connectToDatabase: vi.fn()
}))
vi.mock('@/actions/discord/channel.action', () => ({
  getGuildChannels: vi.fn(),
  invalidateGuildChannelsCache: vi.fn()
}))
vi.mock('@/actions/discord/utils.action', () => ({
  isBotInGuild: vi.fn()
}))
vi.mock('@/models/AtmRequest', () => ({
  default: { countDocuments: vi.fn() }
}))
vi.mock('@/models/BlackjackGame', () => ({
  default: { countDocuments: vi.fn() }
}))
vi.mock('@/models/GuildConfiguration', () => ({
  default: {
    findOne: vi.fn(),
    countDocuments: vi.fn()
  }
}))
vi.mock('@/models/Prediction', () => ({
  default: { countDocuments: vi.fn() }
}))
vi.mock('@/models/Raffle', () => ({
  default: { countDocuments: vi.fn() }
}))
vi.mock('@/models/Transaction', () => ({
  default: {
    countDocuments: vi.fn(),
    find: vi.fn()
  }
}))
vi.mock('@/models/User', () => ({
  default: { countDocuments: vi.fn() }
}))
vi.mock('@/models/VipRoom', () => ({
  default: { countDocuments: vi.fn() }
}))

function patchMongooseConnection(
  patch: Partial<{
    readyState: number
    host: string
    name: string
    db: unknown
  }>
) {
  Object.assign(
    mongoose.connection as {
      readyState: number
      host: string
      name: string
      db: unknown
    },
    patch
  )
}

describe('serializeForDev', () => {
  it('serializes ids, dates, arrays, and objects', () => {
    const id = new mongoose.Types.ObjectId()
    const date = new Date('2026-01-15T12:00:00.000Z')

    expect(serializeForDev(id)).toBe(id.toString())
    expect(serializeForDev(date)).toBe(date.toISOString())
    expect(serializeForDev([id])).toEqual([id.toString()])
    expect(serializeForDev({ nested: { when: date } })).toEqual({
      nested: { when: date.toISOString() }
    })
    expect(serializeForDev('plain')).toBe('plain')
  })
})

describe('requireDevAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns forbidden without dev access', async () => {
    vi.mocked(getSessionOrNull).mockResolvedValue(null)
    await expect(requireDevAction('guild-1')).resolves.toEqual({
      ok: false,
      error: 'Forbidden'
    })
  })

  it('returns access when session and dev access are valid', async () => {
    vi.mocked(getSessionOrNull).mockResolvedValue({
      userId: 'dev-1',
      accessToken: 'token'
    } as never)
    vi.mocked(hasDevAccess).mockReturnValue(true)

    await expect(requireDevAction('guild-1')).resolves.toEqual({
      ok: true,
      userId: 'dev-1',
      session: expect.objectContaining({ userId: 'dev-1' })
    })
  })
})

describe('devGuildDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToDatabase).mockResolvedValue(undefined)
  })

  it('getDevEnvStatus reports env flags', async () => {
    await expect(getDevEnvStatus()).resolves.toMatchObject({
      variables: expect.objectContaining({
        MONGO_URI: true,
        NEXTAUTH_SECRET: true
      })
    })
  })

  it('getDevDatabaseStatus reports connection state', async () => {
    patchMongooseConnection({
      readyState: 1,
      host: 'localhost',
      name: 'test',
      db: {
        admin: () => ({
          command: vi.fn().mockResolvedValue({ ok: 1 })
        })
      }
    })

    await expect(getDevDatabaseStatus()).resolves.toMatchObject({
      readyStateLabel: 'connected',
      host: 'localhost',
      name: 'test',
      pingMs: expect.any(Number)
    })
  })

  it('getDevGuildCounts aggregates model counts', async () => {
    vi.mocked(User.countDocuments).mockResolvedValue(10)
    vi.mocked(Transaction.countDocuments).mockResolvedValue(20)
    vi.mocked(AtmRequest.countDocuments).mockResolvedValue(1)

    await expect(getDevGuildCounts('guild-1')).resolves.toMatchObject({
      users: 10,
      transactions: 20
    })
  })

  it('getDevFeatureFlags maps disabled features', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          globalSettings: { disableDeposits: true }
        })
      })
    } as never)

    const flags = await getDevFeatureFlags('guild-1')
    expect(flags.find((flag) => flag.feature === 'deposit')?.disabled).toBe(
      true
    )
  })

  it('getDevGuildConfig returns null when config is missing', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as never)

    await expect(getDevGuildConfig('guild-1')).resolves.toBeNull()
  })

  it('getDevGuildConfig and recent transactions serialize docs', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ guildId: 'guild-1' })
    } as never)
    vi.mocked(Transaction.find).mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([{ userId: 'u1', amount: 1 }])
          })
        })
      })
    } as never)

    await expect(getDevGuildConfig('guild-1')).resolves.toEqual({
      guildId: 'guild-1'
    })
    await expect(getDevRecentTransactions('guild-1')).resolves.toEqual([
      { userId: 'u1', amount: 1 }
    ])
  })

  it('getDevDatabaseStatus handles missing db handle', async () => {
    patchMongooseConnection({
      readyState: 0,
      db: undefined
    })

    await expect(getDevDatabaseStatus()).resolves.toMatchObject({
      readyStateLabel: 'disconnected',
      pingMs: null
    })
  })

  it('getDevEnvStatus defaults unknown node env', async () => {
    const env = process.env as Record<string, string | undefined>
    const original = env.NODE_ENV
    delete env.NODE_ENV

    await expect(getDevEnvStatus()).resolves.toMatchObject({
      nodeEnv: 'unknown'
    })

    env.NODE_ENV = original
  })

  it('getDevChannelChecks maps missing channels', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        atmChannelIds: { actions: 'ch-1', logs: null },
        casinoChannelIds: ['ch-2']
      })
    } as never)
    vi.mocked(getGuildChannels).mockResolvedValue([
      { id: 'ch-1', name: 'atm' },
      { id: 'ch-2', name: 'casino' }
    ] as never)

    await expect(getDevChannelChecks('guild-1')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'atm.actions',
          exists: true,
          name: 'atm'
        }),
        expect.objectContaining({ key: 'atm.logs', exists: false, name: null })
      ])
    )
  })

  it('getDevEnvStatus reports local deployment without Vercel', async () => {
    const original = process.env.VERCEL
    delete process.env.VERCEL
    await expect(getDevEnvStatus()).resolves.toMatchObject({
      deployment: 'Local'
    })
    process.env.VERCEL = original
  })

  it('getDevDatabaseStatus labels unknown ready states', async () => {
    patchMongooseConnection({
      readyState: 99,
      db: undefined
    })

    await expect(getDevDatabaseStatus()).resolves.toMatchObject({
      readyStateLabel: 'unknown'
    })
  })

  it('getDevFeatureFlags handles missing guild config', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      })
    } as never)

    const flags = await getDevFeatureFlags('guild-1')
    expect(flags.every((flag) => flag.disabled === false)).toBe(true)
  })

  it('getDevEnvStatus uses configured node env', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    await expect(getDevEnvStatus()).resolves.toMatchObject({ nodeEnv: 'test' })
    vi.unstubAllEnvs()
  })

  it('getDevDatabaseStatus handles empty host and name', async () => {
    patchMongooseConnection({
      readyState: 1,
      host: '',
      name: '',
      db: undefined
    })

    await expect(getDevDatabaseStatus()).resolves.toMatchObject({
      host: null,
      name: null
    })
  })

  it('getDevChannelChecks handles missing casino channel list', async () => {
    vi.mocked(GuildConfiguration.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        atmChannelIds: { actions: null, logs: null }
      })
    } as never)
    vi.mocked(getGuildChannels).mockResolvedValue([] as never)

    const checks = await getDevChannelChecks('guild-1')
    expect(checks.some((check) => check.key === 'atm.actions')).toBe(true)
  })

  it('getDevBotPresence and invalidateDevDiscordCaches delegate to actions', async () => {
    vi.mocked(isBotInGuild).mockResolvedValue(true)
    vi.mocked(invalidateGuildChannelsCache).mockResolvedValue(undefined)

    await expect(getDevBotPresence('guild-1')).resolves.toEqual({
      inGuild: true
    })
    await expect(invalidateDevDiscordCaches('guild-1')).resolves.toEqual({
      guildId: 'guild-1',
      invalidated: ['guildChannels']
    })
  })
})
