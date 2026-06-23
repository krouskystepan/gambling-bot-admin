'use server'

import { normalizeGlobalSettings } from 'gambling-bot-shared/guild'
import { type TPrediction } from 'gambling-bot-shared/predictions'
import {
  createPredictionFormSchema,
  payoutPredictionFormSchema
} from 'gambling-bot-shared/predictions'
import {
  calculatePredictionPayoutSummary,
  getPredictionCheckSummary
} from 'gambling-bot-shared/predictions'
import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import { DateTime } from 'luxon'
import { Session } from 'next-auth'
import { z } from 'zod'

import { revalidatePath } from 'next/cache'

import { getGuildChannels } from '@/actions/discord/channel.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import {
  deletePredictionMessage,
  postPredictionMessage,
  sendPredictionPayoutLog,
  updatePredictionMessageCanceled,
  updatePredictionMessageEnded,
  updatePredictionMessagePaid
} from '@/actions/discord/predictionMessage.action'
import { connectToDatabase } from '@/lib/db'
import { predictionDb, predictionLifecycle } from '@/lib/games/gameServices'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  blockPanelFeatureAction,
  blockPanelMaintenanceAction
} from '@/lib/panel/panelFeatureActionGuard.server'
import { getPanelFeatureBlockMessage } from '@/lib/panel/panelGlobalFeatureGuard'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import { escapeRegExp } from '@/lib/utils'
import GuildConfiguration from '@/models/GuildConfiguration'
import Prediction from '@/models/Prediction'
import { TPredictionDetail, TPredictionRow } from '@/types/types'

import { requireGuildAccess } from '../perms'

type ActionResult = { success: boolean; message: string; rateLimited?: boolean }

export type PredictionPageContext = {
  predictionConfigured: boolean
  logsChannelConfigured: boolean
  predictionFeatureBlocked: boolean
  predictionFeatureBlockMessage: string | null
}

function predictionsPath(guildId: string) {
  return `/dashboard/g/${guildId}/predictions`
}

function channelSettingsPath(guildId: string) {
  return `/dashboard/g/${guildId}/channel-settings`
}

function handleActionError(err: unknown): ActionResult {
  if (err instanceof Error && err.message === 'DiscordRateLimited') {
    return {
      success: false,
      message: 'Discord rate limit reached. Please try again in a moment.',
      rateLimited: true
    }
  }

  console.error('Prediction action failed:', err)
  return { success: false, message: 'Server error, please try again.' }
}

function enrichPredictionRow(
  prediction: TPrediction,
  channelsMap: Map<string, string>,
  membersMap: Map<
    string,
    { username: string; avatarUrl: string; nickname: string | null }
  >
): TPredictionRow {
  const creator = membersMap.get(prediction.creatorId)
  const summary = getPredictionCheckSummary(prediction)

  return {
    ...prediction,
    channelName: channelsMap.get(prediction.channelId) ?? 'Unknown',
    creatorUsername: creator?.username ?? 'Unknown',
    creatorAvatar: creator?.avatarUrl ?? '/default-avatar.jpg',
    totalBetAmount: summary.totalBetAmount,
    bettorCount: summary.bettorCount,
    choicesEnriched: summary.choices.map((choice) => ({
      choiceName: choice.choiceName,
      odds: choice.odds,
      betCount: choice.betCount,
      totalAmount: choice.totalBetAmount
    }))
  }
}

export async function getPredictionPageContext(
  guildId: string
): Promise<PredictionPageContext | null> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const actionsChannelId = guildConfig?.predictionChannelIds?.actions
  const logsChannelId = guildConfig?.predictionChannelIds?.logs

  const predictionFeatureBlockMessage = getPanelFeatureBlockMessage(
    guildConfig?.globalSettings,
    'predictionManagement',
    access.isAdmin
  )

  return {
    predictionConfigured: Boolean(actionsChannelId),
    logsChannelConfigured: Boolean(logsChannelId),
    predictionFeatureBlocked: predictionFeatureBlockMessage !== null,
    predictionFeatureBlockMessage
  }
}

