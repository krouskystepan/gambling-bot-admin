'use server'

import { discordBotRequest } from '@/lib/discordReq'
import type { IGuildChannel } from '@/types/types'

export const getGuildCategories = async (
  guildId: string
): Promise<IGuildChannel[]> => {
  try {
    const channels = await discordBotRequest<IGuildChannel[]>({
      url: `/guilds/${guildId}/channels`,
      method: 'GET'
    })

    return channels.filter((c) => c.type === 4)
  } catch {
    return []
  }
}
