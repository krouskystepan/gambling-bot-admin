'use client'

import { LucideIcon } from 'lucide-react'

import { useSyncExternalStore } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { GUILD_CONFIG_SIDEBAR_LINKS } from '@/components/shell/guild-config/guildConfigSidebarLinks'
import {
  getSidebarSectionsServerSnapshot,
  getSidebarSectionsSnapshot,
  parseOpenSections,
  persistOpenSections,
  subscribeToSidebarSections
} from '@/components/shell/guild-config/guildConfigSidebarSections'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const formatNotificationCount = (count: number) =>
  count >= 100 ? '99+' : String(count)

type GuildConfigSidebarProps = {
  guildId: string
  guildName: string
  isAdmin: boolean
  isManager: boolean
  isDev: boolean
  pendingAtmCount?: number
  needsAttentionCount?: number
}

const GuildConfigSidebar = ({
  guildId,
  guildName,
  isAdmin,
  isDev,
  pendingAtmCount = 0,
  needsAttentionCount = 0
}: GuildConfigSidebarProps) => {
  const pathname = usePathname()
  const activeSectionId = pathname.split('/')[4] || undefined
  const openSectionsSnapshot = useSyncExternalStore(
    subscribeToSidebarSections,
    getSidebarSectionsSnapshot,
    getSidebarSectionsServerSnapshot
  )
  const openSections = parseOpenSections(openSectionsSnapshot)

  const handleOpenSectionsChange = (value: string[]) => {
    persistOpenSections(value)
  }

  return (
    <section className="flex h-full min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="p-3 text-center text-lg font-bold text-primary">
        {guildName}
      </div>

      <aside className="flex flex-1 flex-col overflow-y-auto p-3">
        <Accordion
          type="multiple"
          className="flex flex-col gap-3"
          value={openSections}
          onValueChange={handleOpenSectionsChange}
        >
          {GUILD_CONFIG_SIDEBAR_LINKS.map((group) => {
            if (group.value === 'settings' && !isAdmin) return null
            if (group.value === 'dev' && !isDev) return null

            return (
              <AccordionItem
                key={group.value}
                value={group.value}
                className="border-none"
              >
                <AccordionTrigger className="cursor-pointer px-3 py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:no-underline hover:text-foreground focus-visible:ring-inset">
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
                          'relative flex items-center gap-2 rounded px-5 py-2 text-sm text-sidebar-foreground transition outline-none hover:bg-sidebar-accent hover:text-sidebar-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset',
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
                          <Badge
                            variant="destructive"
                            className="ml-auto min-w-8 justify-center tabular-nums"
                          >
                            {formatNotificationCount(pendingAtmCount)}
                          </Badge>
                        ) : null}
                        {link.id === 'health' && needsAttentionCount > 0 ? (
                          <Badge
                            variant="destructive"
                            className="ml-auto min-w-8 justify-center tabular-nums"
                          >
                            {formatNotificationCount(needsAttentionCount)}
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
