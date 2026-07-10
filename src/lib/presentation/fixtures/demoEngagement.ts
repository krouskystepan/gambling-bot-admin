import type { TPrediction } from 'gambling-bot-shared/predictions'
import type { TRaffleStatus } from 'gambling-bot-shared/raffle'

import type { PredictionPageContext } from '@/actions/database/predictionActions.action'
import type { RafflePageContext } from '@/actions/database/raffleActions.action'
import type { VipPageContext } from '@/actions/database/vipActions.action'
import type { TPredictionRow, TRaffleRow, TVipChannels } from '@/types/types'

import {
  DEMO_MEMBERS,
  getDemoAvatar,
  getDemoDiscordMembers,
  getDemoUsername
} from './demoGuild'
import { createDemoRng, pick, randInt } from './demoRng'

const DAY = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

type PredSeed = {
  title: string
  status: TPrediction['status']
  choices: string[]
}

const PREDICTION_SEEDS: PredSeed[] = [
  {
    title: 'Will BTC close above $80k this Friday?',
    status: 'ended',
    choices: ['Yes', 'No']
  },
  {
    title: 'Who wins the Saturday tournament?',
    status: 'active',
    choices: ['Team Nova', 'Team Vortex', 'Team Apex']
  },
  {
    title: 'Next map: will attackers win round 1?',
    status: 'active',
    choices: ['Attackers', 'Defenders']
  },
  {
    title: 'Will the raffle pot exceed $10k tonight?',
    status: 'paid',
    choices: ['Yes', 'No']
  },
  {
    title: 'First blood in the finals?',
    status: 'active',
    choices: ['Blue side', 'Red side']
  },
  {
    title: 'Will we hit 1,000 concurrent players?',
    status: 'paid',
    choices: ['Yes', 'No']
  }
]

function buildPredictions(): TPredictionRow[] {
  const rng = createDemoRng(0x9ed1c7)
  const now = Date.now()

  return PREDICTION_SEEDS.map((seed, index) => {
    const creator = pick(rng, DEMO_MEMBERS)
    const createdAt = new Date(now - (index + 1) * randInt(rng, 1, 4) * DAY)

    const choices = seed.choices.map((choiceName) => {
      const betCount = randInt(rng, 2, 8)
      const bets = Array.from({ length: betCount }, (_, i) => {
        const bettor = pick(rng, DEMO_MEMBERS)
        return {
          userId: bettor.userId,
          amount: randInt(rng, 1, 20) * 50,
          betId: `demo-bet-${index}-${choiceName}-${i}`
        }
      })
      return {
        choiceName,
        odds: Number((1.2 + rng() * 2.5).toFixed(2)),
        bets
      }
    })

    const choicesEnriched = choices.map((choice) => {
      const totalAmount = choice.bets.reduce((sum, b) => sum + b.amount, 0)
      return {
        choiceName: choice.choiceName,
        odds: choice.odds,
        betCount: choice.bets.length,
        totalAmount
      }
    })

    const totalBetAmount = choicesEnriched.reduce(
      (sum, c) => sum + c.totalAmount,
      0
    )
    const bettorCount = new Set(
      choices.flatMap((c) => c.bets.map((b) => b.userId))
    ).size

    return {
      predictionId: `demo-pred-${index}`,
      guildId: '',
      channelId: `demo-channel-pred`,
      creatorId: creator.userId,
      title: seed.title,
      choices,
      status: seed.status,
      autolock:
        seed.status === 'active'
          ? new Date(now + randInt(rng, 1, 3) * DAY)
          : null,
      createdAt,
      updatedAt: createdAt,
      channelName: 'predictions',
      creatorUsername: getDemoUsername(creator.userId),
      creatorAvatar: getDemoAvatar(creator.userId),
      totalBetAmount,
      bettorCount,
      choicesEnriched
    }
  })
}

let cachedPredictions: TPredictionRow[] | null = null
function predictions(): TPredictionRow[] {
  cachedPredictions ??= buildPredictions()
  return cachedPredictions
}

export type DemoPredictionsQuery = {
  page?: number
  limit?: number
  search?: string
  userId?: string
  status?: TPrediction['status'] | 'all'
}

export function getDemoPredictions(query: DemoPredictionsQuery): {
  predictions: TPredictionRow[]
  total: number
} {
  let rows = predictions()
  if (query.status && query.status !== 'all') {
    rows = rows.filter((row) => row.status === query.status)
  }
  if (query.userId) rows = rows.filter((row) => row.creatorId === query.userId)
  if (query.search) {
    const term = query.search.toLowerCase()
    rows = rows.filter((row) => row.title.toLowerCase().includes(term))
  }

  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  return { predictions: rows.slice(start, start + limit), total: rows.length }
}

export function getDemoPredictionPageContext(): PredictionPageContext {
  return {
    predictionConfigured: true,
    logsChannelConfigured: true,
    predictionFeatureBlocked: false,
    predictionFeatureBlockMessage: null
  }
}

// ---------------------------------------------------------------------------
// Raffles
// ---------------------------------------------------------------------------

