import type { StaffActionCategory } from 'gambling-bot-shared/transactions'

import {
  resolveStaffActionDetailHref,
  resolveStaffActionLabel
} from '@/lib/staffAudit/staffActionLabels'

export type StaffActionRow = {
  id: string
  occurredAt: Date
  actorId: string
  actorUsername?: string | null
  actorAvatar?: string | null
  subjectUserId: string
  subjectUsername?: string | null
  subjectNickname?: string | null
  subjectAvatar?: string | null
  actionLabel: string
  actionBadge: string
  actionSublabel?: string | null
  category: StaffActionCategory
  amount?: number | null
  notes?: string | null
  meta?: Record<string, unknown>
  detailHref?: string
}

export type StaffActionCounts = Record<StaffActionCategory, number>

export type RawStaffActionDoc = {
  id: string
  occurredAt: Date
  actorId: string
  subjectUserId: string
  amount?: number | null
  notes?: string | null
  meta?: Record<string, unknown>
  txType?: string
  txSource?: string
  sourceType: 'transaction' | 'atmRequest'
}

function mapRawToStaffActionRow(
  guildId: string,
  doc: RawStaffActionDoc,
  discordMap: Map<
    string,
    { username: string; nickname: string | null; avatar: string }
  >
): StaffActionRow {
  const { label, category, badge, sublabel } = resolveStaffActionLabel({
    type: doc.txType,
    source: doc.txSource,
    meta: doc.meta,
    sourceType: doc.sourceType
  })

  const actor = discordMap.get(doc.actorId)
  const subject = discordMap.get(doc.subjectUserId)

  return {
    id: doc.id,
    occurredAt: doc.occurredAt,
    actorId: doc.actorId,
    actorUsername: actor?.username ?? 'Unknown',
    actorAvatar: actor?.avatar ?? '/default-avatar.jpg',
    subjectUserId: doc.subjectUserId,
    subjectUsername: subject?.username ?? 'Unknown',
    subjectNickname: subject?.nickname ?? null,
    subjectAvatar: subject?.avatar ?? '/default-avatar.jpg',
    actionLabel: label,
    actionBadge: badge,
    actionSublabel: sublabel,
    category,
    amount: doc.amount ?? null,
    notes: (doc.notes as string | undefined) ?? null,
    meta: doc.meta,
    detailHref: resolveStaffActionDetailHref(guildId, {
      type: doc.txType,
      meta: doc.meta,
      sourceType: doc.sourceType
    })
  }
}

export function enrichStaffActionRows(
  guildId: string,
  rawRows: RawStaffActionDoc[],
  discordMap: Map<string, string>
): StaffActionRow[] {
  const memberMap = new Map<
    string,
    { username: string; nickname: string | null; avatar: string }
  >()

  for (const [userId, username] of discordMap) {
    memberMap.set(userId, {
      username,
      nickname: null,
      avatar: '/default-avatar.jpg'
    })
  }

  return rawRows.map((row) => mapRawToStaffActionRow(guildId, row, memberMap))
}

export function mapStaffActionRows(
  guildId: string,
  rawRows: RawStaffActionDoc[],
  discordMap: Map<
    string,
    { username: string; nickname: string | null; avatar: string }
  >
): StaffActionRow[] {
  return rawRows.map((row) => mapRawToStaffActionRow(guildId, row, discordMap))
}
