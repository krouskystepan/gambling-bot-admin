'use server'

import { TVipRoom } from 'gambling-bot-shared'
import { Session } from 'next-auth'

import { connectToDatabase } from '@/lib/db'
import { getPanelFeatureBlockMessage } from '@/lib/panel/panelGlobalFeatureGuard'
import { escapeRegExp } from '@/lib/utils'
import GuildConfiguration from '@/models/GuildConfiguration'
import VipRoom from '@/models/VipRoom'
import { TVipChannels } from '@/types/types'

import { getGuildChannels } from '../discord/channel.action'
import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'

export type VipPageContext = {
  maxMembers: number
  vipConfigured: boolean
  vipFeatureBlocked: boolean
  vipFeatureBlockMessage: string | null
  activeVipOwnerIds: string[]
  members: Awaited<ReturnType<typeof getDiscordGuildMembers>>
}

export async function getVipPageContext(
  guildId: string
): Promise<VipPageContext | null> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const [guildConfig, activeVips, members] = await Promise.all([
    GuildConfiguration.findOne({ guildId }).lean(),
    VipRoom.find({
      guildId,
      expiresAt: { $gt: new Date() }
    })
      .select('ownerId')
      .lean<{ ownerId: string }[]>(),
    getDiscordGuildMembers(guildId)
  ])

  const activeVipOwnerIds = activeVips.map((vip) => vip.ownerId)

  const vipSettings = guildConfig?.vipSettings
  const vipFeatureBlockMessage = getPanelFeatureBlockMessage(
    guildConfig?.globalSettings,
    'vip',
    access.isAdmin
  )

  return {
    maxMembers: vipSettings?.maxMembers ?? 0,
    vipConfigured: Boolean(
      vipSettings?.categoryId &&
      vipSettings?.roleOwnerId &&
      vipSettings?.roleMemberId &&
      (vipSettings?.pricePerDay ?? 0) > 0
    ),
    vipFeatureBlocked: vipFeatureBlockMessage !== null,
    vipFeatureBlockMessage,
    activeVipOwnerIds,
    members
  }
}

export async function getVips(
  guildId: string,
  session: Session,
  page = 1,
  limit = 10,
  search?: string,
  sort?: string
): Promise<{ vips: TVipChannels[]; total: number }> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { vips: [], total: 0 }
  }

  await connectToDatabase()

  const docs = await VipRoom.find({
    guildId,
    expiresAt: { $gt: new Date() }
  })
  if (!docs.length) return { vips: [], total: 0 }

  const discordMembers = await getDiscordGuildMembers(guildId)
  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))

  const guildChannels = await getGuildChannels(guildId)
  const channelsMap = new Map(
    guildChannels.map((c) => [c.id, c.name ?? 'Unknown'])
  )

  let vips: TVipChannels[] = docs.map((vip: TVipRoom) => {
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

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')

    vips = vips.filter(
      (vip) =>
        regex.test(vip.ownerId) ||
        regex.test(vip.channelId) ||
        regex.test(vip.username) ||
        regex.test(vip.nickname) ||
        regex.test(vip.channelName)
    )
  }

  if (sort) {
    for (const part of sort.split(',').reverse()) {
      const [field, dir] = part.split(':')

      vips.sort((a, b) => {
        const av = (a as Record<string, unknown>)[field]
        const bv = (b as Record<string, unknown>)[field]

        if (field === 'members') {
          const aLen = Array.isArray(av) ? av.length : 0
          const bLen = Array.isArray(bv) ? bv.length : 0
          if (aLen < bLen) return dir === 'asc' ? -1 : 1
          if (aLen > bLen) return dir === 'asc' ? 1 : -1
          return 0
        }

        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1

        if (av < bv) return dir === 'asc' ? -1 : 1
        if (av > bv) return dir === 'asc' ? 1 : -1
        return 0
      })
    }
  }

  const total = vips.length
  const start = (page - 1) * limit
  const end = start + limit

  return {
    vips: vips.slice(start, end),
    total
  }
}
