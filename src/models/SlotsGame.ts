'server-only'

import { SlotsGameSchema } from 'gambling-bot-shared/mongoose'
import { type TSlotsGame } from 'gambling-bot-shared/slots'

import { getModel } from '@/lib/db'

export default getModel<TSlotsGame>('SlotsGame', SlotsGameSchema)
