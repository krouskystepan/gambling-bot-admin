'use server'

import { defaultCasinoSettings } from 'gambling-bot-shared/casino'
import { type GuildWipeEntity, runGuildDataWipe } from 'gambling-bot-shared/dev'
import {
  type TGuildConfiguration,
  defaultGlobalSettings
} from 'gambling-bot-shared/guild'

import { revalidatePath } from 'next/cache'

import { invalidateGuildChannelsCache } from '@/actions/discord/channel.action'
import { connectToDatabase } from '@/lib/db'
import { requireDevAction } from '@/lib/dev/requireDevAction'
import AtmRequest from '@/models/AtmRequest'
import BlackjackGame from '@/models/BlackjackGame'
import GuildConfiguration from '@/models/GuildConfiguration'
import Prediction from '@/models/Prediction'
import Raffle from '@/models/Raffle'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import VipRoom from '@/models/VipRoom'

const WIPE_MODELS = {
  transactions: Transaction,
  atmRequests: AtmRequest,
  raffles: Raffle,
  predictions: Prediction,
  vipRooms: VipRoom,
  blackjackGames: BlackjackGame,
  users: User
} as const

const DEFAULT_VIP_SETTINGS: TGuildConfiguration['vipSettings'] = {
  roleOwnerId: '',
  roleMemberId: '',
  categoryId: '',
  pricePerDay: 0,
  pricePerCreate: 0,
  pricePerAdditionalMember: 0,
  maxMembers: 2
}

const DEFAULT_BONUS_SETTINGS: TGuildConfiguration['bonusSettings'] = {
  rewardMode: 'linear',
  baseReward: 0,
  streakIncrement: 0,
  streakMultiplier: 0,
  maxReward: 0,
  resetOnMax: false,
  milestoneBonus: {
    weekly: 0,
    monthly: 0
  }
}

export type GuildConfigResetScope =
  | 'casino'
  | 'global'
  | 'channels'
  | 'vip'
  | 'bonus'
  | 'all'

type DevDataOpsError = { ok: false; error: string }

type DevDataOpsSuccess<T> = { ok: true } & T

function validateConfirmationPhrase(
  guildId: string,
  confirmationPhrase: string
): DevDataOpsError | null {
  if (confirmationPhrase.trim() !== guildId) {
    return {
      ok: false,
      error: 'Confirmation phrase must exactly match the guild ID.'
    }
  }

  return null
}

function revalidateGuildDashboard(guildId: string) {
  const paths = [
    `/dashboard/g/${guildId}`,
    `/dashboard/g/${guildId}/overview`,
    `/dashboard/g/${guildId}/health`,
    `/dashboard/g/${guildId}/atm-queue`,
    `/dashboard/g/${guildId}/transactions`,
    `/dashboard/g/${guildId}/users`,
    `/dashboard/g/${guildId}/predictions`,
    `/dashboard/g/${guildId}/raffles`,
    `/dashboard/g/${guildId}/vips`,
    `/dashboard/g/${guildId}/dev-data`
  ]

  for (const path of paths) {
    revalidatePath(path, path === `/dashboard/g/${guildId}` ? 'layout' : 'page')
  }
}

function normalizeConfigResetScopes(
  scopes: GuildConfigResetScope[]
): Exclude<GuildConfigResetScope, 'all'>[] {
  if (scopes.includes('all')) {
    return ['casino', 'global', 'channels', 'vip', 'bonus']
  }

  return scopes.filter(
    (scope): scope is Exclude<GuildConfigResetScope, 'all'> => scope !== 'all'
  )
}

export async function devWipeGuildData({
  guildId,
  entities,
  confirmationPhrase
}: {
  guildId: string
  entities: GuildWipeEntity[]
  confirmationPhrase: string
}): Promise<
  DevDataOpsError | DevDataOpsSuccess<{ deleted: Record<string, number> }>
> {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  const phraseError = validateConfirmationPhrase(guildId, confirmationPhrase)
  if (phraseError) return phraseError

  if (entities.length === 0) {
    return { ok: false, error: 'Select at least one collection to wipe.' }
  }

  await connectToDatabase()

  const summary = await runGuildDataWipe({
    guildId,
    entities,
    models: WIPE_MODELS
  })

  revalidateGuildDashboard(guildId)

  return { ok: true, deleted: summary.deleted }
}

export async function devResetGuildConfig({
  guildId,
  scopes,
  confirmationPhrase
}: {
  guildId: string
  scopes: GuildConfigResetScope[]
  confirmationPhrase: string
}): Promise<
  | DevDataOpsError
  | DevDataOpsSuccess<{ reset: string[]; channelsCleared: boolean }>
> {
  const access = await requireDevAction(guildId)
  if (!access.ok) return access

  const phraseError = validateConfirmationPhrase(guildId, confirmationPhrase)
  if (phraseError) return phraseError

  const normalizedScopes = normalizeConfigResetScopes(scopes)
  if (normalizedScopes.length === 0) {
    return {
      ok: false,
      error: 'Select at least one configuration area to reset.'
    }
  }

  await connectToDatabase()

  const config = await GuildConfiguration.findOne({ guildId })
  if (!config) {
    return { ok: false, error: 'Guild configuration not found.' }
  }

  const reset: string[] = []

  if (normalizedScopes.includes('casino')) {
    config.casinoSettings = defaultCasinoSettings
    reset.push('casinoSettings')
  }

  if (normalizedScopes.includes('global')) {
    config.globalSettings = defaultGlobalSettings
    reset.push('globalSettings')
  }

  if (normalizedScopes.includes('channels')) {
    config.atmChannelIds = { actions: '', logs: '' }
    config.casinoChannelIds = []
    config.winAnnouncementsChannelId = ''
    config.predictionChannelIds = { actions: '', logs: '' }
    config.raffleChannelIds = { actions: '', logs: '' }
    config.managerRoleId = ''
    config.bannedRoleId = ''
    reset.push('channelsAndRoles')
  }

  if (normalizedScopes.includes('vip')) {
    config.vipSettings = DEFAULT_VIP_SETTINGS
    reset.push('vipSettings')
  }

  if (normalizedScopes.includes('bonus')) {
    config.bonusSettings = DEFAULT_BONUS_SETTINGS
    reset.push('bonusSettings')
  }

  await config.save()

  const channelsCleared = normalizedScopes.includes('channels')
  if (channelsCleared) {
    await invalidateGuildChannelsCache(guildId)
  }

  revalidateGuildDashboard(guildId)

  return { ok: true, reset, channelsCleared }
}
