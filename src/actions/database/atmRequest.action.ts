'use server'

import { type TAtmRequest } from 'gambling-bot-shared/atm'
import { formatMoney } from 'gambling-bot-shared/common'
import { normalizeGlobalSettings } from 'gambling-bot-shared/guild'
import { Session } from 'next-auth'

import { editDiscordMessage, sendEmbed } from '@/actions/discord/utils.action'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import { blockPanelFeatureAction } from '@/lib/panel/panelFeatureActionGuard.server'
import AtmRequest from '@/models/AtmRequest'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'
import User from '@/models/User'
import { TAtmRequestDiscord } from '@/types/types'

import { getDiscordGuildMembers } from '../discord/member.action'
import { requireGuildAccess } from '../perms'

export type AtmRequestCounts = {
  pending: number
  approved: number
  rejected: number
  total: number
  type: {
    deposit: number
    withdraw: number
  }
  amount: {
    pendingDeposits: number
    pendingWithdraws: number
  }
}

const emptyAtmRequestCounts = (): AtmRequestCounts => ({
  pending: 0,
  approved: 0,
  rejected: 0,
  total: 0,
  type: { deposit: 0, withdraw: 0 },
  amount: { pendingDeposits: 0, pendingWithdraws: 0 }
})

const previewWithdraw = async ({
  userId,
  guildId,
  amount
}: {
  userId: string
  guildId: string
  amount: number
}) => {
  const user = await User.findOne({ userId, guildId }).lean()
  if (!user) return { ok: false as const, reason: 'NO_USER' as const }

  const balance = user.balance ?? 0
  const lockedBalance = user.lockedBalance ?? 0
  const withdrawable = balance - lockedBalance

  if (balance < amount) {
    return { ok: false as const, reason: 'INSUFFICIENT_BALANCE' as const }
  }

  if (withdrawable < amount) {
    return {
      ok: false as const,
      reason: 'INSUFFICIENT_WITHDRAWABLE' as const
    }
  }

  return { ok: true as const }
}

const attachDiscordMembers = async (
  guildId: string,
  requests: TAtmRequest[]
): Promise<TAtmRequestDiscord[]> => {
  if (!requests.length) return []

  const userIds = Array.from(
    new Set(
      requests.flatMap((request) =>
        [request.userId, request.handledBy].filter(Boolean)
      )
    )
  ) as string[]

  const discordMembers = await getDiscordGuildMembers(guildId)
  const discordMap = new Map(
    (discordMembers ?? [])
      .filter((member) => userIds.includes(member.userId))
      .map((member) => [member.userId, member])
  )

  const requestIds = requests
    .filter((request) => request.status === 'approved')
    .map((request) => request.requestId)

  const linkedTransactions =
    requestIds.length > 0
      ? await Transaction.find({
          guildId,
          'meta.requestId': { $in: requestIds }
        })
          .select('_id meta.requestId')
          .lean()
      : []

  const transactionByRequestId = new Map(
    linkedTransactions.map((tx) => [
      String((tx.meta as { requestId?: string })?.requestId ?? ''),
      String(tx._id)
    ])
  )

  return requests.map((request) => {
    const user = discordMap.get(request.userId)
    const handler = request.handledBy
      ? discordMap.get(request.handledBy)
      : undefined

    return {
      ...request,
      id: request.requestId,
      username: user?.username ?? 'Unknown',
      nickname: user?.nickname ?? null,
      avatar: user?.avatarUrl ?? '/default-avatar.jpg',
      handledByUsername: handler?.username ?? null,
      linkedTransactionId:
        request.status === 'approved'
          ? (transactionByRequestId.get(request.requestId) ?? null)
          : null
    }
  })
}

export const getAtmRequestCounts = async (
  guildId: string,
  _session: Session
): Promise<AtmRequestCounts> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return emptyAtmRequestCounts()
  }

  await connectToDatabase()

  const rows = await AtmRequest.aggregate([
    { $match: { guildId } },
    {
      $group: {
        _id: { status: '$status', type: '$type' },
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }
    }
  ])

  const counts = emptyAtmRequestCounts()

  for (const row of rows) {
    const status = row._id.status as TAtmRequest['status']
    const type = row._id.type as TAtmRequest['type']

    counts[status] += row.count
    counts.total += row.count
    counts.type[type] += row.count

    if (status === 'pending') {
      if (type === 'deposit') {
        counts.amount.pendingDeposits += row.amount
      } else {
        counts.amount.pendingWithdraws += row.amount
      }
    }
  }

  return counts
}

