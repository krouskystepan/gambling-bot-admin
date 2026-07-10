'use server'

import { discordBotRequest } from '@/lib/discord/discordReq'
import { getDemoGuildCategories, isDemoGuild } from '@/lib/presentation'
import type { IGuildChannel } from '@/types/types'

export const getGuildCategories = async (
  guildId: string
): Promise<IGuildChannel[]> => {
  if (isDemoGuild(guildId)) return getDemoGuildCategories()

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
