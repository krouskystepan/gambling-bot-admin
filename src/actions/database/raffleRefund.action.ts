'use server'

import mongoose from 'mongoose'

import { connectToDatabase } from '@/lib/db'
import Transaction from '@/models/Transaction'
import User from '@/models/User'

// Raffle cancellation refunds go to normal balance even if bonus funds were used.
export async function refundRafflePurchase({
  userId,
  guildId,
  amount,
  raffleId
}: {
  userId: string
  guildId: string
  amount: number
  raffleId: string
}) {
  await connectToDatabase()

  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const user = await User.findOne({ userId, guildId }).session(session)
      if (!user) throw new Error('USER_NOT_FOUND')

      user.balance += amount
      await user.save({ session })

      await Transaction.create(
        [
          {
            userId,
            guildId,
            amount,
            type: 'refund',
            source: 'casino',
            betId: raffleId,
            meta: { game: 'raffle' }
          }
        ],
        { session }
      )
    })
  } finally {
    session.endSession()
  }
}
