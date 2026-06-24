import mongoose from 'mongoose'

export function serializeForDev(value: unknown): unknown {
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeForDev)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeForDev(entry)])
    )
  }

  return value
}
