'server-only'

import { RaffleSchema } from 'gambling-bot-shared/mongoose'
import { type TRaffle } from 'gambling-bot-shared/raffle'

import { getModel } from '@/lib/db'

export default getModel<TRaffle>('Raffle', RaffleSchema)
