import { getModel } from '@/lib/utils'
import { TTransaction, TransactionSchema } from 'gambling-bot-shared'

export default getModel<TTransaction>('Transaction', TransactionSchema)
