'use server'

import {
  generateId,
  parseReadableStringToNumber,
  parseTimeToSeconds
} from 'gambling-bot-shared/common'
import { normalizeGlobalSettings } from 'gambling-bot-shared/guild'
import { type TRaffle, type TRaffleStatus } from 'gambling-bot-shared/raffle'
import { raffleCreateFormSchema } from 'gambling-bot-shared/raffle'
import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import { DateTime } from 'luxon'
import { Session } from 'next-auth'
import { z } from 'zod'

import { revalidatePath } from 'next/cache'

import { getGuildChannels } from '@/actions/discord/channel.action'
import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import {
  deleteDiscordMessage,
  editRaffleMessageCanceled,
  postRaffleMessage
} from '@/actions/discord/raffleMessage.action'
import { connectToDatabase } from '@/lib/db'
import { raffleDb, raffleLifecycle } from '@/lib/games/gameServices'
import {
  blockPanelFeatureAction,
  blockPanelMaintenanceAction
} from '@/lib/panel/panelFeatureActionGuard.server'
import { getPanelFeatureBlockMessage } from '@/lib/panel/panelGlobalFeatureGuard'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
import { escapeRegExp } from '@/lib/utils'
import GuildConfiguration from '@/models/GuildConfiguration'
import Raffle from '@/models/Raffle'
import { TRaffleRow } from '@/types/types'

import { requireGuildAccess } from '../perms'

type ActionResult = { success: boolean; message: string; rateLimited?: boolean }

export type RafflePageContext = {
  raffleConfigured: boolean
  raffleFeatureBlocked: boolean
  raffleFeatureBlockMessage: string | null
}

export type RaffleParticipantRow = {
  userId: string
  tickets: number
  username: string
  avatar: string
}

function rafflesPath(guildId: string) {
  return `/dashboard/g/${guildId}/raffles`
}

function channelSettingsPath(guildId: string) {
  return `/dashboard/g/${guildId}/channel-settings`
}

function formatIntervalMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const weeks = Math.floor(totalSeconds / 604800)
  const days = Math.floor((totalSeconds % 604800) / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const parts: string[] = []

  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`)
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)

  return parts.length > 0 ? parts.join(' ') : `${totalSeconds}s`
}

function handleActionError(err: unknown): ActionResult {
  if (err instanceof Error && err.message === 'DiscordRateLimited') {
    return {
      success: false,
      message: 'Discord rate limit reached. Please try again in a moment.',
      rateLimited: true
    }
  }

  console.error('Raffle action failed:', err)
  return { success: false, message: 'Server error, please try again.' }
}

function enrichRaffleRow(
  raffle: TRaffle,
  channelsMap: Map<string, string>,
  membersMap: Map<
    string,
    { username: string; avatarUrl: string; nickname: string | null }
  >
): TRaffleRow {
  const creator = membersMap.get(raffle.creatorId)
  const totalTickets = raffle.participants.reduce(
    (sum, p) => sum + p.tickets,
    0
  )

  const participantsEnriched = raffle.participants
    .filter((p) => p.tickets > 0)
    .map((p) => {
      const member = membersMap.get(p.userId)
      return {
        userId: p.userId,
        tickets: p.tickets,
        username: member?.username ?? 'Unknown',
        avatar: member?.avatarUrl ?? '/default-avatar.jpg'
      }
    })

  return {
    ...raffle,
    channelName: channelsMap.get(raffle.channelId) ?? 'Unknown',
    creatorUsername: creator?.username ?? 'Unknown',
    creatorAvatar: creator?.avatarUrl ?? '/default-avatar.jpg',
    totalTickets,
    totalPot: totalTickets * raffle.ticketPrice,
    intervalLabel: formatIntervalMs(raffle.drawIntervalMs),
    participantsEnriched
  }
}

export async function getRafflePageContext(
  guildId: string
): Promise<RafflePageContext | null> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return null

  await connectToDatabase()

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const actionsChannelId = guildConfig?.raffleChannelIds?.actions

  const raffleFeatureBlockMessage = getPanelFeatureBlockMessage(
    guildConfig?.globalSettings,
    'raffleManagement',
    access.isAdmin
  )

  return {
    raffleConfigured: Boolean(actionsChannelId),
    raffleFeatureBlocked: raffleFeatureBlockMessage !== null,
    raffleFeatureBlockMessage
  }
}

export async function getRaffles(
  guildId: string,
  _session: Session,
  page = 1,
  limit = 10,
  search?: string,
  sort?: string,
  status: TRaffleStatus | 'all' = 'active'
): Promise<{ raffles: TRaffleRow[]; total: number }> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { raffles: [], total: 0 }
  }

  await connectToDatabase()

  const query: { guildId: string; status?: TRaffleStatus } = { guildId }
  if (status !== 'all') {
    query.status = status
  }

  const docs = await Raffle.find(query).lean<TRaffle[]>()
  if (!docs.length) return { raffles: [], total: 0 }

  const [discordMembers, guildChannels] = await Promise.all([
    getDiscordGuildMembers(guildId),
    getGuildChannels(guildId)
  ])

  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))
  const channelsMap = new Map(
    guildChannels.map((c) => [c.id, c.name ?? 'Unknown'])
  )

  let raffles = docs.map((raffle) =>
    enrichRaffleRow(raffle, channelsMap, membersMap)
  )

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i')
    raffles = raffles.filter(
      (raffle) =>
        regex.test(raffle.raffleId) ||
        regex.test(raffle.drawId) ||
        regex.test(raffle.channelName) ||
        regex.test(raffle.creatorUsername) ||
        regex.test(raffle.creatorId)
    )
  }

  if (sort) {
    for (const part of sort.split(',').reverse()) {
      const [field, dir] = part.split(':')

      raffles.sort((a, b) => {
        const av = (a as Record<string, unknown>)[field]
        const bv = (b as Record<string, unknown>)[field]

        if (field === 'participantsEnriched') {
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
  } else {
    raffles.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  const total = raffles.length
  const start = (page - 1) * limit

  return {
    raffles: raffles.slice(start, start + limit),
    total
  }
}

export async function getRaffleParticipants(
  guildId: string,
  raffleId: string
): Promise<
  | {
      raffleId: string
      drawId: string
      ticketPrice: number
      maxTicketsPerUser: number
      status: TRaffleStatus
      participants: RaffleParticipantRow[]
    }
  | { error: string }
> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) return { error: access.error }

  await connectToDatabase()

  const raffle = await Raffle.findOne({ guildId, raffleId }).lean<TRaffle>()
  if (!raffle) return { error: 'Raffle not found.' }

  const discordMembers = await getDiscordGuildMembers(guildId)
  const membersMap = new Map(discordMembers.map((m) => [m.userId, m]))

  const participants = raffle.participants
    .filter((p) => p.tickets > 0)
    .map((p) => {
      const member = membersMap.get(p.userId)
      return {
        userId: p.userId,
        tickets: p.tickets,
        username: member?.username ?? 'Unknown',
        avatar: member?.avatarUrl ?? '/default-avatar.jpg'
      }
    })

  return {
    raffleId: raffle.raffleId,
    drawId: raffle.drawId,
    ticketPrice: raffle.ticketPrice,
    maxTicketsPerUser: raffle.maxTicketsPerUser,
    status: raffle.status,
    participants
  }
}

const createRaffleInputSchema = raffleCreateFormSchema.extend({
  guildId: z.string().min(1)
})

export async function createRaffle(
  guildId: string,
  values: z.infer<typeof raffleCreateFormSchema>
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(
    guildId,
    'raffleManagement',
    access
  )
  if (blocked) return blocked

  const parsed = createRaffleInputSchema.safeParse({ ...values, guildId })
  if (!parsed.success) {
    return { success: false, message: 'Invalid raffle form data.' }
  }

  const ticketPrice = parseReadableStringToNumber(parsed.data.ticketPrice)
  if (!ticketPrice || ticketPrice <= 0) {
    return { success: false, message: 'Enter a valid ticket price.' }
  }

  const intervalSeconds = parseTimeToSeconds(parsed.data.interval)
  if (intervalSeconds <= 0) {
    return {
      success: false,
      message: 'Use interval formats like 10m, 2h, 1d, 1w.'
    }
  }

  if (intervalSeconds < 60) {
    return { success: false, message: 'Minimum interval is 1 minute.' }
  }

  const drawDt = DateTime.fromISO(parsed.data.drawTime, {
    zone: 'Europe/Prague'
  })
  if (!drawDt.isValid || drawDt.toMillis() <= Date.now()) {
    return { success: false, message: 'Draw time must be in the future.' }
  }

  try {
    await connectToDatabase()

    const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
    const actionsChannelId = guildConfig?.raffleChannelIds?.actions
    if (!actionsChannelId) {
      return {
        success: false,
        message: `Raffle actions channel is not configured. Set it in ${channelSettingsPath(guildId)}.`
      }
    }

    const globalSettings = normalizeGlobalSettings(guildConfig?.globalSettings)
    const drawId = generateId()
    const nextDrawAt = drawDt.toJSDate()
    const drawIntervalMs = intervalSeconds * 1000

    const messageId = await postRaffleMessage({
      channelId: actionsChannelId,
      ticketPrice,
      maxTickets: parsed.data.maxTickets,
      nextDrawAt,
      drawId,
      globalSettings
    })

    try {
      await raffleDb.upsertRaffle({
        drawId,
        raffleId: messageId,
        creatorId: access.session.userId!,
        guildId,
        channelId: actionsChannelId,
        ticketPrice,
        maxTicketsPerUser: parsed.data.maxTickets,
        nextDrawAt,
        drawIntervalMs
      })
    } catch (dbErr) {
      await deleteDiscordMessage(actionsChannelId, messageId)
      throw dbErr
    }

    revalidatePath(rafflesPath(guildId))

    return { success: true, message: 'Raffle created and posted to Discord.' }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function cancelRaffle(
  guildId: string,
  raffleId: string
): Promise<ActionResult> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const maintenanceBlocked = await blockPanelMaintenanceAction(guildId, access)
  if (maintenanceBlocked) return maintenanceBlocked

  const blocked = await blockPanelFeatureAction(
    guildId,
    'raffleManagement',
    access
  )
  if (blocked) return blocked

  try {
    await connectToDatabase()

    const cancelResult = await raffleLifecycle.cancelRaffle({
      raffleId,
      guildId
    })

    if (!cancelResult.ok) {
      return {
        success: false,
        message: 'This raffle was already canceled or does not exist.'
      }
    }

    const { raffle, refundErrors } = cancelResult
    const managerId = access.session.userId!

    await recordStaffAudit({
      guildId,
      userId: raffle.creatorId,
      handledBy: managerId,
      adminAction: STAFF_ADMIN_ACTIONS.RAFFLE_CANCEL,
      meta: {
        raffleId,
        drawId: raffle.drawId,
        refundCount: raffle.participants.length
      }
    })

    const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
    const globalSettings = normalizeGlobalSettings(guildConfig?.globalSettings)

    try {
      await editRaffleMessageCanceled({
        channelId: raffle.channelId,
        messageId: raffle.raffleId,
        ticketPrice: raffle.ticketPrice,
        maxTickets: raffle.maxTicketsPerUser,
        nextDrawAt: raffle.nextDrawAt,
        drawId: raffle.drawId,
        globalSettings
      })
    } catch (err) {
      console.error('Failed to edit canceled raffle message:', err)
    }

    revalidatePath(rafflesPath(guildId))

    if (refundErrors.length > 0) {
      return {
        success: false,
        message: `Raffle canceled but ${refundErrors.length} refund(s) failed. Check logs.`
      }
    }

    return {
      success: true,
      message: 'Raffle canceled and all tickets refunded.'
    }
  } catch (err) {
    return handleActionError(err)
  }
}
