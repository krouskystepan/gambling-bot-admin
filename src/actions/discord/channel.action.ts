'use server'

import { discordBotRequest } from '@/lib/discord/discordReq'
import { getDemoGuildChannels, isDemoGuild } from '@/lib/presentation'
import type { IChannelsCacheEntry, IGuildChannel } from '@/types/types'

const guildChannelsCache = new Map<string, IChannelsCacheEntry>()
const CHANNEL_CACHE_DURATION = 60_000 // 1 min

export async function invalidateGuildChannelsCache(
  guildId: string
): Promise<void> {
  guildChannelsCache.delete(guildId)
}

export const getGuildChannels = async (
  guildId: string
): Promise<IGuildChannel[]> => {
  if (isDemoGuild(guildId)) return getDemoGuildChannels()

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

export async function getGuildChannelById(
  channelId: string
): Promise<IGuildChannel | null> {
  try {
    return await discordBotRequest<IGuildChannel>({
      url: `/channels/${channelId}`,
      method: 'GET'
    })
  } catch {
    return null
  }
}

export async function resolveGuildChannelNames(
  channelIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(channelIds.filter(Boolean))]
  const names = new Map<string, string>()

  await Promise.all(
    uniqueIds.map(async (channelId) => {
      const channel = await getGuildChannelById(channelId)
      if (channel?.name) {
        names.set(channelId, channel.name)
      }
    })
  )

  return names
}
