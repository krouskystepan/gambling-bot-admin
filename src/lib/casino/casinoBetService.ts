import { createCasinoBetService } from 'gambling-bot-shared/services'

import Transaction from '@/models/Transaction'
import User from '@/models/User'

export const casinoBetService = createCasinoBetService({
  userModel: User,
  transactionModel: Transaction
})
