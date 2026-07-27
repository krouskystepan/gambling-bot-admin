'server-only'

import { RouletteGameSchema } from 'gambling-bot-shared/mongoose'
import { type TRouletteGame } from 'gambling-bot-shared/roulette'

import { getModel } from '@/lib/db'

export default getModel<TRouletteGame>('RouletteGame', RouletteGameSchema)
