import { formatNumberToReadableString } from 'gambling-bot-shared'
import Image from 'next/image'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { OverviewTopUser } from '@/actions/database/overview.action'

type OverviewTopUsersPanelProps = {
  guildId: string
  topByBalance: OverviewTopUser[]
  topByNetProfit: OverviewTopUser[]
}

const UserList = ({
  title,
  users,
  valueKey,
  guildId
}: {
  title: string
  users: OverviewTopUser[]
  valueKey: 'balance' | 'netProfit'
  guildId: string
}) => (
  <div className="flex-1 min-w-[240px]">
    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
      {title}
    </h4>
    {users.length === 0 ? (
      <p className="text-sm text-muted-foreground">No data yet.</p>
    ) : (
      <ul className="space-y-3">
        {users.map((user, index) => (
          <li key={user.userId} className="flex items-center gap-3">
            <span className="w-5 text-sm text-muted-foreground">
              {index + 1}
            </span>
            <Image
              src={user.avatar}
              alt={user.username}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/g/${guildId}/users?search=${user.userId}`}
                className="truncate font-medium hover:text-primary hover:underline"
              >
                {user.username}
              </Link>
              {user.nickname ? (
                <p className="truncate text-xs text-muted-foreground">
                  {user.nickname}
                </p>
              ) : null}
            </div>
            <span
              className={
                valueKey === 'netProfit' && user.netProfit < 0
                  ? 'font-semibold text-red-600'
                  : valueKey === 'netProfit' && user.netProfit > 0
                    ? 'font-semibold text-green-600'
                    : 'font-semibold tabular-nums'
              }
            >
              ${formatNumberToReadableString(user[valueKey])}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
)

const OverviewTopUsersPanel = ({
  guildId,
  topByBalance,
  topByNetProfit
}: OverviewTopUsersPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Top users</CardTitle>
      <CardDescription>Balance and net profit leaders in period</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-8">
      <UserList
        title="Highest balance"
        users={topByBalance}
        valueKey="balance"
        guildId={guildId}
      />
      <UserList
        title="Highest net profit"
        users={topByNetProfit}
        valueKey="netProfit"
        guildId={guildId}
      />
    </CardContent>
  </Card>
)

export default OverviewTopUsersPanel
