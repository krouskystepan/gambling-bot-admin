'server-only'

import { TransactionSchema } from 'gambling-bot-shared/mongoose'
import { type TTransaction } from 'gambling-bot-shared/transactions'

import { getModel } from '@/lib/db'

export default getModel<TTransaction>('Transaction', TransactionSchema)
