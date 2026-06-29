'use client'

import { Ban, Bot } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { type PermissionItem, PermissionTabPanel } from './permissionPanel'

const DISCORD_ALLOWED: PermissionItem[] = [
  { id: 'discord-balance', label: 'View balance (/balance)' },
  { id: 'discord-vip-info', label: 'View VIP room info (/vip info)' }
]

const DISCORD_DENIED: PermissionItem[] = [
  { id: 'discord-casino', label: 'Casino games (commands and buttons)' },
  { id: 'discord-atm', label: 'ATM deposits and withdraws' },
  { id: 'discord-bonus', label: 'Daily bonus (/bonus)' },
  { id: 'discord-predictions', label: 'Prediction bets' },
  { id: 'discord-raffles', label: 'Raffle entries' },
  {
    id: 'discord-vip-actions',
    label: 'VIP purchases, extensions, and member adds'
  }
]

const BannedAccessOverview = () => {
  return (
    <Card className="min-w-0 gap-4 py-4">
      <CardHeader className="gap-3 pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ban className="size-4" />
          Banned player restrictions
        </CardTitle>
        <CardDescription>
          Economy ban blocks spending and betting in Discord. Players see a
          generic restriction message; staff notes stay private.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Bot className="size-4" />
          Discord bot
        </div>

        <PermissionTabPanel allowed={DISCORD_ALLOWED} denied={DISCORD_DENIED} />

        <Separator />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Ban and unban from the users table or a user profile. When a banned
          role is configured, the bot assigns it on ban and removes it on unban.
        </p>
      </CardContent>
    </Card>
  )
}

export default BannedAccessOverview
