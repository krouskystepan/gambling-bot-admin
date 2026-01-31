'server-only'

import { type TUser } from 'gambling-bot-shared'
import { UserSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TUser>('User', UserSchema)
