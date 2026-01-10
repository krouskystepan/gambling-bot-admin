import { TVipRoom, VipRoomSchema } from 'gambling-bot-shared'

import { getModel } from '@/lib/db'

export default getModel<TVipRoom>('VipRoom', VipRoomSchema)
