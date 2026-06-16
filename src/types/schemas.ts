import { parseTimeToSeconds } from 'gambling-bot-shared/common'
import { z } from 'zod'

export { atmChannelsFormSchema } from 'gambling-bot-shared/atm'
export { bonusFormSchema } from 'gambling-bot-shared/bonus'
export {
  casinoChannelsFormSchema,
  casinoSettingsSchema
} from 'gambling-bot-shared/casino'
export {
  channelsFormSchema,
  globalSettingsFormSchema,
  managerRoleFormSchema
} from 'gambling-bot-shared/guild'
export { predictionChannelsFormSchema } from 'gambling-bot-shared/predictions'
export {
  raffleChannelsFormSchema,
  raffleCreateFormSchema
} from 'gambling-bot-shared/raffle'
export { vipSettingsFormSchema } from 'gambling-bot-shared/vip'

const VIP_DURATION_REGEX = /^(\d+[dw])+$/i

export const vipDurationSchema = z
  .string()
  .trim()
  .regex(VIP_DURATION_REGEX, 'Use whole numbers only, e.g., 1d, 2w.')
  .refine((value) => parseTimeToSeconds(value) >= 86400, {
    message: 'Duration must be at least 1 day (1d).'
  })

export const createVipRoomSchema = z.object({
  guildId: z.string().min(1),
  ownerId: z.string().min(1),
  duration: vipDurationSchema
})

export const extendVipRoomSchema = z.object({
  guildId: z.string().min(1),
  ownerId: z.string().min(1),
  duration: vipDurationSchema
})

export const addVipMemberSchema = z.object({
  guildId: z.string().min(1),
  ownerId: z.string().min(1),
  memberId: z.string().min(1),
  bypassLimit: z.boolean().optional().default(false)
})
