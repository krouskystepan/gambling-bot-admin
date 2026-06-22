'use server'

import { type TAtmRequest } from 'gambling-bot-shared/atm'
import { type TBlackjackGame } from 'gambling-bot-shared/blackjack'
import { type GlobalSettings } from 'gambling-bot-shared/guild'
import { type TPrediction } from 'gambling-bot-shared/predictions'
import { Session } from 'next-auth'

import { requireGuildAccess } from '@/actions/perms'
import { connectToDatabase } from '@/lib/db'
import { discordMessageLink } from '@/lib/discord/messageLink'
import { formatGuildMoneyExact } from '@/lib/guild/guildMoney'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'
import { formatAgeMs, formatStaleAge } from '@/lib/systemHealth/formatAge'
import {
  atmStalePendingCutoff,
  blackjackStaleCutoff,
  predictionStuckPayingCutoff
} from '@/lib/systemHealth/thresholds'
import AtmRequest from '@/models/AtmRequest'
import BlackjackGame from '@/models/BlackjackGame'
import Prediction from '@/models/Prediction'

export type SystemHealthSeverity = 'ok' | 'warning' | 'attention'

export type SystemHealthRow = {
  id: string
  label: string
  count: number
  severity: SystemHealthSeverity
  href?: string
  tooltip?: string
}

export type SystemHealthItem = {
  userId?: string
  title: string
  subtitle: string
  discordHref?: string
  adminHref?: string
  ageMs: number
}

export type SystemHealthCategory = {
  rows: SystemHealthRow[]
  items: SystemHealthItem[]
}

export type SystemHealthSummary = {
  needsAttention: number
  pendingAtm: number
  staleBlackjack: number
  predictionsAwaitingAction: number
}

export type SystemHealthData = {
  needsAttention: number
  summary: SystemHealthSummary
  atm: SystemHealthCategory
  blackjack: SystemHealthCategory
  predictions: SystemHealthCategory
}

const atmQueueHref = (guildId: string) =>
  `/dashboard/g/${guildId}/atm-queue?filterStatus=pending`

const userHref = (guildId: string, userId: string) =>
  `/dashboard/g/${guildId}/users/${userId}`

const rowSeverity = (
  count: number,
  level: 'ok' | 'warning' | 'attention'
): SystemHealthSeverity => {
  if (count <= 0) return 'ok'
  return level
}

const computeNeedsAttention = (counts: {
  pendingAtm: number
  staleBlackjack: number
  overdueAutolock: number
  endedPredictions: number
  stuckPaying: number
}) =>
  counts.pendingAtm +
  counts.staleBlackjack +
  counts.overdueAutolock +
  counts.endedPredictions +
  counts.stuckPaying

type AttentionCounts = {
  pendingAtm: number
  staleAtmPending: number
  activeBlackjack: number
  staleBlackjack: number
  overdueAutolock: number
  endedPredictions: number
  stuckPaying: number
  activePredictions: number
}

const fetchAttentionCounts = async (
  guildId: string
): Promise<AttentionCounts> => {
  const now = new Date()
  const blackjackStale = blackjackStaleCutoff()
  const stuckPayingCutoff = predictionStuckPayingCutoff()
  const atmStale = atmStalePendingCutoff()

  const [
    pendingAtm,
    staleAtmPending,
    activeBlackjack,
    staleBlackjack,
    overdueAutolock,
    endedPredictions,
    stuckPaying,
    activePredictions
  ] = await Promise.all([
    AtmRequest.countDocuments({ guildId, status: 'pending' }),
    AtmRequest.countDocuments({
      guildId,
      status: 'pending',
      createdAt: { $lte: atmStale }
    }),
    BlackjackGame.countDocuments({ guildId }),
    BlackjackGame.countDocuments({
      guildId,
      updatedAt: { $lte: blackjackStale }
    }),
    Prediction.countDocuments({
      guildId,
      status: 'active',
      autolock: { $ne: null, $lte: now }
    }),
    Prediction.countDocuments({ guildId, status: 'ended' }),
    Prediction.countDocuments({
      guildId,
      status: 'paying',
      updatedAt: { $lte: stuckPayingCutoff }
    }),
    Prediction.countDocuments({
      guildId,
      status: 'active',
      $or: [{ autolock: null }, { autolock: { $gt: now } }]
    })
  ])

  return {
    pendingAtm,
    staleAtmPending,
    activeBlackjack,
    staleBlackjack,
    overdueAutolock,
    endedPredictions,
    stuckPaying,
    activePredictions
  }
}

