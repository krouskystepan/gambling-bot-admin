'server-only'

import { VipRoomSchema } from 'gambling-bot-shared/mongoose'
import { type TVipRoom } from 'gambling-bot-shared/vip'

import { getModel } from '@/lib/db'

export default getModel<TVipRoom>('VipRoom', VipRoomSchema)
