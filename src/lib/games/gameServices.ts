import {
  createPredictionDb,
  createPredictionLifecycleService
} from 'gambling-bot-shared/predictions'
import {
  createRaffleDb,
  createRaffleLifecycleService
} from 'gambling-bot-shared/raffle'

import { casinoBetService } from '@/lib/casino/casinoBetService'
import Prediction from '@/models/Prediction'
import Raffle from '@/models/Raffle'
import Transaction from '@/models/Transaction'

export { casinoBetService }

export const predictionDb = createPredictionDb(Prediction)
export const raffleDb = createRaffleDb(Raffle)

export const predictionLifecycle = createPredictionLifecycleService({
  predictionDb,
  casinoBet: casinoBetService,
  hasSettlementTransactions: async ({ guildId, referenceIds }) => {
    if (referenceIds.length === 0) return false

    const count = await Transaction.countDocuments({
      guildId,
      referenceId: { $in: referenceIds },
      type: { $in: ['win', 'refund'] }
    })

    return count > 0
  }
})

export const raffleLifecycle = createRaffleLifecycleService({
  raffleDb,
  casinoBet: casinoBetService
})
