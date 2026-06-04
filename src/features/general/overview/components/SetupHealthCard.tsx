import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react'

import Link from 'next/link'

import type { SetupHealthCheck } from '@/actions/database/overview.action'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SetupHealthCardProps = {
  checks: SetupHealthCheck[]
}

const StatusIcon = ({ check }: { check: SetupHealthCheck }) => {
  if (check.ok) {
    return <CheckCircle2 size={16} className="shrink-0 text-green-600" />
  }
  if (check.warning) {
    return (
      <TriangleAlert
        size={16}
        className={cn(
          'shrink-0',
          check.rtpStatus === 'high' ? 'text-destructive' : 'text-brand'
        )}
      />
    )
  }
  return <XCircle size={16} className="shrink-0 text-destructive" />
}

const rowClassName =
  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm leading-snug text-foreground'

const HealthRow = ({
  check,
  className
}: {
  check: SetupHealthCheck
  className?: string
}) => {
  if (check.href && !check.ok) {
    return (
      <Link
        href={check.href}
        className={cn(
          rowClassName,
          'transition-colors hover:bg-accent/50',
          className
        )}
      >
        <StatusIcon check={check} />
        <span className="min-w-0 flex-1">{check.label}</span>
      </Link>
    )
  }

  return (
    <div className={cn(rowClassName, className)}>
      <StatusIcon check={check} />
      <span className="min-w-0 flex-1">{check.label}</span>
    </div>
  )
}

const SetupHealthCard = ({ checks }: SetupHealthCardProps) => {
  const configChecks = checks.filter((check) => !check.warning)
  const rtpWarnings = checks.filter((check) => check.warning)
  const issues = checks.filter((check) => !check.ok)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup health</CardTitle>
        <CardDescription>
          {issues.length === 0
            ? 'All required configuration looks good.'
            : `${issues.length} item${issues.length === 1 ? '' : 's'} need attention`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Configuration
          </h4>
          <div className="grid gap-0.5 sm:grid-cols-2">
            {configChecks.map((check) => (
              <HealthRow key={check.id} check={check} />
            ))}
          </div>
        </div>

        {rtpWarnings.length > 0 ? (
          <div className="border-t border-border pt-6">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Casino RTP warnings
            </h4>
            <div className="grid gap-0.5 sm:grid-cols-2">
              {rtpWarnings.map((check) => (
                <HealthRow key={check.id} check={check} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default SetupHealthCard
