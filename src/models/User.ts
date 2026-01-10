import { TUser, UserSchema } from 'gambling-bot-shared'

import { getModel } from '@/lib/db'

export default getModel<TUser>('User', UserSchema)
