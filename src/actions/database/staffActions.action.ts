'use server'

import { STAFF_ACTION_CATEGORIES } from 'gambling-bot-shared/transactions'
import type { PipelineStage } from 'mongoose'
import { Session } from 'next-auth'

import { getDiscordGuildMembers } from '@/actions/discord/member.action'
import {
  getGuildAdminRoleIds,
  resolveGuildStaffStatus
} from '@/actions/discord/role.action'
import { connectToDatabase } from '@/lib/db'
import { discordBotRequest } from '@/lib/discord/discordReq'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'
import {
  type StaffActionsFilters,
  buildAtmRejectionMatch,
  buildStaffTransactionMatch,
  emptyStaffActionCategoryCounts,
  shouldIncludeAtmRejectionUnion
} from '@/lib/staffAudit/staffActionQuery'
import {
  type RawStaffActionDoc,
  type StaffActionCounts,
  type StaffActionRow,
  mapStaffActionRows
} from '@/lib/staffAudit/staffActionRows'
import AtmRequest from '@/models/AtmRequest'
import GuildConfiguration from '@/models/GuildConfiguration'
import Transaction from '@/models/Transaction'

import { requireGuildAccess } from '../perms'

export type {
  StaffActionCounts,
  StaffActionRow
} from '@/lib/staffAudit/staffActionRows'

function buildUnifiedPipeline(
  guildId: string,
  filters: StaffActionsFilters,
  timezone?: string | null
): PipelineStage[] {
  const txMatch = buildStaffTransactionMatch(guildId, filters, timezone)
  const pipeline: PipelineStage[] = [
    { $match: txMatch },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        occurredAt: '$createdAt',
        actorId: '$handledBy',
        subjectUserId: '$userId',
        amount: '$amount',
        notes: '$meta.notes',
        meta: '$meta',
        txType: '$type',
        txSource: '$source',
        sourceType: { $literal: 'transaction' }
      }
    }
  ]

  if (shouldIncludeAtmRejectionUnion(filters.filterAction)) {
    const atmMatch = buildAtmRejectionMatch(guildId, filters, timezone)
    const transactionCollection = Transaction.collection.name

    pipeline.push({
      $unionWith: {
        coll: AtmRequest.collection.name,
        pipeline: [
          { $match: atmMatch },
          {
            $lookup: {
              from: transactionCollection,
              let: { reqId: '$requestId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$guildId', guildId] },
                        { $eq: ['$meta.requestId', '$$reqId'] },
                        { $eq: ['$meta.adminAction', 'atm-reject'] }
                      ]
                    }
                  }
                },
                { $limit: 1 }
              ],
              as: 'auditTwin'
            }
          },
          { $match: { auditTwin: { $size: 0 } } },
          {
            $project: {
              _id: 0,
              id: { $concat: ['atm:', '$requestId'] },
              occurredAt: {
                $ifNull: ['$handledAt', '$createdAt']
              },
              actorId: '$handledBy',
              subjectUserId: '$userId',
              amount: '$amount',
              notes: '$notes',
              meta: {
                requestId: '$requestId',
                requestedAmount: '$amount',
                type: '$type',
                adminAction: 'atm-reject'
              },
              txType: '$type',
              txSource: { $literal: 'web' },
              sourceType: { $literal: 'atmRequest' }
            }
          }
        ]
      }
    })
  }

  return pipeline
}

export async function getGuildStaffMembers(
  guildId: string
): Promise<{ userId: string; username: string }[]> {
  await connectToDatabase()

  const [config, members, adminRoleIds, guild] = await Promise.all([
    GuildConfiguration.findOne({ guildId }).select('managerRoleId').lean(),
    getDiscordGuildMembers(guildId),
    getGuildAdminRoleIds(guildId),
    discordBotRequest<{ owner_id: string }>({
      url: `/guilds/${guildId}`,
      method: 'GET'
    }).catch(() => null)
  ])

  const managerRoleId = config?.managerRoleId
  const ownerId = guild?.owner_id

  if (!managerRoleId && adminRoleIds.length === 0 && !ownerId) {
    return []
  }

  const staffMembers = await Promise.all(
    members.map(async (member) => {
      const isStaff = await resolveGuildStaffStatus(
        guildId,
        member.userId,
        managerRoleId,
        adminRoleIds,
        ownerId
      )
      return isStaff
        ? { userId: member.userId, username: member.username }
        : null
    })
  )

  return staffMembers
    .filter((member): member is { userId: string; username: string } =>
      Boolean(member)
    )
    .sort((a, b) => a.username.localeCompare(b.username))
}

export async function getStaffActions(
  guildId: string,
  session: Session,
  page = 1,
  limit = 15,
  filters: StaffActionsFilters = {}
): Promise<{ actions: StaffActionRow[]; total: number }> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access || page < 1 || limit < 1 || limit > 50) {
    return { actions: [], total: 0 }
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)
  const basePipeline = buildUnifiedPipeline(
    guildId,
    filters,
    globalSettings.timezone
  )

  const [result] = await Transaction.aggregate<{
    data: RawStaffActionDoc[]
    total: { count: number }[]
  }>([
    ...basePipeline,
    { $sort: { occurredAt: -1 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }]
      }
    }
  ])

  const rawRows = result?.data ?? []
  const total = result?.total[0]?.count ?? 0

  if (!rawRows.length) {
    return { actions: [], total }
  }

  const userIds = Array.from(
    new Set(
      rawRows.flatMap((row) => [row.actorId, row.subjectUserId].filter(Boolean))
    )
  )

  const discordMembers = await getDiscordGuildMembers(guildId)
  const discordMap = new Map(
    discordMembers
      .filter((member) => userIds.includes(member.userId))
      .map((member) => [
        member.userId,
        {
          username: member.username,
          nickname: member.nickname,
          avatar: member.avatarUrl || '/default-avatar.jpg'
        }
      ])
  )

  return {
    actions: mapStaffActionRows(guildId, rawRows, discordMap),
    total
  }
}

export async function getStaffActionCounts(
  guildId: string,
  session: Session,
  filters: Omit<StaffActionsFilters, 'filterAction'> = {}
): Promise<StaffActionCounts> {
  const access = await requireGuildAccess(guildId)
  if ('error' in access) {
    return emptyStaffActionCategoryCounts()
  }

  await connectToDatabase()

  const globalSettings = await getGuildGlobalSettings(guildId)

  const counts = await Promise.all(
    STAFF_ACTION_CATEGORIES.map(async (category) => {
      const pipeline = buildUnifiedPipeline(
        guildId,
        { ...filters, filterAction: [category] },
        globalSettings.timezone
      )

      const [result] = await Transaction.aggregate<{ count: number }>([
        ...pipeline,
        { $count: 'count' }
      ])

      return [category, result?.count ?? 0] as const
    })
  )

  return Object.fromEntries(counts) as StaffActionCounts
}

export async function fetchStaffActionsForExport(
  guildId: string,
  filters: StaffActionsFilters,
  timezone?: string | null,
  skip = 0,
  batchSize = 2000
): Promise<{ rows: RawStaffActionDoc[]; total: number }> {
  const basePipeline = buildUnifiedPipeline(guildId, filters, timezone)

  const [countResult] = await Transaction.aggregate<{ count: number }>([
    ...basePipeline,
    { $count: 'count' }
  ])
  const total = countResult?.count ?? 0

  const rows = await Transaction.aggregate<RawStaffActionDoc>([
    ...basePipeline,
    { $sort: { occurredAt: -1 } },
    { $skip: skip },
    { $limit: batchSize }
  ])

  return { rows, total }
}
