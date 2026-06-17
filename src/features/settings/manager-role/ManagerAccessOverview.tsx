'use client'

import { Bot, Check, Monitor, ShieldCheck, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type PermissionItem = { id: string; label: string }

const PANEL_ALLOWED: PermissionItem[] = [
  { id: 'panel-overview', label: 'Overview KPIs, charts, and top users' },
  {
    id: 'panel-health',
    label: 'Health (runtime operations; setup checks for admins)'
  },
  { id: 'panel-transactions', label: 'Transaction history' },
  { id: 'panel-users', label: 'Register users and manage balances' },
  { id: 'panel-predictions', label: 'Prediction events' },
  { id: 'panel-raffles', label: 'Raffle events' },
  { id: 'panel-vips', label: 'VIP memberships' }
]

const PANEL_DENIED: PermissionItem[] = [
  {
    id: 'panel-no-setup-health',
    label: 'Setup section on Health (channels, roles, RTP)'
  },
  {
    id: 'panel-no-settings',
    label: 'Settings (channels, casino, bonuses, VIP, manager)'
  },
  {
    id: 'panel-no-config',
    label: 'Guild configuration and bot defaults'
  }
]

const DISCORD_ALLOWED: PermissionItem[] = [
  { id: 'discord-balance', label: 'Balance adjustments (/manage-balance)' },
  { id: 'discord-vip', label: 'VIP management (/manage-vip)' },
  { id: 'discord-events', label: 'Prediction and raffle events' },
  {
    id: 'discord-atm-pings',
    label: 'Pinged on ATM deposit and withdraw requests'
  }
]

const DISCORD_DENIED: PermissionItem[] = [
  {
    id: 'discord-no-setup',
    label:
      'Bot setup (/setup-manager, /setup-atm, /setup-casino, /setup-vip, …)'
  },
  {
    id: 'discord-no-force-auth',
    label: 'Force register or unregister (/force-register, /force-unregister)'
  },
  {
    id: 'discord-no-diagnostics',
    label: 'Casino diagnostics (/casino-info)'
  },
  {
    id: 'discord-no-lookup',
    label: 'Staff lookup utilities (/who-is, /role-info)'
  }
]

type PermissionBoxProps = {
  variant: 'allowed' | 'denied'
  items: readonly PermissionItem[]
}

function PermissionBox({ variant, items }: PermissionBoxProps) {
  const isAllowed = variant === 'allowed'
  const Icon = isAllowed ? Check : X

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col rounded-lg border p-3',
        isAllowed
          ? 'border-emerald-500/25 bg-emerald-500/5'
          : 'border-destructive/25 bg-destructive/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-medium',
            isAllowed
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          )}
        >
          {isAllowed ? 'Allowed' : 'Not allowed'}
        </Badge>
      </div>
      <ul className="space-y-2.5">
        {items.map(({ id, label }) => (
          <li
            key={id}
            className="flex items-start gap-2.5 text-sm leading-snug"
          >
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                isAllowed
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-destructive/80'
              )}
              aria-hidden
            />
            <span className={cn(!isAllowed && 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PermissionTabPanel({
  allowed,
  denied
}: {
  allowed: readonly PermissionItem[]
  denied: readonly PermissionItem[]
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PermissionBox variant="allowed" items={allowed} />
      <PermissionBox variant="denied" items={denied} />
    </div>
  )
}

const ManagerAccessOverview = () => {
  return (
    <Card className="min-w-0 gap-4 py-4 lg:sticky lg:top-4">
      <CardHeader className="gap-3 pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4" />
          Manager permissions
        </CardTitle>
        <CardDescription>
          Operational access for the assigned role. Server admins (Manage
          Server) keep full configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Tabs defaultValue="panel" className="gap-4">
          <TabsList className="grid h-10 w-full grid-cols-2">
            <TabsTrigger value="panel" className="gap-2">
              <Monitor className="size-4" />
              Admin panel
            </TabsTrigger>
            <TabsTrigger value="discord" className="gap-2">
              <Bot className="size-4" />
              Discord bot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panel" className="mt-0">
            <PermissionTabPanel allowed={PANEL_ALLOWED} denied={PANEL_DENIED} />
          </TabsContent>

          <TabsContent value="discord" className="mt-0">
            <PermissionTabPanel
              allowed={DISCORD_ALLOWED}
              denied={DISCORD_DENIED}
            />
          </TabsContent>
        </Tabs>

        <Separator />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Admins can assign the manager role with{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            /setup-manager
          </code>
          . Managers cannot run setup commands.
        </p>
      </CardContent>
    </Card>
  )
}

export default ManagerAccessOverview
