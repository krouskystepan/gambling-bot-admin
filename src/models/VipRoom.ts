'server-only'

import { type TVipRoom } from 'gambling-bot-shared'
import { VipRoomSchema } from 'gambling-bot-shared/server'

import { getModel } from '@/lib/db'

export default getModel<TVipRoom>('VipRoom', VipRoomSchema)
