'server-only'

import { type TBlackjackGame } from 'gambling-bot-shared/blackjack'
import { BlackjackGameSchema } from 'gambling-bot-shared/mongoose'

import { getModel } from '@/lib/db'

export default getModel<TBlackjackGame>('BlackjackGame', BlackjackGameSchema)
