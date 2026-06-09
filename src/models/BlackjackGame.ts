'server-only'

import { type TBlackjackGame } from 'gambling-bot-shared'
import { BlackjackGameSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TBlackjackGame>('BlackjackGame', BlackjackGameSchema)
