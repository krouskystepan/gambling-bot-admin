import { parseTimeToSeconds } from 'gambling-bot-shared'
import { z } from 'zod'

export {
  atmChannelsFormSchema,
  bonusFormSchema,
  casinoChannelsFormSchema,
  casinoSettingsSchema,
  channelsFormSchema,
  globalSettingsFormSchema,
  managerRoleFormSchema,
  predictionChannelsFormSchema,
  raffleChannelsFormSchema,
  vipSettingsFormSchema
} from 'gambling-bot-shared/schemas'

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
