import { normalizeBonusSettings } from 'gambling-bot-shared/bonus'
import {
  defaultCasinoSettings,
  normalizeCasinoSettings
} from 'gambling-bot-shared/casino'
import { normalizeGlobalSettings } from 'gambling-bot-shared/guild'

import type {
  DevChannelCheck,
  DevEnvStatus,
  DevGuildCounts
} from '@/lib/dev/devGuildDiagnostics'

import { DEMO_MEMBERS, DEMO_TIMEZONE, demoGlobalSettings } from './demoGuild'
import { createDemoRng, pick, randInt } from './demoRng'

/** Connectivity snapshot — always a healthy, connected demo cluster. */
export function getDemoDevDatabaseStatus() {
  return {
    readyState: 1,
    readyStateLabel: 'connected',
    pingMs: 14,
    host: 'demo-cluster.mongodb.net',
    name: 'gambling-bot-demo'
  }
}

/** Env snapshot — every required variable is present in the demo. */
export function getDemoDevEnvStatus(): DevEnvStatus {
  return {
    nodeEnv: 'production',
    deployment: 'Vercel',
    variables: {
      MONGO_URI: true,
      DISCORD_BOT_TOKEN: true,
      DISCORD_CLIENT_ID: true,
      DISCORD_CLIENT_SECRET: true,
      NEXTAUTH_SECRET: true,
      NEXTAUTH_URL: true
    }
  }
}

/** Collection document counts for the demo guild. */
export function getDemoDevGuildCounts(): DevGuildCounts {
  return {
    users: 1284,
    registeredUsers: 987,
    transactions: 41230,
    atmPending: 3,
    atmApproved: 612,
    atmRejected: 47,
    predictions: 58,
    raffles: 24,
    vipRooms: 11,
    blackjackGames: 2
  }
}

/** Bot is always present in the demo guild. */
export function getDemoDevBotPresence() {
  return { inGuild: true as const }
}

/** Discord guild preview returned by the "Guild info" dev tool. */
export function getDemoDevDiscordGuild() {
  return {
    id: '000000000000000000',
    name: 'Demo Guild',
    approximateMemberCount: 1284,
    approximatePresenceCount: 342
  }
}

/**
 * Channel verification — every configured channel resolves to a live Discord
 * channel except one intentionally-missing casino overflow channel, so the demo
 * shows both "ok" and "missing" states.
 */
export function getDemoDevChannelChecks(): DevChannelCheck[] {
  return [
    {
      key: 'atm.actions',
      channelId: '200000000000000001',
      exists: true,
      name: 'atm-actions'
    },
    {
      key: 'atm.logs',
      channelId: '200000000000000002',
      exists: true,
      name: 'atm-logs'
    },
    {
      key: 'winAnnouncements',
      channelId: '200000000000000005',
      exists: true,
      name: 'big-wins'
    },
    {
      key: 'prediction.actions',
      channelId: '200000000000000006',
      exists: true,
      name: 'predictions'
    },
    {
      key: 'prediction.logs',
      channelId: '200000000000000007',
      exists: true,
      name: 'prediction-logs'
    },
    {
      key: 'raffle.actions',
      channelId: '200000000000000008',
      exists: true,
      name: 'raffles'
    },
    {
      key: 'raffle.logs',
      channelId: '200000000000000009',
      exists: true,
      name: 'raffle-logs'
    },
    {
      key: 'casino.1',
      channelId: '200000000000000003',
      exists: true,
      name: 'casino-main'
    },
    {
      key: 'casino.2',
      channelId: '200000000000000004',
      exists: true,
      name: 'casino-high-roller'
    }
  ]
}

/** Serialized guild configuration for the "Guild config" dev tool. */
export function getDemoDevGuildConfig() {
  return {
    guildId: '000000000000000000',
    managerRoleId: '300000000000000001',
    bannedRoleId: '300000000000000002',
    atmChannelIds: {
      actions: '200000000000000001',
      logs: '200000000000000002'
    },
    casinoChannelIds: ['200000000000000003', '200000000000000004'],
    winAnnouncementsChannelId: '200000000000000005',
    predictionChannelIds: {
      actions: '200000000000000006',
      logs: '200000000000000007'
    },
    raffleChannelIds: {
      actions: '200000000000000008',
      logs: '200000000000000009'
    },
    globalSettings: demoGlobalSettings,
    casinoSettings: normalizeCasinoSettings(defaultCasinoSettings),
    createdAt: '2024-11-02T09:14:00.000Z',
    updatedAt: '2026-07-07T22:40:00.000Z'
  }
}

const TX_TYPES = ['deposit', 'withdraw', 'bet', 'payout', 'bonus'] as const
const TX_SOURCES = [
  'slots',
  'blackjack',
  'roulette',
  'atm',
  'daily-bonus',
  'raffle'
] as const

/** Recent transactions for the "Recent txs" dev tool. */
export function getDemoDevRecentTransactions() {
  const rng = createDemoRng(0x5e2d)
  const now = Date.now()

  return Array.from({ length: 10 }, (_, index) => {
    const member = pick(rng, DEMO_MEMBERS)
    const type = pick(rng, TX_TYPES)
    return {
      userId: member.userId,
      type,
      source: pick(rng, TX_SOURCES),
      amount: randInt(rng, 50, 5000),
      createdAt: new Date(
        now - index * randInt(rng, 3, 45) * 60_000
      ).toISOString(),
      referenceId: `demo-tx-${(index + 1).toString().padStart(4, '0')}`
    }
  })
}

/**
 * Normalized settings for the Simulations (dev-calcs) page, mirroring the shape
 * the real page derives from MongoDB — but sourced entirely from fixtures.
 */
export function getDemoDevCalcsSettings() {
  return {
    casinoSettings: normalizeCasinoSettings(defaultCasinoSettings),
    bonusSettings: normalizeBonusSettings({
      rewardMode: 'linear',
      baseReward: 100,
      streakIncrement: 25,
      streakMultiplier: 1,
      maxReward: 500,
      resetOnMax: false,
      milestoneBonus: { weekly: 250, monthly: 1000 }
    }),
    globalSettings: normalizeGlobalSettings({
      ...demoGlobalSettings,
      timezone: DEMO_TIMEZONE
    })
  }
}
