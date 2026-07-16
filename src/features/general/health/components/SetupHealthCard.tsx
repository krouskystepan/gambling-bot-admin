import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react'

import Link from 'next/link'

import type { SetupHealthCheck } from '@/lib/overview/setupHealth'
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

const sortChecks = (checks: SetupHealthCheck[]) =>
  [...checks].sort((a, b) => {
    if (a.ok === b.ok) return 0
    return a.ok ? 1 : -1
  })

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

const HealthRow = ({ check }: { check: SetupHealthCheck }) => {
  const className = cn(
    'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm leading-snug',
    check.ok
      ? 'border-border/60 bg-muted/25 text-foreground'
      : 'border-border bg-muted/50 text-foreground',
    check.href && !check.ok && 'transition-colors hover:bg-accent/50'
  )

  const content = (
    <>
      <StatusIcon check={check} />
      <span className="min-w-0 flex-1">{check.label}</span>
    </>
  )

  if (check.href && !check.ok) {
    return (
      <Link href={check.href} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

const SetupHealthCard = ({ checks }: SetupHealthCardProps) => {
  const configChecks = sortChecks(checks.filter((check) => !check.warning))
  const rtpWarnings = sortChecks(checks.filter((check) => check.warning))
  const issues = checks.filter((check) => !check.ok)

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="pb-0">
        <CardTitle>Setup</CardTitle>
        <CardDescription>
          {issues.length === 0
            ? 'All required channels, roles, and settings look good.'
            : `${issues.length} item${issues.length === 1 ? '' : 's'} need attention`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-2 sm:grid-cols-2">
          {configChecks.map((check) => (
            <HealthRow key={check.id} check={check} />
          ))}
        </div>

        {rtpWarnings.length > 0 ? (
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Casino RTP warnings
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
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
