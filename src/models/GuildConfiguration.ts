'server-only'

import { type TGuildConfiguration } from 'gambling-bot-shared/guild'
import { GuildConfigurationSchema } from 'gambling-bot-shared/mongoose'

import { getModel } from '@/lib/db'

export default getModel<TGuildConfiguration>(
  'GuildConfiguration',
  GuildConfigurationSchema
)
