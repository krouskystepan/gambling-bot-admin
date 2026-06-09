'server-only'

import { type TRaffle } from 'gambling-bot-shared'
import { RaffleSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TRaffle>('Raffle', RaffleSchema)
