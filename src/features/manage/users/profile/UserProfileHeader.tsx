import Image from 'next/image'

import type { UserProfileData } from '@/actions/database/userProfile.action'
import { Badge } from '@/components/ui/badge'
import OverviewPeriodSelect from '@/features/general/overview/components/OverviewPeriodSelect'
import { TGuildMemberStatus } from '@/types/types'

import UserActionsMenu from './UserActionsMenu'

type UserProfileHeaderProps = {
  guildId: string
  managerId: string
  isGuildAdmin: boolean
  profile: UserProfileData
  dateFrom: string
  dateTo: string
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
    netProfit: profile.lifetimeNetProfit
  }

  return (
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
          </div>
          {profile.nickname ? (
            <p className="text-sm text-muted-foreground">{profile.nickname}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Discord ID: {profile.userId}
          </p>
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
  )
}

export default UserProfileHeader
