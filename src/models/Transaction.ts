import { TTransaction, TransactionSchema } from 'gambling-bot-shared'
import { models, model } from 'mongoose'

export default models.Transaction ||
  model<TTransaction>('Transaction', TransactionSchema)
