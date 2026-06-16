'server-only'

import { type TAtmRequest } from 'gambling-bot-shared/atm'
import { AtmRequestSchema } from 'gambling-bot-shared/mongoose'

import { getModel } from '@/lib/db'

export default getModel<TAtmRequest>('AtmRequest', AtmRequestSchema)
