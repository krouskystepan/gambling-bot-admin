import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  getDevBotPresence,
  getDevDatabaseStatus,
  getDevEnvStatus
} from '@/lib/dev/devGuildDiagnostics'

import CopyableCode from './CopyableCode'
import DevCardRow from './DevCardRow'

type DevSystemStatusCardProps = {
  guildId: string
}

const DevSystemStatusCard = async ({ guildId }: DevSystemStatusCardProps) => {
  const [db, bot, env] = await Promise.all([
    getDevDatabaseStatus(),
    getDevBotPresence(guildId),
    getDevEnvStatus()
  ])

  const missingEnv = Object.entries(env.variables).filter(([, set]) => !set)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const serverTime = new Date().toLocaleString('en-GB', { hour12: false })
  const dbLabel = `${db.readyStateLabel}${db.pingMs != null ? ` (${db.pingMs}ms)` : ''}`

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Connectivity</CardTitle>
        <CardDescription>
          Quick health check for database, Discord bot, and required env vars.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={db.readyState === 1 ? 'default' : 'destructive'}>
            DB: {dbLabel}
          </Badge>
          <Badge variant={bot.inGuild ? 'default' : 'destructive'}>
            Bot: {bot.inGuild ? 'in guild' : 'not in guild'}
          </Badge>
          <Badge
            variant={missingEnv.length === 0 ? 'secondary' : 'destructive'}
          >
            Env:{' '}
            {missingEnv.length === 0 ? 'ok' : `${missingEnv.length} missing`}
          </Badge>
        </div>

        {db.host ? (
          <DevCardRow label="Database host">
            <CopyableCode
              value={[db.host, db.name].filter(Boolean).join(' / ')}
            />
          </DevCardRow>
        ) : null}

        <DevCardRow label="Required variables">
          <div className="grid grid-cols-1 gap-1.5">
            {Object.entries(env.variables).map(([name, isSet]) => (
              <div
                key={name}
                className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5"
              >
                <code className="min-w-0 flex-1 truncate text-xs" title={name}>
                  {name}
                </code>
                <Badge
                  variant={isSet ? 'secondary' : 'destructive'}
                  className="shrink-0 text-[10px]"
                >
                  {isSet ? 'set' : 'missing'}
                </Badge>
              </div>
            ))}
          </div>
        </DevCardRow>

        <DevCardRow label="Deployment">
          <CopyableCode value={env.deployment} />
        </DevCardRow>

        <DevCardRow label="Node env">
          <CopyableCode value={env.nodeEnv} />
        </DevCardRow>

        <DevCardRow label="Server time">
          <CopyableCode value={`${serverTime} (${timezone})`} />
        </DevCardRow>
      </CardContent>
    </Card>
  )
}

export default DevSystemStatusCard
