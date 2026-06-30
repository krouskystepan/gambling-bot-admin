import { Crown } from 'lucide-react'

import Image from 'next/image'

import type { UserProfileData } from '@/actions/database/userProfile.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getUserProfileBadgeClass } from '@/components/badges/badgeStyles'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import OverviewPeriodSelect from '@/features/general/overview/components/OverviewPeriodSelect'
import { TGuildMemberStatus } from '@/types/types'

import BanHistoryDialog from './BanHistoryDialog'
import ProfileHeaderToolbarSeparator from './ProfileHeaderToolbarSeparator'
import StaffNotesDialog from './StaffNotesDialog'
import UserActionsMenu from './UserActionsMenu'

type UserProfileHeaderProps = {
  guildId: string
  managerId: string
  isGuildAdmin: boolean
  profile: UserProfileData
  dateFrom: string
  dateTo: string
}

function formatVipChannelLabel(channelName: string, channelId: string) {
  if (channelName && channelName !== 'VIP room') {
    return `#${channelName}`
  }

  return `channel ${channelId}`
}

const UserProfileHeader = ({
  guildId,
  managerId,
  isGuildAdmin,
  profile,
  dateFrom,
  dateTo
}: UserProfileHeaderProps) => {
  const userForActions: TGuildMemberStatus = {
    userId: profile.userId,
    username: profile.username,
    nickname: profile.nickname,
    avatar: profile.avatar,
    registered: profile.registered,
    registeredAt: profile.registeredAt,
    balance: profile.balance,
    netProfit: profile.lifetimeNetProfit,
    banned: profile.banned
  }

  const showModerationToolbar = profile.registered

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-stretch justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Image
            src={profile.avatar}
            alt={profile.username}
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full"
          />
          <div className="flex min-h-16 min-w-0 flex-1 flex-col justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{profile.username}</h2>
                <ColoredBadge
                  colorClass={getUserProfileBadgeClass(
                    profile.registered ? 'registered' : 'notRegistered'
                  )}
                >
                  {profile.registered ? 'Registered' : 'Not Registered'}
                </ColoredBadge>
                {profile.banned ? (
                  <ColoredBadge colorClass={getUserProfileBadgeClass('banned')}>
                    Banned
                  </ColoredBadge>
                ) : null}
                {profile.vips.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <ColoredBadge
                          colorClass={getUserProfileBadgeClass('vip')}
                          className="gap-1"
                        >
                          <Crown className="size-3" aria-hidden />
                          VIP
                        </ColoredBadge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs space-y-1">
                      {profile.vips.map((vip) => (
                        <p key={vip.channelId} className="text-sm">
                          {vip.role === 'owner' ? 'Owner' : 'Member'} ·{' '}
                          {formatVipChannelLabel(
                            vip.channelName,
                            vip.channelId
                          )}{' '}
                          · expires{' '}
                          {new Date(vip.expiresAt).toLocaleDateString('cs')}
                        </p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              {profile.nickname ? (
                <p className="text-sm text-muted-foreground">
                  {profile.nickname}
                </p>
              ) : null}
            </div>

            <div className="space-y-0.5 text-sm text-muted-foreground">
              <p>Discord ID: {profile.userId}</p>
              {profile.registeredAt ? (
                <p>
                  Registered{' '}
                  {new Date(profile.registeredAt).toLocaleDateString('cs')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-between gap-3 self-stretch">
          <OverviewPeriodSelect dateFrom={dateFrom} dateTo={dateTo} />
          <div className="flex items-center gap-2">
            {showModerationToolbar ? (
              <>
                <BanHistoryDialog bans={profile.bans} banned={profile.banned} />
                <ProfileHeaderToolbarSeparator />
                <StaffNotesDialog
                  guildId={guildId}
                  userId={profile.userId}
                  managerId={managerId}
                  isGuildAdmin={isGuildAdmin}
                  notes={profile.staffNotes}
                />
                <ProfileHeaderToolbarSeparator />
              </>
            ) : null}
            <UserActionsMenu
              guildId={guildId}
              managerId={managerId}
              user={userForActions}
              globalSettings={profile.globalSettings}
              isGuildAdmin={isGuildAdmin}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileHeader
