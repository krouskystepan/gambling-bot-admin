import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getDevEnvStatus } from '@/lib/dev/devGuildDiagnostics'

const DevEnvCard = async () => {
  const env = await getDevEnvStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment</CardTitle>
        <CardDescription>
          Whether required variables are set. Values are never shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="max-w-full truncate">
            Deploy: {env.deployment}
          </Badge>
          <Badge variant="outline" className="max-w-full truncate">
            NODE_ENV: {env.nodeEnv}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(env.variables).map(([name, isSet]) => (
            <div
              key={name}
              className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <code className="min-w-0 flex-1 truncate text-xs" title={name}>
                {name}
              </code>
              <Badge
                variant={isSet ? 'secondary' : 'destructive'}
                className="shrink-0"
              >
                {isSet ? 'set' : 'missing'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default DevEnvCard
