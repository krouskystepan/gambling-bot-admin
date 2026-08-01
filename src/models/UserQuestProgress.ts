'server-only'

import { UserQuestProgressSchema } from 'gambling-bot-shared/mongoose'
import { type TUserQuestProgress } from 'gambling-bot-shared/quests'

import { getModel } from '@/lib/db'

export default getModel<TUserQuestProgress>(
  'UserQuestProgress',
  UserQuestProgressSchema
)
