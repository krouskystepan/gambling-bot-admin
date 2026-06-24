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
          <Badge variant="outline">Deploy: {env.deployment}</Badge>
          <Badge variant="outline">NODE_ENV: {env.nodeEnv}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(env.variables).map(([name, isSet]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <code className="text-xs">{name}</code>
              <Badge variant={isSet ? 'secondary' : 'destructive'}>
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
