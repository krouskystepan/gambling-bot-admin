import {
  GuildConfigurationSchema,
  TGuildConfiguration
} from 'gambling-bot-shared'

import { getModel } from '@/lib/db'

export default getModel<TGuildConfiguration>(
  'GuildConfiguration',
  GuildConfigurationSchema
)
