import {
  TGuildConfiguration,
  GuildConfigurationSchema,
} from 'gambling-bot-shared'
import { models, model } from 'mongoose'

export default models.GuildConfiguration ||
  model<TGuildConfiguration>('GuildConfiguration', GuildConfigurationSchema)
