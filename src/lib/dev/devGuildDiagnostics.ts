import {
  type GlobalFeature,
  type GlobalSettings,
  isGlobalFeatureDisabled,
  normalizeGlobalSettings
} from 'gambling-bot-shared/guild'
import mongoose from 'mongoose'

import { invalidateGuildChannelsCache } from '@/actions/discord/channel.action'
import { getGuildChannels } from '@/actions/discord/channel.action'
import { isBotInGuild } from '@/actions/discord/utils.action'
import { connectToDatabase } from '@/lib/db'
import { serializeForDev } from '@/lib/dev/serializeDevJson'
import { PANEL_FEATURE_DISABLED_MESSAGES } from '@/lib/panel/panelGlobalFeatureGuard'
import AtmRequest from '@/models/AtmRequest'
import BlackjackGame from '@/models/BlackjackGame'
import GuildConfiguration from '@/models/GuildConfiguration'
import Prediction from '@/models/Prediction'
import Raffle from '@/models/Raffle'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import VipRoom from '@/models/VipRoom'

const GLOBAL_FEATURES = Object.keys(
  PANEL_FEATURE_DISABLED_MESSAGES
) as GlobalFeature[]

export type DevEnvStatus = {
  nodeEnv: string
  deployment: string
  variables: Record<string, boolean>
}

export type DevGuildCounts = {
  users: number
  registeredUsers: number
  transactions: number
  atmPending: number
  atmApproved: number
  atmRejected: number
  predictions: number
  raffles: number
  vipRooms: number
  blackjackGames: number
}

export type DevFeatureFlag = {
  feature: GlobalFeature
  disabled: boolean
}

export type DevChannelCheck = {
  key: string
  channelId: string | null
  exists: boolean
  name: string | null
}

export async function getDevEnvStatus(): Promise<DevEnvStatus> {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    deployment: process.env.VERCEL ? 'Vercel' : 'Local',
    variables: {
      MONGO_URI: Boolean(process.env.MONGO_URI),
      DISCORD_BOT_TOKEN: Boolean(process.env.DISCORD_BOT_TOKEN),
      DISCORD_CLIENT_ID: Boolean(process.env.DISCORD_CLIENT_ID),
      DISCORD_CLIENT_SECRET: Boolean(process.env.DISCORD_CLIENT_SECRET),
      NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
      NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL)
    }
  }
}

export async function getDevDatabaseStatus() {
  await connectToDatabase()

  const readyState = mongoose.connection.readyState
  const labels: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }

  let pingMs: number | null = null
  if (mongoose.connection.db) {
    const started = Date.now()
    await mongoose.connection.db.admin().command({ ping: 1 })
    pingMs = Date.now() - started
  }

  return {
    readyState,
    readyStateLabel: labels[readyState] ?? 'unknown',
    pingMs,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  }
}

export async function getDevGuildCounts(
  guildId: string
): Promise<DevGuildCounts> {
  await connectToDatabase()

  const [
    users,
    registeredUsers,
    transactions,
    atmPending,
    atmApproved,
    atmRejected,
    predictions,
    raffles,
    vipRooms,
    blackjackGames
  ] = await Promise.all([
    User.countDocuments({ guildId }),
    User.countDocuments({ guildId, registered: true }),
    Transaction.countDocuments({ guildId }),
    AtmRequest.countDocuments({ guildId, status: 'pending' }),
    AtmRequest.countDocuments({ guildId, status: 'approved' }),
    AtmRequest.countDocuments({ guildId, status: 'rejected' }),
    Prediction.countDocuments({ guildId }),
    Raffle.countDocuments({ guildId }),
    VipRoom.countDocuments({ guildId }),
    BlackjackGame.countDocuments({ guildId })
  ])

  return {
    users,
    registeredUsers,
    transactions,
    atmPending,
    atmApproved,
    atmRejected,
    predictions,
    raffles,
    vipRooms,
    blackjackGames
  }
}

export async function getDevFeatureFlags(
  guildId: string
): Promise<DevFeatureFlag[]> {
  await connectToDatabase()
  const config = await GuildConfiguration.findOne({ guildId })
    .select('globalSettings')
    .lean()

  const globalSettings = normalizeGlobalSettings(
    config?.globalSettings as Partial<GlobalSettings> | undefined
  )

  const guildConfig = { globalSettings } as Parameters<
    typeof isGlobalFeatureDisabled
  >[0]

  return GLOBAL_FEATURES.map((feature) => ({
    feature,
    disabled: isGlobalFeatureDisabled(guildConfig, feature)
  }))
}

export async function getDevGuildConfig(guildId: string) {
  await connectToDatabase()
  const config = await GuildConfiguration.findOne({ guildId }).lean()
  return config ? serializeForDev(config) : null
}

export async function getDevRecentTransactions(guildId: string, limit = 10) {
  await connectToDatabase()

  const rows = await Transaction.find({ guildId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('userId type source amount createdAt referenceId')
    .lean()

  return serializeForDev(rows)
}

export async function getDevChannelChecks(
  guildId: string
): Promise<DevChannelCheck[]> {
  await connectToDatabase()
  const [config, channels] = await Promise.all([
    GuildConfiguration.findOne({ guildId }).lean(),
    getGuildChannels(guildId)
  ])

  const channelById = new Map(channels.map((channel) => [channel.id, channel]))

  const entries: Array<{ key: string; channelId: string | null | undefined }> =
    [
      { key: 'atm.actions', channelId: config?.atmChannelIds?.actions },
      { key: 'atm.logs', channelId: config?.atmChannelIds?.logs },
      { key: 'winAnnouncements', channelId: config?.winAnnouncementsChannelId },
      {
        key: 'prediction.actions',
        channelId: config?.predictionChannelIds?.actions
      },
      { key: 'prediction.logs', channelId: config?.predictionChannelIds?.logs },
      { key: 'raffle.actions', channelId: config?.raffleChannelIds?.actions },
      { key: 'raffle.logs', channelId: config?.raffleChannelIds?.logs },
      ...(config?.casinoChannelIds ?? []).map((channelId, index) => ({
        key: `casino.${index + 1}`,
        channelId
      }))
    ]

  return entries.map(({ key, channelId }) => {
    const normalizedId = channelId ?? null
    const match = normalizedId ? channelById.get(normalizedId) : undefined

    return {
      key,
      channelId: normalizedId,
      exists: normalizedId ? Boolean(match) : false,
      name: match?.name ?? null
    }
  })
}

export async function getDevBotPresence(guildId: string) {
  const inGuild = await isBotInGuild(guildId)
  return { inGuild }
}

export async function invalidateDevDiscordCaches(guildId: string) {
  await invalidateGuildChannelsCache(guildId)
  return { guildId, invalidated: ['guildChannels'] as const }
}
