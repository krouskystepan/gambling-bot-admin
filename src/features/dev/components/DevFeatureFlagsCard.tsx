import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { getDevFeatureFlags } from '@/lib/dev/devGuildDiagnostics'

type DevFeatureFlagsCardProps = {
  guildId: string
}

const DevFeatureFlagsCard = async ({ guildId }: DevFeatureFlagsCardProps) => {
  const flags = await getDevFeatureFlags(guildId)
  const disabledCount = flags.filter((flag) => flag.disabled).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature flags</CardTitle>
        <CardDescription>
          Global settings switches affecting panel and bot behaviour.{' '}
          {disabledCount} disabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <Badge
            key={flag.feature}
            variant={flag.disabled ? 'destructive' : 'secondary'}
          >
            {flag.feature}: {flag.disabled ? 'off' : 'on'}
          </Badge>
        ))}
      </CardContent>
    </Card>
  )
}

export default DevFeatureFlagsCard
