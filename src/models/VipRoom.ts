import { getModel } from '@/lib/utils'
import { TVipRoom, VipRoomSchema } from 'gambling-bot-shared'

export default getModel<TVipRoom>('VipRoom', VipRoomSchema)