export async function getPredictions(
  guildId: string,
  _session: Session,
  page = 1,
  limit = 10,
  search?: string,
  sort?: string,
  status: TPrediction['status'] | 'all' = 'active'
): Promise<{ predictions: TPredictionRow[]; total: number }> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { predictions: [], total: 0 }
  }

  await connectToDatabase()

  const query: { guildId: string; status?: TPrediction['status'] } = { guildId }
  if (status !== 'all') {
    query.status = status
  }

  const docs = await Prediction.find(query).lean<TPrediction[]>()
  if (!docs.length) return { predictions: [], total: 0 }

  const [discordMembers, guildChannels] = await Promise.all([
    getDiscordGuildMembers(guildId),
    getGuildChannels(guildId)
  ])

  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))
  const channelsMap = new Map(
    guildChannels.map((c) => [c.id, c.name ?? 'Unknown'])
  )

  let predictions = docs.map((prediction) =>
    enrichPredictionRow(prediction, channelsMap, membersMap)
  )

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    predictions = predictions.filter(
      (prediction) =>
        regex.test(prediction.predictionId) ||
        regex.test(prediction.title) ||
        regex.test(prediction.channelName) ||
        regex.test(prediction.creatorUsername) ||
        regex.test(prediction.creatorId)
    )
  }

  if (sort) {
    for (const part of sort.split(',').reverse()) {
      const [field, dir] = part.split(':')

      predictions.sort((a, b) => {
        const av = (a as Record<string, unknown>)[field]
        const bv = (b as Record<string, unknown>)[field]

        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1

        if (av < bv) return dir === 'asc' ? -1 : 1
        if (av > bv) return dir === 'asc' ? 1 : -1
        return 0
      })
    }
  } else {
    predictions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  const total = predictions.length
  const start = (page - 1) * limit

  return {
    predictions: predictions.slice(start, start + limit),
    total
  }
}

export async function getPredictionDetail(
  guildId: string,
  predictionId: string
): Promise<TPredictionDetail | { error: string }> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return { error: access.error }

  await connectToDatabase()

  const prediction = await predictionDb.getPredictionById({
    predictionId,
    guildId
  })

  if (!prediction) return { error: 'Prediction not found.' }

  const discordMembers = await getDiscordGuildMembers(guildId)
  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))
  const summary = getPredictionCheckSummary(prediction)

  return {
    predictionId: prediction.predictionId,
    title: prediction.title,
    status: prediction.status,
    autolock: prediction.autolock,
    choices: summary.choices.map((choice) => ({
      ...choice,
      bets: choice.bets.map((bet) => {
        const member = membersMap.get(bet.userId)
        return {
          ...bet,
          username: member?.username ?? 'Unknown',
          avatar: member?.avatarUrl ?? '/default-avatar.jpg'
        }
      })
    })),
    totalBetAmount: summary.totalBetAmount,
    bettorCount: summary.bettorCount
  }
}

const createPredictionInputSchema = createPredictionFormSchema.extend({
  guildId: z.string().min(1)
})

