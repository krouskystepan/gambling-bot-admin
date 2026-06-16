import {
  createPredictionDb,
  createPredictionLifecycleService,
  createRaffleDb,
  createRaffleLifecycleService
} from 'gambling-bot-shared/services'

import { casinoBetService } from '@/lib/casino/casinoBetService'
import Prediction from '@/models/Prediction'
import Raffle from '@/models/Raffle'

export { casinoBetService }

export const predictionDb = createPredictionDb(Prediction)
export const raffleDb = createRaffleDb(Raffle)

export const predictionLifecycle = createPredictionLifecycleService({
  predictionDb,
  casinoBet: casinoBetService
})

export const raffleLifecycle = createRaffleLifecycleService({
  raffleDb,
  casinoBet: casinoBetService
})