const mapAtmItem = (
  guildId: string,
  request: TAtmRequest,
  globalSettings: GlobalSettings
): SystemHealthItem => {
  const ageMs = Date.now() - new Date(request.createdAt).getTime()
  const typeLabel = request.type === 'deposit' ? 'Deposit' : 'Withdraw'

  return {
    userId: request.userId,
    title: `${typeLabel} · ${formatGuildMoneyExact(request.amount, globalSettings)}`,
    subtitle: formatAgeMs(ageMs),
    adminHref: userHref(guildId, request.userId),
    ageMs
  }
}

const mapBlackjackItem = (
  guildId: string,
  game: TBlackjackGame,
  staleCutoff: Date
): SystemHealthItem => {
  const updatedAt = new Date(game.updatedAt)
  const ageMs = Date.now() - updatedAt.getTime()
  const isStale = updatedAt <= staleCutoff

  return {
    userId: game.userId,
    title: `Blackjack · ${game.phase}`,
    subtitle: isStale
      ? `${formatStaleAge(ageMs)} · ${game.phase} phase`
      : `${formatAgeMs(ageMs)} · ${game.phase} phase`,
    discordHref: discordMessageLink(guildId, game.channelId, game.messageId),
    adminHref: userHref(guildId, game.userId),
    ageMs
  }
}

const mapPredictionItem = (
  guildId: string,
  prediction: TPrediction,
  now: Date,
  stuckPayingCutoff: Date
): SystemHealthItem => {
  const updatedAt = new Date(prediction.updatedAt)
  const ageMs = Date.now() - updatedAt.getTime()

  let subtitle = formatAgeMs(ageMs)
  if (
    prediction.status === 'active' &&
    prediction.autolock &&
    new Date(prediction.autolock) <= now
  ) {
    const overdueMs = now.getTime() - new Date(prediction.autolock).getTime()
    subtitle = `Autolock overdue · ${formatAgeMs(overdueMs)}`
  } else if (prediction.status === 'ended') {
    subtitle = `Awaiting payout · ${formatAgeMs(ageMs)}`
  } else if (prediction.status === 'paying' && updatedAt <= stuckPayingCutoff) {
    subtitle = `Stuck paying · ${formatAgeMs(ageMs)}`
  }

  return {
    title: prediction.title,
    subtitle,
    discordHref: discordMessageLink(
      guildId,
      prediction.channelId,
      prediction.predictionId
    ),
    ageMs
  }
}

const buildRows = (
  guildId: string,
  counts: AttentionCounts
): Pick<SystemHealthData, 'atm' | 'blackjack' | 'predictions'> => {
  const queueHref = atmQueueHref(guildId)

  return {
    atm: {
      rows: [
        {
          id: 'pending',
          label: 'Pending requests',
          count: counts.pendingAtm,
          severity: rowSeverity(counts.pendingAtm, 'attention'),
          href: counts.pendingAtm > 0 ? queueHref : undefined,
          tooltip: 'Deposit and withdraw requests awaiting staff action'
        },
        {
          id: 'stale-pending',
          label: 'Stale pending (>24h)',
          count: counts.staleAtmPending,
          severity: rowSeverity(counts.staleAtmPending, 'warning'),
          href: counts.staleAtmPending > 0 ? queueHref : undefined,
          tooltip: 'Pending requests older than 24 hours'
        }
      ],
      items: []
    },
    blackjack: {
      rows: [
        {
          id: 'active',
          label: 'Active games',
          count: counts.activeBlackjack,
          severity: 'ok',
          tooltip: 'In-progress blackjack sessions'
        },
        {
          id: 'stale',
          label: 'Stale games (>24h)',
          count: counts.staleBlackjack,
          severity: rowSeverity(counts.staleBlackjack, 'attention'),
          tooltip:
            'Games with no update for 24+ hours (autostand worker threshold)'
        }
      ],
      items: []
    },
    predictions: {
      rows: [
        {
          id: 'active',
          label: 'Active (not overdue)',
          count: counts.activePredictions,
          severity: 'ok',
          tooltip: 'Open predictions before autolock deadline'
        },
        {
          id: 'overdue-autolock',
          label: 'Overdue autolock',
          count: counts.overdueAutolock,
          severity: rowSeverity(counts.overdueAutolock, 'attention'),
          tooltip: 'Active predictions past their autolock time'
        },
        {
          id: 'ended',
          label: 'Awaiting payout',
          count: counts.endedPredictions,
          severity: rowSeverity(counts.endedPredictions, 'attention'),
          tooltip: 'Ended predictions waiting for /prediction payout'
        },
        {
          id: 'stuck-paying',
          label: 'Stuck paying (>10m)',
          count: counts.stuckPaying,
          severity: rowSeverity(counts.stuckPaying, 'attention'),
          tooltip: 'Paying status with no update for 10+ minutes'
        }
      ],
      items: []
    }
  }
}

