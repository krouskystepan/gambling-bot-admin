import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES
} from 'gambling-bot-shared/transactions'
import { Crown } from 'lucide-react'

import ColoredBadge from '@/components/badges/ColoredBadge'
import {
  atmStatusBadgeMap,
  banLogStatusBadgeMap,
  getManagerAccessBadgeClass,
  getStaffActionBadgeClass,
  getUserProfileBadgeClass,
  getVipRoleBadgeClass,
  predictionStatusBadgeMap,
  raffleStatusBadgeMap,
  settingsChangeSectionBadgeMap,
  sourceBadgeMap,
  typeBadgeMap
} from '@/components/badges/badgeStyles'
import { Badge } from '@/components/ui/badge'
import { SETTINGS_CHANGE_SECTION_LABELS } from '@/lib/settingsAudit/settingsChangeSections'
import { cn } from '@/lib/utils'

const STAFF_ACTION_BADGES = [
  'DEPOSIT',
  'WITHDRAW',
  'BONUS',
  'VIP',
  'BAN',
  'UNBAN',
  'NOTE',
  'REJECT',
  'RAFFLE',
  'PREDICT',
  'ACTION'
] as const

const ATM_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const

type BadgeSectionProps = {
  title: string
  subtitle: string
  variant: 'filled' | 'outline' | 'mixed'
  children: React.ReactNode
}

const BadgeSection = ({
  title,
  subtitle,
  variant,
  children
}: BadgeSectionProps) => (
  <section
    className={cn(
      'overflow-hidden rounded-xl border',
      variant === 'filled' && 'border-border/60 bg-muted/20',
      variant === 'outline' && 'border-dashed border-border bg-background',
      variant === 'mixed' && 'border-border/60 bg-muted/10'
    )}
  >
    <div className="border-b px-4 py-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <div className="grid gap-0 md:grid-cols-2">{children}</div>
  </section>
)

type ThemePanelProps = {
  mode: 'light' | 'dark'
  children: React.ReactNode
}

