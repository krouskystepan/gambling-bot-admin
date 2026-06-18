import { typeBadgeMap } from '@/components/badges/badgeStyles'

const eventBadgeMap: Record<string, string> = {
  REJECT: 'bg-destructive text-white',
  RAFFLE: 'bg-chart-4 text-white',
  PREDICT: 'bg-chart-1 text-white',
  ACTION: 'bg-muted text-muted-foreground'
}

export function getStaffActionBadgeStyle(badge: string): string {
  switch (badge) {
    case 'DEPOSIT':
      return typeBadgeMap.deposit
    case 'WITHDRAW':
      return typeBadgeMap.withdraw
    case 'BONUS':
      return typeBadgeMap.bonus
    case 'VIP':
      return typeBadgeMap.vip
    default:
      return eventBadgeMap[badge] ?? eventBadgeMap.ACTION
  }
}
