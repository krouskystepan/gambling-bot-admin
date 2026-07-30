'server-only'

import { QuestSchema } from 'gambling-bot-shared/mongoose'
import { type TQuest } from 'gambling-bot-shared/quests'

import { getModel } from '@/lib/db'

export default getModel<TQuest>('Quest', QuestSchema)
