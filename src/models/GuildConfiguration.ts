import { getModel } from '@/lib/utils'
import {
  TGuildConfiguration,
  GuildConfigurationSchema,
} from 'gambling-bot-shared'

export default getModel<TGuildConfiguration>(
  'GuildConfiguration',
  GuildConfigurationSchema
)