export const getAtmRequests = async (
  guildId: string,
  session: Session,
  page = 1,
  limit = 15,
  search?: string,
  filterStatus?: string[],
  filterType?: string[],
  dateFrom?: string,
  dateTo?: string,
  sort?: string
): Promise<{ requests: TAtmRequestDiscord[]; total: number }> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { requests: [], total: 0 }
  }

  await connectToDatabase()

  const query: Record<string, unknown> = { guildId }

  if (filterStatus?.length) {
    query.status = { $in: filterStatus }
  }

  if (filterType?.length) {
    query.type = filterType.length === 1 ? filterType[0] : { $in: filterType }
  }

  if (dateFrom || dateTo) {
    query.createdAt = {
      ...(dateFrom ? { $gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { $lte: new Date(dateTo) } : {})
    }
  }

  if (search) {
    query.userId = search
  }

  let sortObj: Record<string, 1 | -1> = { createdAt: -1 }
  if (sort) {
    sortObj = {}
    for (const part of sort.split(',')) {
      const [field, dir] = part.split(':')
      if (field) sortObj[field] = dir === 'asc' ? 1 : -1
    }
  }

  const total = await AtmRequest.countDocuments(query)
  const requests = await AtmRequest.find(query)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  return {
    requests: await attachDiscordMembers(guildId, requests as TAtmRequest[]),
    total
  }
}

const notifyAtmChannels = async ({
  guildId,
  userId,
  title,
  description,
  color,
  logChannelId,
  logMessageId,
  logContent,
  handledBy
}: {
  guildId: string
  userId: string
  title: string
  description: string
  color: number
  logChannelId?: string
  logMessageId?: string
  logContent?: string
  handledBy: string
}) => {
  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const actionsChannelId = guildConfig?.atmChannelIds?.actions

  if (logChannelId && logMessageId && logContent) {
    await editDiscordMessage(logChannelId, logMessageId, logContent)
  }

  if (actionsChannelId) {
    await sendEmbed(actionsChannelId, title, description, color, userId)
  }

  void handledBy
}

