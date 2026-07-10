import { normalizeBonusSettings } from 'gambling-bot-shared/bonus'
import { bonusFormSchema } from 'gambling-bot-shared/bonus'
import {
  defaultCasinoSettings,
  normalizeCasinoSettings
} from 'gambling-bot-shared/casino'
import {
  globalSettingsFormSchema,
  normalizeGlobalSettings
} from 'gambling-bot-shared/guild'

import { casinoSettingsSchema } from '@/types/schemas'
import type {
  TBonusFormValues,
  TCasinoSettingsValues,
  TChannelsFormValues,
  TGlobalSettingsFormValues,
  TVipSettingsValues
} from '@/types/types'
import type { IGuildChannel, IGuildRole } from '@/types/types'

import { demoGlobalSettings } from './demoGuild'

const DEMO_CHANNEL_IDS = {
  atmActions: '200000000000000001',
  atmLogs: '200000000000000002',
  casinoMain: '200000000000000003',
  casinoHighRoller: '200000000000000004',
  winAnnouncements: '200000000000000005',
  predictionActions: '200000000000000006',
  predictionLogs: '200000000000000007',
  raffleActions: '200000000000000008',
  raffleLogs: '200000000000000009',
  workerLogs: '200000000000000010'
} as const

const DEMO_ROLE_IDS = {
  manager: '300000000000000001',
  banned: '300000000000000002',
  vipOwner: '300000000000000003',
  vipMember: '300000000000000004'
} as const

const DEMO_CATEGORY_ID = '400000000000000001'

export function getDemoGlobalSettings(): TGlobalSettingsFormValues {
  return globalSettingsFormSchema.parse(
    normalizeGlobalSettings(demoGlobalSettings)
  )
}

export function getDemoCasinoSettings(): TCasinoSettingsValues {
  return casinoSettingsSchema.parse(
    normalizeCasinoSettings(defaultCasinoSettings)
  )
}

export function getDemoChannels(): TChannelsFormValues {
  return {
    atm: {
      actions: DEMO_CHANNEL_IDS.atmActions,
      logs: DEMO_CHANNEL_IDS.atmLogs
    },
    casino: {
      casinoChannelIds: [
        DEMO_CHANNEL_IDS.casinoMain,
        DEMO_CHANNEL_IDS.casinoHighRoller
      ],
      winAnnouncementsChannelId: DEMO_CHANNEL_IDS.winAnnouncements
    },
    prediction: {
      actions: DEMO_CHANNEL_IDS.predictionActions,
      logs: DEMO_CHANNEL_IDS.predictionLogs
    },
    raffle: {
      actions: DEMO_CHANNEL_IDS.raffleActions,
      logs: DEMO_CHANNEL_IDS.raffleLogs
    },
    workerLogChannelId: DEMO_CHANNEL_IDS.workerLogs
  }
}

export function getDemoBonusSettings(): TBonusFormValues {
  return bonusFormSchema.parse(
    normalizeBonusSettings({
      rewardMode: 'linear',
      baseReward: 100,
      streakIncrement: 25,
      streakMultiplier: 1,
      maxReward: 500,
      resetOnMax: false,
      milestoneBonus: { weekly: 250, monthly: 1000 }
    })
  )
}

export function getDemoVipSettings(): TVipSettingsValues {
  return {
    roleOwnerId: DEMO_ROLE_IDS.vipOwner,
    roleMemberId: DEMO_ROLE_IDS.vipMember,
    categoryId: DEMO_CATEGORY_ID,
    pricePerDay: 500,
    pricePerCreate: 2500,
    pricePerAdditionalMember: 300,
    maxMembers: 5
  }
}

export function getDemoModerationSettings(): {
  managerRoleId: string
  bannedRoleId: string
} {
  return {
    managerRoleId: DEMO_ROLE_IDS.manager,
    bannedRoleId: DEMO_ROLE_IDS.banned
  }
}

/** Text channels for channel pickers in settings forms. */
export function getDemoGuildChannels(): IGuildChannel[] {
  return [
    { id: DEMO_CHANNEL_IDS.atmActions, name: 'atm-actions', type: 0 },
    { id: DEMO_CHANNEL_IDS.atmLogs, name: 'atm-logs', type: 0 },
    { id: DEMO_CHANNEL_IDS.casinoMain, name: 'casino-main', type: 0 },
    {
      id: DEMO_CHANNEL_IDS.casinoHighRoller,
      name: 'casino-high-roller',
      type: 0
    },
    { id: DEMO_CHANNEL_IDS.winAnnouncements, name: 'big-wins', type: 0 },
    { id: DEMO_CHANNEL_IDS.predictionActions, name: 'predictions', type: 0 },
    { id: DEMO_CHANNEL_IDS.predictionLogs, name: 'prediction-logs', type: 0 },
    { id: DEMO_CHANNEL_IDS.raffleActions, name: 'raffles', type: 0 },
    { id: DEMO_CHANNEL_IDS.raffleLogs, name: 'raffle-logs', type: 0 },
    { id: DEMO_CHANNEL_IDS.workerLogs, name: 'worker-logs', type: 0 }
  ] as IGuildChannel[]
}

export function getDemoGuildRoles(): IGuildRole[] {
  return [
    { id: DEMO_ROLE_IDS.manager, name: 'Casino Manager', color: 0x5865f2 },
    { id: DEMO_ROLE_IDS.banned, name: 'Banned', color: 0xed4245 },
    { id: DEMO_ROLE_IDS.vipOwner, name: 'VIP Owner', color: 0xfee75c },
    { id: DEMO_ROLE_IDS.vipMember, name: 'VIP Member', color: 0x57f287 }
  ] as IGuildRole[]
}

export function getDemoGuildCategories(): IGuildChannel[] {
  return [
    { id: DEMO_CATEGORY_ID, name: 'VIP Rooms', type: 4 }
  ] as IGuildChannel[]
}