const ThemePanel = ({ mode, children }: ThemePanelProps) => (
  <div
    className={cn(
      'space-y-3 p-4',
      mode === 'light'
        ? 'border-border/50 bg-white text-foreground md:border-r'
        : 'dark border-border/50 bg-card text-foreground'
    )}
  >
    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      {mode === 'light' ? 'Light mode' : 'Dark mode'}
    </p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

const BAN_LOG_STATUS_LABELS: Record<keyof typeof banLogStatusBadgeMap, string> =
  {
    active: 'Active',
    ended: 'Ended'
  }

const BadgeShowcase = () => {
  return (
    <div className="space-y-6">
      <BadgeSection
        title="Transaction types"
        subtitle="Filled badges - solid background, white text (gold uses dark text)"
        variant="filled"
      >
        <ThemePanel mode="light">
          {TRANSACTION_TYPES.map((type) => (
            <ColoredBadge key={type} colorClass={typeBadgeMap[type]}>
              {type.toUpperCase()}
            </ColoredBadge>
          ))}
        </ThemePanel>
        <ThemePanel mode="dark">
          {TRANSACTION_TYPES.map((type) => (
            <ColoredBadge key={type} colorClass={typeBadgeMap[type]}>
              {type.toUpperCase()}
            </ColoredBadge>
          ))}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Transaction sources"
        subtitle="Outline badges - tinted fill with colored border and text"
        variant="outline"
      >
        <ThemePanel mode="light">
          {TRANSACTION_SOURCES.map((source) => (
            <ColoredBadge key={source} colorClass={sourceBadgeMap[source]}>
              {source.toUpperCase()}
            </ColoredBadge>
          ))}
        </ThemePanel>
        <ThemePanel mode="dark">
          {TRANSACTION_SOURCES.map((source) => (
            <ColoredBadge key={source} colorClass={sourceBadgeMap[source]}>
              {source.toUpperCase()}
            </ColoredBadge>
          ))}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="ATM queue"
        subtitle="Filled badges - operational status"
        variant="filled"
      >
        <ThemePanel mode="light">
          {ATM_STATUSES.map((status) => (
            <ColoredBadge key={status} colorClass={atmStatusBadgeMap[status]}>
              {status.toUpperCase()}
            </ColoredBadge>
          ))}
        </ThemePanel>
        <ThemePanel mode="dark">
          {ATM_STATUSES.map((status) => (
            <ColoredBadge key={status} colorClass={atmStatusBadgeMap[status]}>
              {status.toUpperCase()}
            </ColoredBadge>
          ))}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Staff actions"
        subtitle="Transaction-like badges are filled; moderation badges (BAN, UNBAN, NOTE) use outline"
        variant="mixed"
      >
        <ThemePanel mode="light">
          {STAFF_ACTION_BADGES.map((badge) => (
            <ColoredBadge
              key={badge}
              colorClass={getStaffActionBadgeClass(badge)}
            >
              {badge}
            </ColoredBadge>
          ))}
        </ThemePanel>
        <ThemePanel mode="dark">
          {STAFF_ACTION_BADGES.map((badge) => (
            <ColoredBadge
              key={badge}
              colorClass={getStaffActionBadgeClass(badge)}
            >
              {badge}
            </ColoredBadge>
          ))}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Ban log status"
        subtitle="Filled badges - active ban cycle vs ended"
        variant="filled"
      >
        <ThemePanel mode="light">
          {Object.entries(banLogStatusBadgeMap).map(([status, className]) => (
            <ColoredBadge key={status} colorClass={className} className="px-2">
              {
                BAN_LOG_STATUS_LABELS[
                  status as keyof typeof banLogStatusBadgeMap
                ]
              }
            </ColoredBadge>
          ))}
        </ThemePanel>
        <ThemePanel mode="dark">
          {Object.entries(banLogStatusBadgeMap).map(([status, className]) => (
            <ColoredBadge key={status} colorClass={className} className="px-2">
              {
                BAN_LOG_STATUS_LABELS[
                  status as keyof typeof banLogStatusBadgeMap
                ]
              }
            </ColoredBadge>
          ))}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Settings changes"
        subtitle="Outline badges - settings section that was modified"
        variant="outline"
      >
        <ThemePanel mode="light">
          {Object.entries(settingsChangeSectionBadgeMap).map(
            ([section, className]) => (
              <ColoredBadge
                key={section}
                colorClass={className}
                className="px-2"
              >
                {
                  SETTINGS_CHANGE_SECTION_LABELS[
                    section as keyof typeof settingsChangeSectionBadgeMap
                  ]
                }
              </ColoredBadge>
            )
          )}
        </ThemePanel>
        <ThemePanel mode="dark">
          {Object.entries(settingsChangeSectionBadgeMap).map(
            ([section, className]) => (
              <ColoredBadge
                key={section}
                colorClass={className}
                className="px-2"
              >
                {
                  SETTINGS_CHANGE_SECTION_LABELS[
                    section as keyof typeof settingsChangeSectionBadgeMap
                  ]
                }
              </ColoredBadge>
            )
          )}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="User profile"
        subtitle="Outline for registration and banned state; filled for VIP"
        variant="mixed"
      >
        <ThemePanel mode="light">
          <ColoredBadge colorClass={getUserProfileBadgeClass('registered')}>
            Registered
          </ColoredBadge>
          <ColoredBadge colorClass={getUserProfileBadgeClass('notRegistered')}>
            Not Registered
          </ColoredBadge>
          <ColoredBadge colorClass={getUserProfileBadgeClass('banned')}>
            Banned
          </ColoredBadge>
          <ColoredBadge
            colorClass={getUserProfileBadgeClass('vip')}
            className="gap-1"
          >
            <Crown className="size-3" aria-hidden />
            VIP
          </ColoredBadge>
        </ThemePanel>
        <ThemePanel mode="dark">
          <ColoredBadge colorClass={getUserProfileBadgeClass('registered')}>
            Registered
          </ColoredBadge>
          <ColoredBadge colorClass={getUserProfileBadgeClass('notRegistered')}>
            Not Registered
          </ColoredBadge>
          <ColoredBadge colorClass={getUserProfileBadgeClass('banned')}>
            Banned
          </ColoredBadge>
          <ColoredBadge
            colorClass={getUserProfileBadgeClass('vip')}
            className="gap-1"
          >
            <Crown className="size-3" aria-hidden />
            VIP
          </ColoredBadge>
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="VIP roles"
        subtitle="Filled owner; outline member"
        variant="mixed"
      >
        <ThemePanel mode="light">
          <ColoredBadge colorClass={getVipRoleBadgeClass('owner')}>
            Owner
          </ColoredBadge>
          <ColoredBadge colorClass={getVipRoleBadgeClass('member')}>
            Member
          </ColoredBadge>
        </ThemePanel>
        <ThemePanel mode="dark">
          <ColoredBadge colorClass={getVipRoleBadgeClass('owner')}>
            Owner
          </ColoredBadge>
          <ColoredBadge colorClass={getVipRoleBadgeClass('member')}>
            Member
          </ColoredBadge>
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Prediction status"
        subtitle="Filled badges - event lifecycle"
        variant="filled"
      >
        <ThemePanel mode="light">
          {Object.entries(predictionStatusBadgeMap).map(
            ([status, className]) => (
              <ColoredBadge
                key={status}
                colorClass={className}
                className="capitalize"
              >
                {status}
              </ColoredBadge>
            )
          )}
        </ThemePanel>
        <ThemePanel mode="dark">
          {Object.entries(predictionStatusBadgeMap).map(
            ([status, className]) => (
              <ColoredBadge
                key={status}
                colorClass={className}
                className="capitalize"
              >
                {status}
              </ColoredBadge>
            )
          )}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Raffle status"
        subtitle="Filled badges - active and canceled"
        variant="filled"
      >
        <ThemePanel mode="light">
          {Object.entries(raffleStatusBadgeMap).map(([status, className]) => (
            <ColoredBadge
              key={status}
              colorClass={className}
              className="capitalize"
            >
              {status}
            </ColoredBadge>
          ))}
        </ThemePanel>
        <ThemePanel mode="dark">
          {Object.entries(raffleStatusBadgeMap).map(([status, className]) => (
            <ColoredBadge
              key={status}
              colorClass={className}
              className="capitalize"
            >
              {status}
            </ColoredBadge>
          ))}
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Manager access"
        subtitle="Outline badges - permission granted or denied"
        variant="outline"
      >
        <ThemePanel mode="light">
          <ColoredBadge colorClass={getManagerAccessBadgeClass('allowed')}>
            Allowed
          </ColoredBadge>
          <ColoredBadge colorClass={getManagerAccessBadgeClass('denied')}>
            Not allowed
          </ColoredBadge>
        </ThemePanel>
        <ThemePanel mode="dark">
          <ColoredBadge colorClass={getManagerAccessBadgeClass('allowed')}>
            Allowed
          </ColoredBadge>
          <ColoredBadge colorClass={getManagerAccessBadgeClass('denied')}>
            Not allowed
          </ColoredBadge>
        </ThemePanel>
      </BadgeSection>

      <BadgeSection
        title="Sidebar notifications"
        subtitle="Unchanged shadcn destructive variant - not part of domain palette"
        variant="mixed"
      >
        <ThemePanel mode="light">
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
        </ThemePanel>
        <ThemePanel mode="dark">
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
        </ThemePanel>
      </BadgeSection>
    </div>
  )
}

export default BadgeShowcase
