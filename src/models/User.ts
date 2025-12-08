import { getModel } from '@/lib/utils'
import { TUser, UserSchema } from 'gambling-bot-shared'

export default getModel<TUser>('User', UserSchema)
