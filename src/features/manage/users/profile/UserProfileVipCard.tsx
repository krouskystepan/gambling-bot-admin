import Image from 'next/image'
import Link from 'next/link'

import type { UserProfileVip } from '@/actions/database/userProfile.action'
import ColoredBadge from '@/components/badges/ColoredBadge'
import { getVipRoleBadgeClass } from '@/components/badges/badgeStyles'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

type UserProfileVipCardProps = {
  guildId: string
  vips: UserProfileVip[]
}

const UserProfileVipCard = ({ guildId, vips }: UserProfileVipCardProps) => {
  if (vips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VIP rooms</CardTitle>
          <CardDescription>No VIP room membership</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {vips.map((vip) => (
        <Card key={vip.channelId}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{vip.channelName}</CardTitle>
              <ColoredBadge colorClass={getVipRoleBadgeClass(vip.role)}>
                {vip.role === 'owner' ? 'Owner' : 'Member'}
              </ColoredBadge>
            </div>
            <CardDescription>
              Channel {vip.channelId} · Created{' '}
              {new Date(vip.createdAt).toLocaleDateString('cs')} · Expires{' '}
              {new Date(vip.expiresAt).toLocaleDateString('cs')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vip.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {vip.members.map((member) => (
                  <Link
                    key={member.userId}
                    href={`/dashboard/g/${guildId}/users/${member.userId}`}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <Image
                      src={member.avatar}
                      alt={member.username}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.username}
                      </p>
                      {member.nickname ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {member.nickname}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default UserProfileVipCard
