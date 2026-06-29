import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES
} from 'gambling-bot-shared/transactions'
import { Crown } from 'lucide-react'

import ColoredBadge from '@/components/badges/ColoredBadge'
import {
  atmStatusBadgeMap,
  sourceBadgeMap,
  typeBadgeMap
} from '@/components/badges/badgeStyles'
import { Badge } from '@/components/ui/badge'
import { getStaffActionBadgeStyle } from '@/features/general/staff-actions/table/staffActionsBadges'
import { cn } from '@/lib/utils'

const STAFF_ACTION_BADGES = [
  'DEPOSIT',
  'WITHDRAW',
  'BONUS',
  'VIP',
  'REJECT',
  'RAFFLE',
  'PREDICT',
  'ACTION'
] as const

const ATM_STATUSES = ['pending', 'approved', 'rejected'] as const

const predictionStatusBadgeClass = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ended: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  paying: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  paid: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  canceled: 'bg-red-500/15 text-red-700 dark:text-red-400'
} as const

const raffleStatusBadgeClass = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  canceled: 'bg-red-500/15 text-red-700 dark:text-red-400'
} as const

const BadgeGroup = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {title}
    </p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

const BadgeShowcase = () => {
  return (
    <div className="space-y-8">
      <BadgeGroup title="Transaction types">
        {TRANSACTION_TYPES.map((type) => (
          <ColoredBadge key={type} colorClass={typeBadgeMap[type]}>
            {type.toUpperCase()}
          </ColoredBadge>
        ))}
      </BadgeGroup>

      <BadgeGroup title="Transaction sources">
        {TRANSACTION_SOURCES.map((source) => (
          <ColoredBadge key={source} colorClass={sourceBadgeMap[source]}>
            {source.toUpperCase()}
          </ColoredBadge>
        ))}
      </BadgeGroup>

      <BadgeGroup title="ATM statuses">
        {ATM_STATUSES.map((status) => (
          <ColoredBadge key={status} colorClass={atmStatusBadgeMap[status]}>
            {status.toUpperCase()}
          </ColoredBadge>
        ))}
      </BadgeGroup>

      <BadgeGroup title="Staff action badges">
        {STAFF_ACTION_BADGES.map((badge) => (
          <ColoredBadge
            key={badge}
            colorClass={getStaffActionBadgeStyle(badge)}
          >
            {badge}
          </ColoredBadge>
        ))}
      </BadgeGroup>

      <BadgeGroup title="User profile">
        <Badge variant="default" className="px-2.5">
          Registered
        </Badge>
        <Badge variant="destructive" className="px-2.5">
          Not Registered
        </Badge>
        <Badge variant="destructive" className="px-2.5">
          Banned
        </Badge>
        <Badge variant="secondary" className="gap-1 px-2.5">
          <Crown className="h-3 w-3" />
          VIP
        </Badge>
      </BadgeGroup>

      <BadgeGroup title="VIP role">
        <Badge variant="default">Owner</Badge>
        <Badge variant="secondary">Member</Badge>
      </BadgeGroup>

      <BadgeGroup title="Prediction status">
        {Object.entries(predictionStatusBadgeClass).map(
          ([status, className]) => (
            <Badge key={status} className={cn(className, 'px-2 capitalize')}>
              {status}
            </Badge>
          )
        )}
      </BadgeGroup>

      <BadgeGroup title="Raffle status">
        {Object.entries(raffleStatusBadgeClass).map(([status, className]) => (
          <Badge key={status} className={cn(className, 'px-2 capitalize')}>
            {status}
          </Badge>
        ))}
      </BadgeGroup>

      <BadgeGroup title="Manager access">
        <Badge
          variant="outline"
          className="rounded-md border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
        >
          Allowed
        </Badge>
        <Badge
          variant="outline"
          className="rounded-md border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
        >
          Not allowed
        </Badge>
      </BadgeGroup>

      <BadgeGroup title="Sidebar notifications">
        <Badge
          variant="destructive"
          className="min-w-8 justify-center tabular-nums"
        >
          3
        </Badge>
        <Badge
          variant="destructive"
          className="min-w-8 justify-center tabular-nums"
        >
          99+
        </Badge>
      </BadgeGroup>
    </div>
  )
}

export default BadgeShowcase