function buildRaffles(): TRaffleRow[] {
  const rng = createDemoRng(0x4aff1e)
  const now = Date.now()
  const statuses: TRaffleStatus[] = ['active', 'active', 'active', 'canceled']

  return statuses.map((status, index) => {
    const creator = pick(rng, DEMO_MEMBERS)
    const ticketPrice = randInt(rng, 1, 5) * 100
    const participants = Array.from({ length: randInt(rng, 3, 9) }, () => {
      const p = pick(rng, DEMO_MEMBERS)
      return { userId: p.userId, tickets: randInt(rng, 1, 10) }
    })
    const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0)
    const createdAt = new Date(now - (index + 1) * randInt(rng, 1, 6) * DAY)
    const drawIntervalMs = 7 * DAY

    return {
      drawId: `demo-draw-${index}`,
      raffleId: `demo-raffle-${index}`,
      guildId: '',
      channelId: 'demo-channel-raffle',
      creatorId: creator.userId,
      ticketPrice,
      maxTicketsPerUser: 10,
      nextDrawAt: new Date(now + randInt(rng, 1, 5) * DAY),
      lastDrawAt: undefined,
      drawIntervalMs,
      status,
      participants,
      createdAt,
      updatedAt: createdAt,
      channelName: 'raffles',
      creatorUsername: getDemoUsername(creator.userId),
      creatorAvatar: getDemoAvatar(creator.userId),
      totalTickets,
      totalPot: totalTickets * ticketPrice,
      intervalLabel: '1 week',
      participantCount: participants.filter((p) => p.tickets > 0).length
    }
  })
}

let cachedRaffles: TRaffleRow[] | null = null
function raffles(): TRaffleRow[] {
  cachedRaffles ??= buildRaffles()
  return cachedRaffles
}

export type DemoRafflesQuery = {
  page?: number
  limit?: number
  search?: string
  userId?: string
  status?: TRaffleStatus | 'all'
}

export function getDemoRaffles(query: DemoRafflesQuery): {
  raffles: TRaffleRow[]
  total: number
} {
  let rows = raffles()
  if (query.status && query.status !== 'all') {
    rows = rows.filter((row) => row.status === query.status)
  }
  if (query.userId) rows = rows.filter((row) => row.creatorId === query.userId)

  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  return { raffles: rows.slice(start, start + limit), total: rows.length }
}

export function getDemoRafflePageContext(): RafflePageContext {
  return {
    raffleConfigured: true,
    raffleFeatureBlocked: false,
    raffleFeatureBlockMessage: null
  }
}

// ---------------------------------------------------------------------------
// VIP rooms
// ---------------------------------------------------------------------------

function buildVips(): TVipChannels[] {
  const rng = createDemoRng(0x71b005)
  const now = Date.now()
  const owners = DEMO_MEMBERS.slice(0, 5)

  return owners.map((owner, index) => {
    const memberPool = DEMO_MEMBERS.filter((m) => m.userId !== owner.userId)
    const members = Array.from({ length: randInt(rng, 1, 4) }, () =>
      pick(rng, memberPool)
    )
      .filter((m, i, arr) => arr.findIndex((x) => x.userId === m.userId) === i)
      .map((m) => ({
        userId: m.userId,
        username: m.username,
        nickname: m.nickname ?? '',
        avatar: getDemoAvatar(m.userId)
      }))

    return {
      ownerId: owner.userId,
      guildId: '',
      channelId: `demo-vip-${index}`,
      expiresAt: new Date(now + randInt(rng, 3, 45) * DAY),
      createdAt: new Date(now - randInt(rng, 1, 30) * DAY),
      channelName: `vip-${owner.username.toLowerCase()}`,
      username: owner.username,
      nickname: owner.nickname ?? '',
      avatar: getDemoAvatar(owner.userId),
      members
    }
  })
}

let cachedVips: TVipChannels[] | null = null
function vips(): TVipChannels[] {
  cachedVips ??= buildVips()
  return cachedVips
}

export type DemoVipsQuery = {
  page?: number
  limit?: number
  search?: string
  userId?: string
}

export function getDemoVips(query: DemoVipsQuery): {
  vips: TVipChannels[]
  total: number
} {
  let rows = vips()
  if (query.userId) rows = rows.filter((row) => row.ownerId === query.userId)
  if (query.search) {
    const term = query.search.toLowerCase()
    rows = rows.filter((row) => row.channelName.toLowerCase().includes(term))
  }

  const page = query.page && query.page > 0 ? query.page : 1
  const limit = query.limit && query.limit > 0 ? query.limit : 10
  const start = (page - 1) * limit
  return { vips: rows.slice(start, start + limit), total: rows.length }
}

export function getDemoVipPageContext(): VipPageContext {
  return {
    maxMembers: 5,
    vipConfigured: true,
    vipFeatureBlocked: false,
    vipFeatureBlockMessage: null,
    activeVipOwnerIds: vips().map((vip) => vip.ownerId),
    members: getDemoDiscordMembers()
  }
}
