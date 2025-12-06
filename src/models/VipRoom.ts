import { TVipRoom, VipRoomSchema } from 'gambling-bot-shared'
import { models, model } from 'mongoose'

export default models.VipRoom || model<TVipRoom>('VipRoom', VipRoomSchema)
