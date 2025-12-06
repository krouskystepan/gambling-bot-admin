import { TUser, UserSchema } from 'gambling-bot-shared'
import { models, model } from 'mongoose'

export default models.User || model<TUser>('User', UserSchema)
