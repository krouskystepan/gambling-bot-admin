'use server'

import { discordBotRequest } from '@/lib/discordReq'
import type { IChannelsCacheEntry, IGuildChannel } from '@/types/types'

const guildChannelsCache = new Map<string, IChannelsCacheEntry>()
const CHANNEL_CACHE_DURATION = 60_000 // 1 min

export const getGuildChannels = async (
  guildId: string
): Promise<IGuildChannel[]> => {
  const now = Date.now()
  const cached = guildChannelsCache.get(guildId)

  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  try {
    const channels = await discordBotRequest<IGuildChannel[]>({
      url: `/guilds/${guildId}/channels`,
      method: 'GET'
    })

    const textChannels = channels.filter((c) => c.type === 0)

    guildChannelsCache.set(guildId, {
      data: textChannels,
      expiresAt: now + CHANNEL_CACHE_DURATION
    })

    return textChannels
  } catch {
    return []
  }
}
