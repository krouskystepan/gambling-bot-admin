import { beforeEach, describe, expect, it, vi } from 'vitest'

import { connectToDatabase, getModel } from '@/lib/db'

const mongooseMock = vi.hoisted(() => {
  const connection = { readyState: 0 }
  return {
    connection,
    connect: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
    models: {} as Record<string, unknown>,
    model: vi.fn((name: string) => ({ name }))
  }
})

vi.mock('mongoose', () => ({
  default: mongooseMock,
  models: mongooseMock.models,
  model: mongooseMock.model
}))

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mongooseMock.connection.readyState = 0
    process.env.MONGO_URI = 'mongodb://127.0.0.1/test'
  })

  it('connectToDatabase throws without MONGO_URI', async () => {
    delete process.env.MONGO_URI
    await expect(connectToDatabase()).rejects.toThrow(
      'MONGO_URI is not defined'
    )
  })

  it('connectToDatabase skips when already connected', async () => {
    mongooseMock.connection.readyState = 1
    await connectToDatabase()
    expect(mongooseMock.connect).not.toHaveBeenCalled()
  })

  it('connectToDatabase connects when disconnected', async () => {
    await connectToDatabase()
    expect(mongooseMock.set).toHaveBeenCalledWith('strictQuery', false)
    expect(mongooseMock.connect).toHaveBeenCalledWith(process.env.MONGO_URI)
  })

  it('getModel returns cached model when present', () => {
    const cached = { cached: true }
    mongooseMock.models.User = cached
    expect(getModel('User', {} as never)).toBe(cached)
  })

  it('getModel creates model when missing', () => {
    delete mongooseMock.models.NewModel
    const schema = { paths: {} }
    getModel('NewModel', schema as never)
    expect(mongooseMock.model).toHaveBeenCalledWith('NewModel', schema)
  })
})
