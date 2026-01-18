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
  if (!session?.accessToken) return []

  await connectToDatabase()

  const docs = await VipRoom.find({ guildId })
  if (!docs.length) return []

  const discordMembers = await getDiscordGuildMembers(guildId)
  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))

  const guildChannels = await getGuildChannels(guildId)
  const channelsMap = new Map(guildChannels.map((c) => [c.id, c.name]))

  return docs.map((vip: TVipRoom) => {
    const owner = membersMap.get(vip.ownerId)

    const members = vip.memberIds
      .map((id) => {
        const m = membersMap.get(id)
        if (!m) return null

        return {
          userId: m.userId,
          username: m.username,
          nickname: m.nickname || '',
          avatar: m.avatarUrl || '/default-avatar.jpg'
        }
      })
      .filter(
        (
          m
        ): m is {
          userId: string
          username: string
          nickname: string
          avatar: string
        } => m !== null
      )

    return {
      ownerId: vip.ownerId,
      guildId: vip.guildId,
      channelId: vip.channelId,
      expiresAt: vip.expiresAt,
      createdAt: vip.createdAt,
      channelName: channelsMap.get(vip.channelId) || 'Unknown',
      username: owner?.username || 'Unknown',
      nickname: owner?.nickname || '',
      avatar: owner?.avatarUrl || '/default-avatar.jpg',
      members
    }
  })
}