export const approveAtmRequestAction = async (
  guildId: string,
  requestId: string,
  notes?: string
) => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const handledBy = access.session.userId!
  await connectToDatabase()

  const request = await AtmRequest.findOne({
    requestId,
    guildId,
    status: 'pending'
  })
  if (!request) {
    return { success: false, message: 'Request is no longer pending.' }
  }

  const feature = request.type === 'deposit' ? 'deposit' : 'withdraw'
  const blocked = await blockPanelFeatureAction(guildId, feature, access)
  if (blocked) return blocked

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const globalSettings = normalizeGlobalSettings(guildConfig?.globalSettings)
  const readableAmount = formatMoney(request.amount, globalSettings)
  const txMeta = {
    requestId: request.requestId,
    account: request.account,
    ...(notes ? { notes } : {})
  }

  if (request.type === 'deposit') {
    const completed = await AtmRequest.findOneAndUpdate(
      { requestId, status: 'pending' },
      {
        status: 'approved',
        handledBy,
        handledAt: new Date(),
        ...(notes ? { notes } : {}),
        meta: { source: 'web', ...txMeta }
      },
      { returnDocument: 'after' }
    )

    if (!completed) {
      return {
        success: false,
        message: 'Another manager already handled this.'
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId: request.userId, guildId },
      { $inc: { balance: request.amount } },
      { returnDocument: 'after' }
    )

    if (!updatedUser) {
      return { success: false, message: 'Failed to credit user balance.' }
    }

    await Transaction.create({
      userId: request.userId,
      guildId,
      amount: request.amount,
      type: 'deposit',
      source: 'web',
      handledBy,
      meta: txMeta
    })

    await notifyAtmChannels({
      guildId,
      userId: request.userId,
      handledBy,
      title: 'ATM Transaction Approved',
      description: `Deposit of **${readableAmount}** approved via admin panel.`,
      color: 0x57f287,
      logChannelId: request.logChannelId,
      logMessageId: request.logMessageId,
      logContent: `✅ Approved by <@${handledBy}> (web panel)`
    })

    revalidateGuildHealth(guildId)

    return { success: true, message: 'Deposit approved.' }
  }

  const withdrawCheck = await previewWithdraw({
    userId: request.userId,
    guildId,
    amount: request.amount
  })

  if (!withdrawCheck.ok) {
    await AtmRequest.findOneAndUpdate(
      { requestId, status: 'pending' },
      {
        status: 'rejected',
        handledBy,
        handledAt: new Date(),
        notes: notes ?? 'Insufficient available balance at approval',
        meta: { source: 'web', reason: withdrawCheck.reason, ...txMeta }
      }
    )

    await notifyAtmChannels({
      guildId,
      userId: request.userId,
      handledBy,
      title: 'Withdrawal Failed',
      description: `Your withdrawal of **${readableAmount}** could not be completed because your available balance changed before approval.`,
      color: 0xed4245,
      logChannelId: request.logChannelId,
      logMessageId: request.logMessageId,
      logContent: `❌ Rejected by <@${handledBy}> — insufficient available balance (web panel).`
    })

    return {
      success: false,
      message: 'User no longer has enough withdrawable balance.'
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      userId: request.userId,
      guildId,
      $expr: {
        $gte: [{ $subtract: ['$balance', '$lockedBalance'] }, request.amount]
      }
    },
    { $inc: { balance: -request.amount } },
    { returnDocument: 'after' }
  )

  if (!updatedUser) {
    await AtmRequest.findOneAndUpdate(
      { requestId, status: 'pending' },
      {
        status: 'rejected',
        handledBy,
        handledAt: new Date(),
        notes: notes ?? 'Insufficient available balance at approval',
        meta: { source: 'web', reason: 'INSUFFICIENT_BALANCE', ...txMeta }
      }
    )

    return {
      success: false,
      message: 'User no longer has enough withdrawable balance.'
    }
  }

  const completed = await AtmRequest.findOneAndUpdate(
    { requestId, status: 'pending' },
    {
      status: 'approved',
      handledBy,
      handledAt: new Date(),
      ...(notes ? { notes } : {}),
      meta: { source: 'web', ...txMeta }
    },
    { returnDocument: 'after' }
  )

  if (!completed) {
    await User.findOneAndUpdate(
      { userId: request.userId, guildId },
      { $inc: { balance: request.amount } }
    )

    return { success: false, message: 'Another manager already handled this.' }
  }

  await Transaction.create({
    userId: request.userId,
    guildId,
    amount: request.amount,
    type: 'withdraw',
    source: 'web',
    handledBy,
    meta: txMeta
  })

  await notifyAtmChannels({
    guildId,
    userId: request.userId,
    handledBy,
    title: 'ATM Transaction Approved',
    description: `Withdrawal of **${readableAmount}** approved via admin panel.`,
    color: 0x57f287,
    logChannelId: request.logChannelId,
    logMessageId: request.logMessageId,
    logContent: `✅ Approved by <@${handledBy}> (web panel)`
  })

  revalidateGuildHealth(guildId)

  return { success: true, message: 'Withdrawal approved.' }
}

export const rejectAtmRequestAction = async (
  guildId: string,
  requestId: string,
  notes?: string
) => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return { success: false, message: access.error }
  }

  const handledBy = access.session.userId!
  await connectToDatabase()

  const request = await AtmRequest.findOne({
    requestId,
    guildId,
    status: 'pending'
  })
  if (!request) {
    return { success: false, message: 'Request is no longer pending.' }
  }

  const completed = await AtmRequest.findOneAndUpdate(
    { requestId, status: 'pending' },
    {
      status: 'rejected',
      handledBy,
      handledAt: new Date(),
      ...(notes ? { notes } : {}),
      meta: {
        source: 'web',
        requestId: request.requestId,
        account: request.account,
        ...(notes ? { notes } : {})
      }
    },
    { returnDocument: 'after' }
  )

  if (!completed) {
    return { success: false, message: 'Another manager already handled this.' }
  }

  const guildConfig = await GuildConfiguration.findOne({ guildId }).lean()
  const globalSettings = normalizeGlobalSettings(guildConfig?.globalSettings)
  const readableAmount = formatMoney(request.amount, globalSettings)
  const actionWord = request.type === 'deposit' ? 'Deposit' : 'Withdrawal'

  await notifyAtmChannels({
    guildId,
    userId: request.userId,
    handledBy,
    title: 'ATM Transaction Rejected',
    description: `${actionWord} of **${readableAmount}** rejected via admin panel.`,
    color: 0xed4245,
    logChannelId: request.logChannelId,
    logMessageId: request.logMessageId,
    logContent: `❌ Rejected by <@${handledBy}> (web panel)`
  })

  revalidateGuildHealth(guildId)

  return { success: true, message: 'Request rejected.' }
}
