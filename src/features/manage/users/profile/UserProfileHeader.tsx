import { Crown } from 'lucide-react'

import Image from 'next/image'

import type { UserProfileData } from '@/actions/database/userProfile.action'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import OverviewPeriodSelect from '@/features/general/overview/components/OverviewPeriodSelect'
import { TGuildMemberStatus } from '@/types/types'

import UserActionsMenu from './UserActionsMenu'
import UserProfileModerationSection from './UserProfileModerationSection'

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

  const hasModerationContent =
    profile.staffNotes.length > 0 ||
    profile.banned ||
    profile.banHistory.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Image
            src={profile.avatar}
            alt={profile.username}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{profile.username}</h2>
              <Badge
                variant={profile.registered ? 'default' : 'destructive'}
                className="px-2.5"
              >
                {profile.registered ? 'Registered' : 'Not Registered'}
              </Badge>
              {profile.banned ? (
                <Badge variant="destructive" className="px-2.5">
                  Banned
                </Badge>
              ) : null}
              {profile.vips.length > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 px-2.5">
                      <Crown className="h-3 w-3" />
                      VIP
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs space-y-1">
                    {profile.vips.map((vip) => (
                      <p key={vip.channelId} className="text-sm">
                        {vip.role === 'owner' ? 'Owner' : 'Member'} ·{' '}
                        {formatVipChannelLabel(vip.channelName, vip.channelId)}{' '}
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
            <p className="text-sm text-muted-foreground">
              Discord ID: {profile.userId}
            </p>
            {profile.banned && profile.bannedAt ? (
              <p className="text-sm text-muted-foreground">
                Banned since {new Date(profile.bannedAt).toLocaleString('cs')}
                {profile.bannedBy
                  ? ` by ${profile.bannedByUsername ?? profile.bannedBy}`
                  : ''}
              </p>
            ) : null}
            {profile.registeredAt ? (
              <p className="text-sm text-muted-foreground">
                Registered{' '}
                {new Date(profile.registeredAt).toLocaleDateString('cs')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <OverviewPeriodSelect dateFrom={dateFrom} dateTo={dateTo} />
          <UserActionsMenu
            guildId={guildId}
            managerId={managerId}
            user={userForActions}
            globalSettings={profile.globalSettings}
            isGuildAdmin={isGuildAdmin}
          />
        </div>
      </div>

      {profile.registered && hasModerationContent ? (
        <UserProfileModerationSection
          staffNotes={profile.staffNotes}
          banHistory={profile.banHistory}
          banned={profile.banned}
        />
      ) : null}
    </div>
  )
}

export default UserProfileHeader
