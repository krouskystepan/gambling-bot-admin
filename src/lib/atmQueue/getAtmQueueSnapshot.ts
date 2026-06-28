import 'server-only'

import { connectToDatabase } from '@/lib/db'
import AtmRequest from '@/models/AtmRequest'

export type AtmQueueSnapshot = {
  revision: string
  pending: number
  total: number
  latestUpdatedAt: string | null
}

export async function getAtmQueueSnapshot(
  guildId: string
): Promise<AtmQueueSnapshot> {
  await connectToDatabase()

  const [stats] = await AtmRequest.aggregate<{
    total: number
    pending: number
    latestUpdatedAt: Date | null
  }>([
    { $match: { guildId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        latestUpdatedAt: { $max: '$updatedAt' }
      }
    }
  ])

  const pending = stats?.pending ?? 0
  const total = stats?.total ?? 0
  const latestUpdatedAt = stats?.latestUpdatedAt
    ? new Date(stats.latestUpdatedAt).toISOString()
    : null
  const revision = `${pending}:${total}:${latestUpdatedAt ?? ''}`

  return { revision, pending, total, latestUpdatedAt }
}
