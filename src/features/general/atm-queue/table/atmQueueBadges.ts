import { TAtmRequest } from 'gambling-bot-shared'

export const typeBadgeMap: Record<TAtmRequest['type'], string> = {
  deposit: 'bg-green-600',
  withdraw: 'bg-blue-600'
}

export const statusBadgeMap: Record<TAtmRequest['status'], string> = {
  pending: 'bg-amber-600',
  approved: 'bg-green-600',
  rejected: 'bg-red-600'
}
