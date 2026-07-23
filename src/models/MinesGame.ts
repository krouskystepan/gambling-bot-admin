'server-only'

import { type TMinesGame } from 'gambling-bot-shared/mines'
import { MinesGameSchema } from 'gambling-bot-shared/mongoose'

import { getModel } from '@/lib/db'

export default getModel<TMinesGame>('MinesGame', MinesGameSchema)
