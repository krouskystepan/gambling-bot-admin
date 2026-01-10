import { TTransaction, TransactionSchema } from 'gambling-bot-shared'

import { getModel } from '@/lib/db'

export default getModel<TTransaction>('Transaction', TransactionSchema)
