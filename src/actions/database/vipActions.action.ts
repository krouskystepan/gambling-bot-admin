'use server'

import { TVipRoom } from 'gambling-bot-shared'
import { Session } from 'next-auth'

import { connectToDatabase } from '@/lib/db'
import VipRoom from '@/models/VipRoom'
import { TVipChannels } from '@/types/types'

import { getGuildChannels } from '../discord/channel.action'
import { getDiscordGuildMembers } from '../discord/member.action'

export async function getVips(
  guildId: string,
  session: Session
): Promise<TVipChannels[]> {
  if (!session || !session.accessToken) return []

  await connectToDatabase()

  const docs = await VipRoom.find({ guildId })
  if (!docs.length) return []

  const discordMembers = await getDiscordGuildMembers(guildId)
  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))

  const guildChannels = await getGuildChannels(guildId)
  const channelsMap = new Map(guildChannels.map((c) => [c.id, c.name]))

  return docs.map((vip: TVipRoom) => {
    const member = membersMap.get(vip.ownerId)
    const channelName = channelsMap.get(vip.channelId) || 'Unknown'

    return {
      ownerId: vip.ownerId,
      guildId: vip.guildId,
      channelId: vip.channelId,
      channelName,
      expiresAt: vip.expiresAt,
      createdAt: vip.createdAt,
      username: member?.username || 'Unknown',
      nickname: member?.nickname || '',
      avatar: member?.avatarUrl || '/default-avatar.jpg'
    }
  })
}
