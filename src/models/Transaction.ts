import type { TTransaction } from 'gambling-bot-shared'
import { TransactionSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TTransaction>('Transaction', TransactionSchema)
