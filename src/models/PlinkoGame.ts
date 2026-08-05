'server-only'

import { PlinkoGameSchema } from 'gambling-bot-shared/mongoose'
import { type TPlinkoGame } from 'gambling-bot-shared/plinko'

import { getModel } from '@/lib/db'

export default getModel<TPlinkoGame>('PlinkoGame', PlinkoGameSchema)