export async function createPrediction(
  guildId: string,
  values: z.infer<typeof createPredictionFormSchema>
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(
    guildId,
    'predictionManagement',
    access
  )
  if (blocked) return blocked

  const parsed = createPredictionInputSchema.safeParse({ ...values, guildId })
  if (!parsed.success) {
    return { success: false, message: 'Invalid prediction form data.' }
  }

  if (parsed.data.autolock) {
    const autolockDt = DateTime.fromISO(parsed.data.autolock, {
      zone: 'Europe/Prague'
    })
    if (!autolockDt.isValid || autolockDt.toMillis() <= Date.now()) {
      return { success: false, message: 'Autolock must be in the future.' }
    }
  }

  try {
    await connectToDatabase()

    const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
    const actionsChannelId = guildConfig?.predictionChannelIds?.actions
    const logsChannelId = guildConfig?.predictionChannelIds?.logs

    if (!actionsChannelId || !logsChannelId) {
      return {
        success: false,
        message: `Prediction channels are not fully configured. Set actions and logs in ${channelSettingsPath(guildId)}.`
      }
    }

    const choices = parsed.data.choices.map((c) => ({
      choiceName: c.choiceName,
      odds: c.odds,
      bets: [] as TPrediction['choices'][number]['bets']
    }))

    const autolock = parsed.data.autolock
      ? DateTime.fromISO(parsed.data.autolock, {
          zone: 'Europe/Prague'
        }).toJSDate()
      : null

    const messageId = await postPredictionMessage({
      channelId: actionsChannelId,
      title: parsed.data.title,
      choices,
      autolock
    })

    try {
      await predictionDb.createPrediction({
        predictionId: messageId,
        guildId,
        channelId: actionsChannelId,
        creatorId: access.session.userId!,
        title: parsed.data.title,
        choices,
        autolock,
        status: 'active'
      })
    } catch (dbErr) {
      await deletePredictionMessage(actionsChannelId, messageId)
      throw dbErr
    }

    revalidatePath(predictionsPath(guildId))
    revalidateGuildHealth(guildId)

    return {
      success: true,
      message: 'Prediction created and posted to Discord.'
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function endPrediction(
  guildId: string,
  predictionId: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(
    guildId,
    'predictionManagement',
    access
  )
  if (blocked) return blocked

  try {
    await connectToDatabase()

    const updatedPrediction = await predictionLifecycle.endPrediction({
      predictionId,
      guildId
    })

    if (!updatedPrediction) {
      return {
        success: false,
        message:
          'This prediction is not active, was already ended/canceled, or does not exist.'
      }
    }

    const managerId = access.session.userId!
    await recordStaffAudit({
      guildId,
      userId: updatedPrediction.creatorId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_END,
      meta: {
        predictionId,
        title: updatedPrediction.title
      }
    })

    try {
      await updatePredictionMessageEnded({
        channelId: updatedPrediction.channelId,
        messageId: updatedPrediction.predictionId,
        title: updatedPrediction.title,
        choices: updatedPrediction.choices
      })
    } catch (err) {
      console.error('Failed to edit ended prediction message:', err)
    }

    revalidatePath(predictionsPath(guildId))
    revalidateGuildHealth(guildId)

    return { success: true, message: 'Prediction ended. No more bets allowed.' }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function payoutPrediction(
  guildId: string,
  predictionId: string,
  winnerChoice: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(
    guildId,
    'predictionManagement',
    access
  )
  if (blocked) return blocked

  const parsed = payoutPredictionFormSchema.safeParse({ winnerChoice })
  if (!parsed.success) {
    return { success: false, message: 'Select a winning choice.' }
  }

  try {
    await connectToDatabase()

    const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
    const logsChannelId = guildConfig?.predictionChannelIds?.logs

    if (!logsChannelId) {
      return {
        success: false,
        message: `Prediction logs channel is not configured. Set it in ${channelSettingsPath(guildId)}.`
      }
    }

    const globalSettings = normalizeGlobalSettings(guildConfig?.globalSettings)

    const payoutResult = await predictionLifecycle.payoutPrediction({
      predictionId,
      guildId,
      winnerChoice: parsed.data.winnerChoice
    })

    if (!payoutResult.ok) {
      const messages: Record<typeof payoutResult.code, string> = {
        NOT_FOUND: 'Prediction not found.',
        INVALID_STATUS: 'Prediction is not in ended state.',
        ALREADY_HANDLED:
          'Prediction payout is already in progress or completed.',
        INVALID_WINNER: `The winner "${winnerChoice}" does not exist in this prediction.`
      }

      return { success: false, message: messages[payoutResult.code] }
    }

    const { prediction, outcome } = payoutResult
    const managerId = access.session.userId!

    await recordStaffAudit({
      guildId,
      userId: prediction.creatorId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_PAYOUT,
      meta: {
        predictionId,
        title: prediction.title,
        winnerChoice: parsed.data.winnerChoice,
        outcome
      }
    })

    if (outcome === 'refunded') {
      revalidatePath(predictionsPath(guildId))
      revalidateGuildHealth(guildId)
      return {
        success: true,
        message:
          'No one bet on the winning option. All bets were refunded and the prediction is marked paid.'
      }
    }

    const payoutSummary = calculatePredictionPayoutSummary(
      prediction,
      parsed.data.winnerChoice
    )

    if (payoutSummary) {
      const discordMembers = await getDiscordGuildMembers(guildId)
      const memberMentions = new Map(
        discordMembers.map((m) => [m.userId, `<@${m.userId}>`])
      )

      try {
        await sendPredictionPayoutLog({
          logsChannelId,
          title: prediction.title,
          summary: payoutSummary,
          globalSettings,
          memberMentions
        })
      } catch (err) {
        console.error('Failed to send prediction payout log:', err)
      }
    }

    try {
      await updatePredictionMessagePaid({
        channelId: prediction.channelId,
        messageId: prediction.predictionId,
        title: prediction.title,
        choices: prediction.choices,
        winnerChoice: parsed.data.winnerChoice
      })
    } catch (err) {
      console.error('Failed to edit paid prediction message:', err)
    }

    revalidatePath(predictionsPath(guildId))
    revalidateGuildHealth(guildId)

    return {
      success: true,
      message: `Winners on "${parsed.data.winnerChoice}" have been paid.`
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function cancelPrediction(
  guildId: string,
  predictionId: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(
    guildId,
    'predictionManagement',
    access
  )
  if (blocked) return blocked

  try {
    await connectToDatabase()

    const updatedPrediction = await predictionLifecycle.cancelPrediction({
      predictionId,
      guildId
    })

    if (!updatedPrediction) {
      return {
        success: false,
        message: 'This prediction was already canceled/paid or does not exist.'
      }
    }

    const managerId = access.session.userId!
    await recordStaffAudit({
      guildId,
      userId: updatedPrediction.creatorId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_CANCEL,
      meta: {
        predictionId,
        title: updatedPrediction.title
      }
    })

    try {
      await updatePredictionMessageCanceled({
        channelId: updatedPrediction.channelId,
        messageId: updatedPrediction.predictionId,
        title: updatedPrediction.title,
        choices: updatedPrediction.choices
      })
    } catch (err) {
      console.error('Failed to edit canceled prediction message:', err)
    }

    revalidatePath(predictionsPath(guildId))
    revalidateGuildHealth(guildId)

    return {
      success: true,
      message: 'Prediction canceled and all bets refunded.'
    }
  } catch (err) {
    return handleActionError(err)
  }
}
