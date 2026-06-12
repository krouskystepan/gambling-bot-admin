'use client'

import {
  Award,
  Banknote,
  Crown,
  Dices,
  FileBarChart,
  Globe,
  Landmark,
  LayoutDashboard,
  LucideIcon,
  MessagesSquare,
  ShieldCheck,
  User
} from 'lucide-react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LINKS = [
  {
    title: 'General',
    value: 'general',
    links: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'reports', label: 'Reports', icon: FileBarChart },
      { id: 'transactions', label: 'Transactions', icon: Landmark },
      { id: 'atm-queue', label: 'ATM Queue', icon: Banknote }
    ]
  },
  {
    title: 'Manage',
    value: 'manage',
    links: [
      { id: 'users', label: 'Users', icon: User },
      { id: 'vips', label: 'VIPs', icon: Crown }
      // { id: 'predictions', label: 'Predictions', icon: ChartBar }
    ]
  },
  {
    title: 'Settings',
    value: 'settings',
    links: [
      { id: 'global-settings', label: 'Global', icon: Globe },
      { id: 'channel-settings', label: 'Channels', icon: MessagesSquare },
      { id: 'manager-settings', label: 'Manager', icon: ShieldCheck },
      { id: 'vip-settings', label: 'VIP', icon: Crown },
      { id: 'bonus-settings', label: 'Bonuses', icon: Award },
      { id: 'casino-settings', label: 'Casino', icon: Dices }
    ]
  }
]

type GuildConfigSidebarProps = {
  guildId: string
  guildName: string
  isAdmin: boolean
  isManager: boolean
  pendingAtmCount?: number
}

const GuildConfigSidebar = ({
  guildId,
  guildName,
  isAdmin,
  pendingAtmCount = 0
}: GuildConfigSidebarProps) => {
  const pathname = usePathname()
  const activeSectionId = pathname.split('/')[4] || undefined

  return (
    <section className="flex h-full min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="p-3 text-center text-lg font-bold text-primary">
        {guildName}
      </div>

      <aside className="flex flex-1 flex-col overflow-y-auto p-3">
        <Accordion
          type="multiple"
          className="flex flex-col gap-3"
          defaultValue={LINKS.map((g) => g.value)}
        >
          {LINKS.map((group) => {
            if (group.title === 'Settings' && !isAdmin) return null

            return (
              <AccordionItem
                key={group.value}
                value={group.value}
                className="border-none"
              >
                <AccordionTrigger className="cursor-pointer px-3 py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:no-underline hover:text-foreground">
                  {group.title}
                </AccordionTrigger>

                <AccordionContent className="flex flex-col gap-1 pt-1 pb-0">
                  {group.links.map((link) => {
                    const Icon = link.icon as LucideIcon
                    const isActive =
                      activeSectionId === link.id ||
                      (link.id === 'overview' && activeSectionId === undefined)

                    return (
                      <Link
                        key={link.id}
                        href={`/dashboard/g/${guildId}/${link.id}`}
                        className={cn(
                          'relative flex items-center gap-2 overflow-hidden rounded px-5 py-2 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-primary',
                          isActive &&
                            'bg-sidebar-accent/50 text-sidebar-primary'
                        )}
                      >
                        {isActive ? (
                          <div className="absolute left-0 h-full w-0.5 bg-primary" />
                        ) : null}

                        <Icon size={16} />
                        <span className="flex-1">{link.label}</span>
                        {link.id === 'atm-queue' && pendingAtmCount > 0 ? (
                          <Badge variant="destructive" className="ml-auto">
                            {pendingAtmCount}
                          </Badge>
                        ) : null}
                      </Link>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </aside>
    </section>
  )
}

export default GuildConfigSidebar
