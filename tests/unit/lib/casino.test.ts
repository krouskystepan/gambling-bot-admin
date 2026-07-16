import { beforeEach, describe, expect, it, vi } from 'vitest'

import { casinoBetService } from '@/lib/casino/casinoBetService'
import {
  casinoBetService as gameCasinoBetService,
  predictionDb,
  predictionLifecycle,
  raffleDb,
  raffleLifecycle
} from '@/lib/games/gameServices'
import {
  casinoBetService as predictionCasinoBetService,
  predictionDb as predictionDbReexport,
  predictionLifecycle as predictionLifecycleReexport,
  raffleDb as raffleDbReexport,
  raffleLifecycle as raffleLifecycleReexport
} from '@/lib/predictions/predictionServices'
import Transaction from '@/models/Transaction'

const createCasinoBetService = vi.hoisted(() =>
  vi.fn(() => ({ placeBet: vi.fn() }))
)
const createPredictionDb = vi.hoisted(() => vi.fn(() => ({ find: vi.fn() })))
const createRaffleDb = vi.hoisted(() => vi.fn(() => ({ find: vi.fn() })))
const createPredictionLifecycleService = vi.hoisted(() =>
  vi.fn((config: unknown) => config)
)
const createRaffleLifecycleService = vi.hoisted(() =>
  vi.fn((config: unknown) => config)
)

vi.mock('gambling-bot-shared/casino', () => ({ createCasinoBetService }))
vi.mock('gambling-bot-shared/predictions', () => ({
  createPredictionDb,
  createPredictionLifecycleService
}))
vi.mock('gambling-bot-shared/raffle', () => ({
  createRaffleDb,
  createRaffleLifecycleService
}))
vi.mock('@/models/User', () => ({ default: { name: 'User' } }))
vi.mock('@/models/Transaction', () => ({
  default: {
    name: 'Transaction',
    countDocuments: vi.fn()
  }
}))
vi.mock('@/models/Prediction', () => ({ default: { name: 'Prediction' } }))
vi.mock('@/models/Raffle', () => ({ default: { name: 'Raffle' } }))

describe('casino and game service wiring', () => {
  it('creates casino bet service with models', () => {
    expect(casinoBetService).toBeDefined()
    expect(gameCasinoBetService).toBe(casinoBetService)
  })

  it('creates prediction and raffle services', () => {
    expect(predictionDb).toBeDefined()
    expect(raffleDb).toBeDefined()
    expect(predictionLifecycle).toMatchObject({
      predictionDb,
      casinoBet: casinoBetService
    })
    expect(raffleLifecycle).toMatchObject({
      raffleDb,
      casinoBet: casinoBetService
    })
  })

  it('predictionServices re-exports game services', () => {
    expect(predictionCasinoBetService).toBe(gameCasinoBetService)
    expect(predictionDbReexport).toBe(predictionDb)
    expect(predictionLifecycleReexport).toBe(predictionLifecycle)
    expect(raffleDbReexport).toBe(raffleDb)
    expect(raffleLifecycleReexport).toBe(raffleLifecycle)
  })

  it('hasSettlementTransactions short-circuits empty refs and counts settlements', async () => {
    const lifecycle = predictionLifecycle as unknown as {
      hasSettlementTransactions: (input: {
        guildId: string
        referenceIds: string[]
      }) => Promise<boolean>
    }

    await expect(
      lifecycle.hasSettlementTransactions({
        guildId: 'guild-1',
        referenceIds: []
      })
    ).resolves.toBe(false)

    vi.mocked(Transaction.countDocuments).mockResolvedValue(2)
    await expect(
      lifecycle.hasSettlementTransactions({
        guildId: 'guild-1',
        referenceIds: ['ref-1']
      })
    ).resolves.toBe(true)
  })
})
