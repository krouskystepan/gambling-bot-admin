'use server'

import { type TAtmRequest } from 'gambling-bot-shared/atm'
import { formatMoney } from 'gambling-bot-shared/common'
import { normalizeGlobalSettings } from 'gambling-bot-shared/guild'
import { STAFF_ADMIN_ACTIONS } from 'gambling-bot-shared/transactions'
import { Session } from 'next-auth'

import { editDiscordMessage, sendEmbed } from '@/actions/discord/utils.action'
import { connectToDatabase } from '@/lib/db'
import { revalidateGuildHealth } from '@/lib/guild/revalidateHealth'
import { blockPanelFeatureAction } from '@/lib/panel/panelFeatureActionGuard.server'
import { recordStaffAudit } from '@/lib/staffAudit/recordStaffAudit'
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
  users: Record<string, number>
}

const emptyAtmRequestCounts = (): AtmRequestCounts => ({
  pending: 0,
  approved: 0,
  rejected: 0,
  total: 0,
  type: { deposit: 0, withdraw: 0 },
  amount: { pendingDeposits: 0, pendingWithdraws: 0 },
  users: {}
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
          referenceId: { $in: requestIds }
        })
          .select('_id referenceId')
          .lean()
      : []

  const transactionByRequestId = new Map(
    linkedTransactions.map((tx) => [
      String(tx.referenceId ?? ''),
      String(tx._id)
    ])
  )

  return requests.map((request) => {
    const user = discordMap.get(request.userId)
    const handler = request.handledBy
      ? discordMap.get(request.handledBy)
      : undefined

    return {
      requestId: request.requestId,
      guildId: request.guildId,
      userId: request.userId,
      type: request.type,
      amount: request.amount,
      account: request.account,
      status: request.status,
      handledBy: request.handledBy,
      handledAt: request.handledAt,
      notes: request.notes,
      logChannelId: request.logChannelId,
      logMessageId: request.logMessageId,
      meta: request.meta,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
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

export type AtmRequestCountFilters = {
  search?: string
  filterStatus?: string[]
  filterType?: string[]
  dateFrom?: string
  dateTo?: string
}

function buildAtmRequestCountMatch(
  guildId: string,
  filters: AtmRequestCountFilters = {},
  exclude?: 'status' | 'type' | 'search'
): Record<string, unknown> {
  const query: Record<string, unknown> = { guildId }

  if (exclude !== 'search' && filters.search) {
    query.userId = filters.search
  }

  if (exclude !== 'status' && filters.filterStatus?.length) {
    query.status =
      filters.filterStatus.length === 1
        ? filters.filterStatus[0]
        : { $in: filters.filterStatus }
  }

  if (exclude !== 'type' && filters.filterType?.length) {
    query.type =
      filters.filterType.length === 1
        ? filters.filterType[0]
        : { $in: filters.filterType }
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {
      ...(filters.dateFrom ? { $gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { $lte: new Date(filters.dateTo) } : {})
    }
  }

  return query
}

export const getAtmRequestCounts = async (
  guildId: string,
  _session: Session,
  filters: AtmRequestCountFilters = {}
): Promise<AtmRequestCounts> => {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return emptyAtmRequestCounts()
  }

  await connectToDatabase()

  const statusMatch = buildAtmRequestCountMatch(guildId, filters, 'status')
  const typeMatch = buildAtmRequestCountMatch(guildId, filters, 'type')
  const summaryMatch = buildAtmRequestCountMatch(guildId, filters)
  const userMatch = buildAtmRequestCountMatch(guildId, filters, 'search')

  const [statusRows, typeRows, summaryRows, userRows] = await Promise.all([
    AtmRequest.aggregate([
      { $match: statusMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    AtmRequest.aggregate([
      { $match: typeMatch },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    AtmRequest.aggregate([
      { $match: summaryMatch },
      {
        $group: {
          _id: { status: '$status', type: '$type' },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]),
    AtmRequest.aggregate([
      { $match: userMatch },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ])
  ])

  const counts = emptyAtmRequestCounts()

  for (const row of statusRows) {
    const status = row._id as TAtmRequest['status']
    counts[status] = row.count
  }

  for (const row of typeRows) {
    const type = row._id as TAtmRequest['type']
    counts.type[type] = row.count
  }

  for (const row of summaryRows) {
    const status = row._id.status as TAtmRequest['status']
    const type = row._id.type as TAtmRequest['type']

    counts.total += row.count

    if (status === 'pending') {
      if (type === 'deposit') {
        counts.amount.pendingDeposits += row.amount
      } else {
        counts.amount.pendingWithdraws += row.amount
      }
    }
  }

  const users: Record<string, number> = {}
  for (const row of userRows) {
    if (row._id) {
      users[row._id as string] = row.count
    }
  }

  return {
    ...counts,
    users
  }
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

async function recordAtmRejectAudit({
  guildId,
  request,
  handledBy,
  notes
}: {
  guildId: string
  request: Pick<TAtmRequest, 'userId' | 'requestId' | 'amount' | 'type'>
  handledBy: string
  notes?: string
}) {
  await recordStaffAudit({
    guildId,
    userId: request.userId,
    handledBy,
    adminAction: STAFF_ADMIN_ACTIONS.ATM_REJECT,
    meta: {
      requestId: request.requestId,
      requestedAmount: request.amount,
      type: request.type
    },
    notes
  })
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
      referenceId: request.requestId,
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
    const rejectNotes = notes ?? 'Insufficient available balance at approval'
    await AtmRequest.findOneAndUpdate(
      { requestId, status: 'pending' },
      {
        status: 'rejected',
        handledBy,
        handledAt: new Date(),
        notes: rejectNotes,
        meta: { source: 'web', reason: withdrawCheck.reason, ...txMeta }
      }
    )

    await recordAtmRejectAudit({
      guildId,
      request,
      handledBy,
      notes: rejectNotes
    })

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
    const rejectNotes = notes ?? 'Insufficient available balance at approval'
    await AtmRequest.findOneAndUpdate(
      { requestId, status: 'pending' },
      {
        status: 'rejected',
        handledBy,
        handledAt: new Date(),
        notes: rejectNotes,
        meta: { source: 'web', reason: 'INSUFFICIENT_BALANCE', ...txMeta }
      }
    )

    await recordAtmRejectAudit({
      guildId,
      request,
      handledBy,
      notes: rejectNotes
    })

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
    referenceId: request.requestId,
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

  await recordAtmRejectAudit({
    guildId,
    request,
    handledBy,
    notes
  })

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
