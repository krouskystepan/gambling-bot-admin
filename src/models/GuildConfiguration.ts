import type { TGuildConfiguration } from 'gambling-bot-shared'
import { GuildConfigurationSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TGuildConfiguration>(
  'GuildConfiguration',
  GuildConfigurationSchema
)
