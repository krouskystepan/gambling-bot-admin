import { TAtmRequest } from 'gambling-bot-shared/atm'
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TTransaction
} from 'gambling-bot-shared/transactions'

import {
  type BadgeColor,
  badgeFilledClass,
  badgeOutlineClass
} from '@/components/badges/badgePalette'
import { TPredictionRow, TRaffleRow } from '@/types/types'

const filled = badgeFilledClass
const outline = badgeOutlineClass

const TYPE_COLOR_MAP: Record<TTransaction['type'], BadgeColor> = {
  deposit: 'emerald',
  withdraw: 'coral',
  bet: 'blue',
  win: 'teal',
  refund: 'purple',
  bonus: 'pink',
  vip: 'gold'
}

const SOURCE_COLOR_MAP: Record<TTransaction['source'], BadgeColor> = {
  command: 'blue',
  manual: 'coral',
  web: 'cyan',
  system: 'emerald',
  casino: 'orange'
}

const ATM_STATUS_COLOR_MAP: Record<TAtmRequest['status'], BadgeColor> = {
  pending: 'orange',
  approved: 'emerald',
  rejected: 'red'
}

export type UserProfileBadgeKey =
  | 'registered'
  | 'notRegistered'
  | 'banned'
  | 'vip'

export type VipRoleBadgeKey = 'owner' | 'member'

export type ManagerAccessBadgeKey = 'allowed' | 'denied'

export type BanLogStatusBadgeKey = 'active' | 'ended'

const MODERATION_BADGE_STYLES = {
  banned: outline('burgundy'),
  ban: outline('burgundy'),
  unban: outline('teal'),
  note: outline('cyan')
} as const

const BAN_LOG_STATUS_BADGE_STYLES: Record<BanLogStatusBadgeKey, string> = {
  active: filled('red'),
  ended: filled('gray')
}

const USER_PROFILE_BADGE_STYLES: Record<UserProfileBadgeKey, string> = {
  registered: outline('gray'),
  notRegistered: outline('coral'),
  banned: MODERATION_BADGE_STYLES.banned,
  vip: filled('gold')
}

const VIP_ROLE_BADGE_STYLES: Record<VipRoleBadgeKey, string> = {
  owner: filled('gold'),
  member: outline('gray')
}

const PREDICTION_STATUS_COLOR_MAP: Record<
  TPredictionRow['status'],
  BadgeColor
> = {
  active: 'emerald',
  ended: 'amber',
  paying: 'blue',
  paid: 'cyan',
  canceled: 'burgundy'
}

const RAFFLE_STATUS_COLOR_MAP: Record<TRaffleRow['status'], BadgeColor> = {
  active: 'emerald',
  canceled: 'burgundy'
}

const MANAGER_ACCESS_BADGE_STYLES: Record<ManagerAccessBadgeKey, string> = {
  allowed: outline('emerald'),
  denied: outline('red')
}

export const typeBadgeMap = Object.fromEntries(
  TRANSACTION_TYPES.map((type) => [type, filled(TYPE_COLOR_MAP[type])])
) as Record<TTransaction['type'], string>

export const sourceBadgeMap = Object.fromEntries(
  TRANSACTION_SOURCES.map((source) => [
    source,
    outline(SOURCE_COLOR_MAP[source])
  ])
) as Record<TTransaction['source'], string>

export const atmStatusBadgeMap = Object.fromEntries(
  (['pending', 'approved', 'rejected'] as const).map((status) => [
    status,
    filled(ATM_STATUS_COLOR_MAP[status])
  ])
) as Record<TAtmRequest['status'], string>

export const staffActionBadgeMap: Record<string, string> = {
  DEPOSIT: typeBadgeMap.deposit,
  WITHDRAW: typeBadgeMap.withdraw,
  BONUS: typeBadgeMap.bonus,
  VIP: typeBadgeMap.vip,
  BAN: MODERATION_BADGE_STYLES.ban,
  UNBAN: MODERATION_BADGE_STYLES.unban,
  NOTE: MODERATION_BADGE_STYLES.note,
  REJECT: filled('red'),
  RAFFLE: filled('purple'),
  PREDICT: filled('blue'),
  ACTION: outline('gray')
}

export const userProfileBadgeMap = USER_PROFILE_BADGE_STYLES
export const vipRoleBadgeMap = VIP_ROLE_BADGE_STYLES

export const predictionStatusBadgeMap = Object.fromEntries(
  Object.entries(PREDICTION_STATUS_COLOR_MAP).map(([status, color]) => [
    status,
    filled(color)
  ])
) as Record<TPredictionRow['status'], string>

export const raffleStatusBadgeMap = Object.fromEntries(
  Object.entries(RAFFLE_STATUS_COLOR_MAP).map(([status, color]) => [
    status,
    filled(color)
  ])
) as Record<TRaffleRow['status'], string>

export const managerAccessBadgeMap = MANAGER_ACCESS_BADGE_STYLES
export const banLogStatusBadgeMap = BAN_LOG_STATUS_BADGE_STYLES

export function getTransactionTypeBadgeClass(
  type: TTransaction['type']
): string {
  return typeBadgeMap[type] ?? filled('gray')
}

export function getTransactionSourceBadgeClass(
  source: TTransaction['source']
): string {
  return sourceBadgeMap[source] ?? outline('gray')
}

export function getAtmStatusBadgeClass(status: TAtmRequest['status']): string {
  return atmStatusBadgeMap[status] ?? filled('gray')
}

export function getStaffActionBadgeClass(badge: string): string {
  return staffActionBadgeMap[badge] ?? staffActionBadgeMap.ACTION
}

export function getUserProfileBadgeClass(key: UserProfileBadgeKey): string {
  return userProfileBadgeMap[key]
}

export function getVipRoleBadgeClass(role: VipRoleBadgeKey): string {
  return vipRoleBadgeMap[role]
}

export function getPredictionStatusBadgeClass(
  status: TPredictionRow['status']
): string {
  return predictionStatusBadgeMap[status] ?? filled('gray')
}

export function getRaffleStatusBadgeClass(
  status: TRaffleRow['status']
): string {
  return raffleStatusBadgeMap[status] ?? filled('gray')
}

export function getManagerAccessBadgeClass(key: ManagerAccessBadgeKey): string {
  return managerAccessBadgeMap[key]
}

export function getBanLogStatusBadgeClass(key: BanLogStatusBadgeKey): string {
  return banLogStatusBadgeMap[key]
}
