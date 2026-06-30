'server-only'

import { UserBanSchema } from 'gambling-bot-shared/mongoose'
import { type TUserBan } from 'gambling-bot-shared/user'

import { getModel } from '@/lib/db'

export default getModel<TUserBan>('UserBan', UserBanSchema)
