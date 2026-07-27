'server-only'

import { type TBaccaratGame } from 'gambling-bot-shared/baccarat'
import { BaccaratGameSchema } from 'gambling-bot-shared/mongoose'

import { getModel } from '@/lib/db'

export default getModel<TBaccaratGame>('BaccaratGame', BaccaratGameSchema)