export const getSystemHealthAttentionCount = async (
  guildId: string,
  _session: Session
): Promise<number> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return 0

  await connectToDatabase()

  const counts = await fetchAttentionCounts(guildId)

  return computeNeedsAttention({
    pendingAtm: counts.pendingAtm,
    staleBlackjack: counts.staleBlackjack,
    overdueAutolock: counts.overdueAutolock,
    endedPredictions: counts.endedPredictions,
    stuckPaying: counts.stuckPaying
  })
}

export const getSystemHealthData = async (
  guildId: string,
  _session: Session
): Promise<SystemHealthData | null> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const now = new Date()
  const blackjackStale = blackjackStaleCutoff()
  const stuckPayingCutoff = predictionStuckPayingCutoff()

  const counts = await fetchAttentionCounts(guildId)
  const categories = buildRows(guildId, counts)

  const needsAttention = computeNeedsAttention({
    pendingAtm: counts.pendingAtm,
    staleBlackjack: counts.staleBlackjack,
    overdueAutolock: counts.overdueAutolock,
    endedPredictions: counts.endedPredictions,
    stuckPaying: counts.stuckPaying
  })

  const predictionsAwaitingAction =
    counts.overdueAutolock + counts.endedPredictions + counts.stuckPaying

  const [globalSettings, atmItems, blackjackItems, predictionItems] =
    await Promise.all([
      getGuildGlobalSettings(guildId),
      AtmRequest.find({ guildId, status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(10)
        .lean<TAtmRequest[]>(),
      counts.staleBlackjack > 0
        ? BlackjackGame.find({
            guildId,
            updatedAt: { $lte: blackjackStale }
          })
            .sort({ updatedAt: 1 })
            .limit(10)
            .lean<TBlackjackGame[]>()
        : BlackjackGame.find({ guildId })
            .sort({ updatedAt: 1 })
            .limit(10)
            .lean<TBlackjackGame[]>(),
      Prediction.find({
        guildId,
        $or: [
          { status: 'ended' },
          {
            status: 'paying',
            updatedAt: { $lte: stuckPayingCutoff }
          },
          {
            status: 'active',
            autolock: { $ne: null, $lte: now }
          }
        ]
      })
        .sort({ updatedAt: 1 })
        .limit(10)
        .lean<TPrediction[]>()
    ])

  return {
    needsAttention,
    summary: {
      needsAttention,
      pendingAtm: counts.pendingAtm,
      staleBlackjack: counts.staleBlackjack,
      predictionsAwaitingAction
    },
    atm: {
      ...categories.atm,
      items: atmItems.map((request) =>
        mapAtmItem(guildId, request, globalSettings)
      )
    },
    blackjack: {
      ...categories.blackjack,
      items: blackjackItems.map((game) =>
        mapBlackjackItem(guildId, game, blackjackStale)
      )
    },
    predictions: {
      ...categories.predictions,
      items: predictionItems.map((prediction) =>
        mapPredictionItem(guildId, prediction, now, stuckPayingCutoff)
      )
    }
  }
}
