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

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Connectivity</CardTitle>
        <CardDescription>
          Quick health check for database, Discord bot, and required env vars.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant={db.readyState === 1 ? 'default' : 'destructive'}>
          DB: {db.readyStateLabel}
          {db.pingMs != null ? ` (${db.pingMs}ms)` : ''}
        </Badge>
        <Badge variant={bot.inGuild ? 'default' : 'destructive'}>
          Bot: {bot.inGuild ? 'in guild' : 'not in guild'}
        </Badge>
        <Badge variant={missingEnv.length === 0 ? 'secondary' : 'destructive'}>
          Env: {missingEnv.length === 0 ? 'ok' : `${missingEnv.length} missing`}
        </Badge>
        <Badge variant="outline">Deploy: {env.deployment}</Badge>
        <Badge variant="outline">NODE_ENV: {env.nodeEnv}</Badge>
      </CardContent>
    </Card>
  )
}

export default DevSystemStatusCard
