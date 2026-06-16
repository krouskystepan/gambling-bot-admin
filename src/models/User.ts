'server-only'

import { UserSchema } from 'gambling-bot-shared/mongoose'
import { type TUser } from 'gambling-bot-shared/user'

import { getModel } from '@/lib/db'

export default getModel<TUser>('User', UserSchema)
