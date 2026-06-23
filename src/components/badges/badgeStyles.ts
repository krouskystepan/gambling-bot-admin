import { TAtmRequest } from 'gambling-bot-shared/atm'
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  TTransaction
} from 'gambling-bot-shared/transactions'

const TYPE_BADGE_STYLES: Record<TTransaction['type'], string> = {
  deposit: 'bg-chart-2 text-white',
  withdraw: 'bg-destructive text-white',
  bet: 'bg-chart-1 text-white',
  win: 'bg-emerald-700 text-white',
  refund: 'bg-chart-4 text-white',
  bonus: 'bg-primary text-primary-foreground',
  vip: 'bg-chart-5 text-white'
}

const SOURCE_BADGE_STYLES: Record<TTransaction['source'], string> = {
  casino: 'bg-chart-3 text-white',
  command: 'bg-chart-1 text-white',
  manual: 'bg-destructive text-white',
  system: 'bg-[var(--tag-emerald)] text-white',
  web: 'bg-cyan-600 text-white'
}

export const typeBadgeMap = Object.fromEntries(
  TRANSACTION_TYPES.map((type) => [type, TYPE_BADGE_STYLES[type]])
) as Record<TTransaction['type'], string>

export const sourceBadgeMap = Object.fromEntries(
  TRANSACTION_SOURCES.map((source) => [source, SOURCE_BADGE_STYLES[source]])
) as Record<TTransaction['source'], string>

const ATM_STATUS_BADGE_STYLES: Record<TAtmRequest['status'], string> = {
  pending: 'bg-amber-600 text-white',
  approved: TYPE_BADGE_STYLES.deposit,
  rejected: 'bg-destructive text-white'
}

export const atmStatusBadgeMap = Object.fromEntries(
  (['pending', 'approved', 'rejected'] as const).map((status) => [
    status,
    ATM_STATUS_BADGE_STYLES[status]
  ])
) as Record<TAtmRequest['status'], string>

export function getTransactionTypeBadgeClass(
  type: TTransaction['type']
): string {
  return typeBadgeMap[type] ?? 'bg-gray-600 text-white'
}

export function getTransactionSourceBadgeClass(
  source: TTransaction['source']
): string {
  return sourceBadgeMap[source] ?? 'bg-gray-600 text-white'
}

export function getAtmStatusBadgeClass(status: TAtmRequest['status']): string {
  return atmStatusBadgeMap[status] ?? 'bg-gray-600 text-white'
}
