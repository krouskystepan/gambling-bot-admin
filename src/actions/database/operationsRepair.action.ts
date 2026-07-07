'use server'

import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/db'
import { casinoBetService, predictionLifecycle } from '@/lib/games/gameServices'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import {
  blockPanelFeatureAction,
  blockPanelMaintenanceAction
} from '@/lib/panel/panelFeatureActionGuard.server'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import { blackjackStaleCutoff } from '@/lib/systemHealth/thresholds'
import BlackjackGame from '@/models/BlackjackGame'

import { requireGuildAccess } from '../perms'

type ActionResult = { success: boolean; message: string }

function healthPath(guildId: string) {
  return `/dashboard/g/${guildId}/health`
}

function predictionsPath(guildId: string) {
  return `/dashboard/g/${guildId}/predictions`
}

function handleActionError(err: unknown): ActionResult {
  console.error('Operations repair action failed:', err)
  return { success: false, message: 'Server error, please try again.' }
}

export async function resetStuckPredictionPayout(
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

    const result = await predictionLifecycle.resetStuckPayout({
      predictionId,
      guildId
    })

    if (!result.ok) {
      const messages = {
        NOT_FOUND: 'Prediction not found.',
        INVALID_STATUS: 'Prediction is not stuck in paying status.',
        PARTIAL_PAYOUT:
          'Payout already started for some bettors; cannot reset automatically.'
      } as const

      return { success: false, message: messages[result.code] }
    }

    const { prediction } = result
    const managerId = access.session.userId!

    await recordStaffAudit({
      guildId,
      userId: prediction.creatorId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.PREDICTION_RESET_PAYOUT,
      meta: {
        predictionId,
        title: prediction.title,
        previousStatus: 'paying'
      }
    })

    revalidatePath(healthPath(guildId))
    revalidatePath(predictionsPath(guildId))
    revalidateGuildHealth(guildId)

    return {
      success: true,
      message:
        'Prediction rolled back to Ended. You can run payout again from the predictions page.'
    }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function forceCloseStaleBlackjack(
  guildId: string,
  userId: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(guildId, 'casinoGames', access)
  if (blocked) return blocked

  try {
    await connectToDatabase()

    const game = await BlackjackGame.findOne({ userId, guildId }).lean()
    if (!game) {
      return { success: false, message: 'Blackjack game not found.' }
    }

    const staleCutoff = blackjackStaleCutoff()
    if (new Date(game.updatedAt) > staleCutoff) {
      return {
        success: false,
        message:
          'Game is not stale yet. Only games older than 24 hours can be force-closed.'
      }
    }

    const totalBet = game.hands.reduce((sum, hand) => sum + hand.betAmount, 0)

    await casinoBetService.refundLockedBet({
      userId: game.userId,
      guildId: game.guildId,
      amount: totalBet,
      betId: game.betId,
      game: 'blackjack'
    })

    await BlackjackGame.deleteOne({ userId, guildId })

    const managerId = access.session.userId!
    await recordStaffAudit({
      guildId,
      userId: game.userId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.BLACKJACK_FORCE_CLOSE,
      meta: {
        userId: game.userId,
        betId: game.betId,
        totalBet,
        channelId: game.channelId,
        messageId: game.messageId
      }
    })

    revalidatePath(healthPath(guildId))
    revalidateGuildHealth(guildId)

    return {
      success: true,
      message: 'Stale blackjack game refunded and removed.'
    }
  } catch (err) {
    return handleActionError(err)
  }
}
