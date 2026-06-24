import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getDevChannelChecks } from '@/lib/dev/devGuildDiagnostics'

type DevChannelChecksCardProps = {
  guildId: string
}

const DevChannelChecksCard = async ({ guildId }: DevChannelChecksCardProps) => {
  const channels = await getDevChannelChecks(guildId)
  const missing = channels.filter(
    (channel) => channel.channelId && !channel.exists
  ).length
  const unset = channels.filter((channel) => !channel.channelId).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configured channels</CardTitle>
        <CardDescription>
          Channel IDs from guild config checked against Discord. {missing}{' '}
          missing, {unset} unset.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {channels.map((channel) => {
          const status = !channel.channelId
            ? 'unset'
            : channel.exists
              ? 'ok'
              : 'missing'

          return (
            <div
              key={channel.key}
              className="flex flex-col gap-1 rounded-lg border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{channel.key}</p>
                {channel.channelId ? (
                  <code className="text-xs text-muted-foreground break-all">
                    {channel.channelId}
                    {channel.name ? ` · ${channel.name}` : ''}
                  </code>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Not configured
                  </p>
                )}
              </div>
              <Badge
                variant={
                  status === 'ok'
                    ? 'secondary'
                    : status === 'unset'
                      ? 'outline'
                      : 'destructive'
                }
                className="w-fit shrink-0"
              >
                {status}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default DevChannelChecksCard
