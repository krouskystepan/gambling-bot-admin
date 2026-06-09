'server-only'

import { type TAtmRequest } from 'gambling-bot-shared'
import { AtmRequestSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TAtmRequest>('AtmRequest', AtmRequestSchema)
