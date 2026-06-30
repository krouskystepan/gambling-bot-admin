'use server'

import { getEffectiveStreak } from 'gambling-bot-shared/bonus'
import {
  type GlobalSettings,
  normalizeGlobalSettings,
  resolveGuildTimezone
} from 'gambling-bot-shared/guild'
import { normalizeStaffNotes } from 'gambling-bot-shared/user'
import { TVipRoom } from 'gambling-bot-shared/vip'
import { Session } from 'next-auth'

import {
  OverviewDailyPoint,
  OverviewDateRange,
  OverviewPnLSeries,
  fillDailySeries,
  fillHourlySeries,
  resolveOverviewPnLGranularity
} from '@/features/general/overview/period'
import { connectToDatabase } from '@/lib/db'
import { userGuildDateRangeMatch } from '@/lib/guild/guildTimezone'
import { buildPnLTimeGroupStage } from '@/lib/overview/overviewPnLAggregation'
import { netProfitSum } from '@/lib/overview/transactionTotals'
import {
  VolumeSlice,
  buildVolumeSlices,
  volumeAmountGroupStage
} from '@/lib/overview/volumeSlices'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import UserBan from '@/models/UserBan'
import VipRoom from '@/models/VipRoom'

import {
  getGuildChannels,
  resolveGuildChannelNames
} from '../discord/channel.action'
import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'

export type UserProfileVipMember = {
  userId: string
  username: string
  nickname: string
  avatar: string
}

export type UserProfileVip = {
  role: 'owner' | 'member'
  channelId: string
  channelName: string
  expiresAt: Date
  createdAt: Date
  members: UserProfileVipMember[]
}

export type UserProfileStaffNote = {
  noteId: string
  text: string
  authorId: string
  authorUsername?: string
  createdAt: Date
}

export type UserProfileBanRecord = {
  banId: string
  bannedAt: Date
  bannedBy: string
  bannedByUsername?: string
  banReason?: string
  unbannedAt: Date | null
  unbannedBy: string | null
  unbannedByUsername?: string
  unbanReason?: string
}

export type UserProfileData = {
  globalSettings: GlobalSettings
  userId: string
  username: string
  nickname: string | null
  avatar: string
  registered: boolean
  registeredAt: Date | null
  banned: boolean
  bannedAt: Date | null
  bannedBy: string | null
  bannedByUsername?: string
  bans: UserProfileBanRecord[]
  staffNotes: UserProfileStaffNote[]
  balance: number
  bonusBalance: number
  lockedBalance: number
  dailyStreak: number
  lastDailyClaim: Date | null
  lifetimeNetProfit: number
  pnlSeries: OverviewPnLSeries
  sourceAmounts: VolumeSlice[]
  vips: UserProfileVip[]
}

async function enrichVipRooms(
  guildId: string,
  userId: string,
  rooms: TVipRoom[]
): Promise<UserProfileVip[]> {
  if (!rooms.length) return []

  const [discordMembers, guildChannels] = await Promise.all([
    getDiscordGuildMembers(guildId),
    getGuildChannels(guildId)
  ])

  const membersMap = new Map((discordMembers ?? []).map((m) => [m.userId, m]))
  const channelsMap = new Map(
    guildChannels.filter((c) => c.name).map((c) => [c.id, c.name as string])
  )

  const missingChannelIds = rooms
    .map((room) => room.channelId)
    .filter((channelId) => !channelsMap.has(channelId))

  if (missingChannelIds.length > 0) {
    const resolvedNames = await resolveGuildChannelNames(missingChannelIds)
    for (const [channelId, name] of resolvedNames) {
      channelsMap.set(channelId, name)
    }
  }

  return rooms.map((vip) => {
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
      .filter((m): m is UserProfileVipMember => m !== null)

    return {
      role: vip.ownerId === userId ? ('owner' as const) : ('member' as const),
      channelId: vip.channelId,
      channelName: channelsMap.get(vip.channelId) ?? 'VIP room',
      expiresAt: vip.expiresAt,
      createdAt: vip.createdAt,
      members
    }
  })
}

