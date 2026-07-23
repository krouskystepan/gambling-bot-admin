import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getDevGuildCounts } from '@/lib/dev/devGuildDiagnostics'
import { cn } from '@/lib/utils'

type DevGuildStatsCardProps = {
  guildId: string
}

const StatTile = ({
  label,
  value,
  tone = 'default'
}: {
  label: string
  value: string | number
  tone?: 'default' | 'warning' | 'danger'
}) => (
  <div
    className={cn(
      'rounded-lg border px-3 py-2',
      tone === 'warning' && 'border-amber-500/30 bg-amber-500/5',
      tone === 'danger' && 'border-destructive/30 bg-destructive/5',
      tone === 'default' && 'bg-muted/30'
    )}
  >
    <p className="text-xs text-muted-foreground uppercase">{label}</p>
    <p className="text-lg font-semibold tabular-nums">{value}</p>
  </div>
)

const DevGuildStatsCard = async ({ guildId }: DevGuildStatsCardProps) => {
  const counts = await getDevGuildCounts(guildId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections</CardTitle>
        <CardDescription>
          Document counts for this guild in MongoDB.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Users" value={counts.users} />
        <StatTile label="Registered" value={counts.registeredUsers} />
        <StatTile label="Transactions" value={counts.transactions} />
        <StatTile
          label="ATM pending"
          value={counts.atmPending}
          tone={counts.atmPending > 0 ? 'warning' : 'default'}
        />
        <StatTile label="ATM approved" value={counts.atmApproved} />
        <StatTile label="ATM rejected" value={counts.atmRejected} />
        <StatTile label="Predictions" value={counts.predictions} />
        <StatTile label="Raffles" value={counts.raffles} />
        <StatTile label="VIP rooms" value={counts.vipRooms} />
        <StatTile label="Blackjack" value={counts.blackjackGames} />
        <StatTile label="Baccarat" value={counts.baccaratGames} />
        <StatTile label="Mines" value={counts.minesGames} />
      </CardContent>
    </Card>
  )
}

export default DevGuildStatsCard
