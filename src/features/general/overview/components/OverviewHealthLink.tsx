import { ChevronRight, HeartPulse } from 'lucide-react'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'

import Link from 'next/link'

import { getHealthAttentionCount } from '@/actions/database/health.action'
import { getUserPermissions } from '@/actions/perms'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { authOptions } from '@/lib/auth/authOptions'
import { guildBasePath } from '@/lib/guild/guildBasePath'
import { isDemoGuild } from '@/lib/presentation'

const OverviewHealthLink = async ({ guildId }: { guildId: string }) => {
  // The demo is public (no Discord session), so only require a session for real
  // guilds. Demo health data ignores the session anyway.
  const demo = isDemoGuild(guildId)
  const session = demo ? null : await getServerSession(authOptions)
  if (!demo && !session) return null

  const [attentionCount, { isAdmin }] = await Promise.all([
    getHealthAttentionCount(guildId, session as Session),
    getUserPermissions(guildId, session)
  ])

  if (attentionCount === 0) return null

  const healthHref = `${guildBasePath(guildId)}/health`
  const scope = isAdmin ? 'operations and setup' : 'operations'

  return (
    <Link
      href={healthHref}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="py-4 transition-colors group-hover:bg-accent/40">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartPulse size={18} aria-hidden />
            </div>
            <div className="min-w-0">
              <CardTitle>Health</CardTitle>
              <CardDescription>
                {attentionCount}{' '}
                {attentionCount === 1 ? 'item needs' : 'items need'} attention
                across {scope}.
              </CardDescription>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            View
            <ChevronRight size={16} aria-hidden />
          </span>
        </CardHeader>
      </Card>
    </Link>
  )
}

export default OverviewHealthLink
