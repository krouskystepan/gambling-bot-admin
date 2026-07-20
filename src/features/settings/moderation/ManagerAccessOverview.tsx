'use client'

import { Bot, Monitor, ShieldCheck } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { type PermissionItem, PermissionTabPanel } from './permissionPanel'

const PANEL_ALLOWED: PermissionItem[] = [
  { id: 'panel-overview', label: 'Overview KPIs, charts, and top users' },
  {
    id: 'panel-health',
    label: 'Health (runtime operations; setup checks for admins)'
  },
  { id: 'panel-transactions', label: 'Transaction history' },
  { id: 'panel-staff-actions', label: 'Staff actions audit log' },
  { id: 'panel-users', label: 'Register users, balances, and bans' },
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
    label: 'Settings (channels, casino, bonuses, VIP, moderation)'
  },
  {
    id: 'panel-no-settings-changes',
    label: 'Settings changes audit log'
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

const ManagerAccessOverview = () => {
  return (
    <Card className="min-w-0 gap-4 py-4">
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