export async function getUserProfile(
  guildId: string,
  userId: string,
  _session: Session,
  range: OverviewDateRange
): Promise<UserProfileData | null> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const timezone = resolveGuildTimezone(guildConfig?.globalSettings?.timezone)
  const dateMatch = userGuildDateRangeMatch(
    guildId,
    userId,
    range.dateFrom,
    range.dateTo,
    timezone
  )

  const pnlGranularity = resolveOverviewPnLGranularity(range, timezone)

  const [discordMembers, dbUser, vipRooms, userBans] = await Promise.all([
    getDiscordGuildMembers(guildId),
    User.findOne({ guildId, userId }).lean(),
    VipRoom.find({
      guildId,
      $or: [{ ownerId: userId }, { memberIds: userId }]
    }).lean(),
    UserBan.find({ guildId, userId }).sort({ bannedAt: -1 }).lean()
  ])

  const discordMember = (discordMembers ?? []).find((m) => m.userId === userId)

  if (!discordMember && !dbUser) return null

  const [dailyAgg, sourceAmountAgg, lifetimeNetProfitAgg, vips] =
    await Promise.all([
      Transaction.aggregate([
        { $match: dateMatch },
        buildPnLTimeGroupStage(timezone, pnlGranularity),
        { $sort: { _id: 1 } }
      ]),
      Transaction.aggregate([{ $match: dateMatch }, volumeAmountGroupStage]),
      Transaction.aggregate([
        {
          $match: {
            guildId,
            userId,
            type: { $in: ['bet', 'win', 'bonus'] }
          }
        },
        { $group: { _id: null, netProfit: netProfitSum } }
      ]),
      enrichVipRooms(guildId, userId, vipRooms)
    ])

  const lifetimeNetProfit = lifetimeNetProfitAgg[0]?.netProfit ?? 0

  const pnlPoints: OverviewDailyPoint[] = dailyAgg.map((row) => ({
    date: row._id as string,
    gamePnL: row.gamePnL ?? 0,
    cashFlow: row.cashFlow ?? 0,
    txCount: row.txCount ?? 0
  }))

  const pnlSeries: OverviewPnLSeries = {
    granularity: pnlGranularity,
    points:
      pnlGranularity === 'hour'
        ? fillHourlySeries(range, pnlPoints, timezone)
        : fillDailySeries(range, pnlPoints, timezone)
  }

  const sourceAmounts = buildVolumeSlices(sourceAmountAgg)

  const membersMap = new Map((discordMembers ?? []).map((m) => [m.userId, m]))
  const resolveUsername = (id: string | null | undefined) =>
    id ? membersMap.get(id)?.username : undefined

  const staffNotes: UserProfileStaffNote[] = normalizeStaffNotes(
    dbUser?.staffNotes ?? []
  ).map((note) => ({
    noteId: note.noteId,
    text: note.text,
    authorId: note.authorId,
    authorUsername: resolveUsername(note.authorId),
    createdAt: note.createdAt
  }))

  const bans: UserProfileBanRecord[] = userBans.map((ban) => ({
    banId: ban.banId,
    bannedAt: ban.bannedAt,
    bannedBy: ban.bannedBy,
    bannedByUsername: resolveUsername(ban.bannedBy),
    banReason: ban.banReason,
    unbannedAt: ban.unbannedAt,
    unbannedBy: ban.unbannedBy,
    unbannedByUsername: resolveUsername(ban.unbannedBy),
    unbanReason: ban.unbanReason
  }))

  return {
    globalSettings: normalizeGlobalSettings(
      guildConfig?.globalSettings as Partial<GlobalSettings> | undefined
    ),
    userId,
    username: discordMember?.username ?? 'Unknown',
    nickname: discordMember?.nickname ?? null,
    avatar: discordMember?.avatarUrl ?? '/default-avatar.jpg',
    registered: Boolean(dbUser),
    registeredAt: dbUser?.createdAt ?? null,
    banned: Boolean(dbUser?.banned),
    bannedAt: dbUser?.bannedAt ?? null,
    bannedBy: dbUser?.bannedBy ?? null,
    bannedByUsername: resolveUsername(dbUser?.bannedBy),
    bans,
    staffNotes,
    balance: dbUser?.balance ?? 0,
    bonusBalance: dbUser?.bonusBalance ?? 0,
    lockedBalance: dbUser?.lockedBalance ?? 0,
    dailyStreak: getEffectiveStreak(
      dbUser?.lastDailyClaim ? new Date(dbUser.lastDailyClaim) : null,
      new Date(),
      dbUser?.dailyStreak ?? 0
    ),
    lastDailyClaim: dbUser?.lastDailyClaim ?? null,
    lifetimeNetProfit,
    pnlSeries,
    sourceAmounts,
    vips
  }
}
