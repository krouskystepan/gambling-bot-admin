'use client'

import {
  Activity,
  Award,
  Banknote,
  Bot,
  Calculator,
  ChartBar,
  Crown,
  Database,
  Dices,
  FileBarChart,
  Globe,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  LucideIcon,
  MessagesSquare,
  ScrollText,
  Server,
  ShieldCheck,
  Ticket,
  User
} from 'lucide-react'

import { useSyncExternalStore } from 'react'

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
      { id: 'health', label: 'Health', icon: HeartPulse },
      { id: 'atm-queue', label: 'ATM Queue', icon: Banknote },
      { id: 'transactions', label: 'Transactions', icon: Landmark },
      { id: 'staff-actions', label: 'Staff actions', icon: ScrollText },
      { id: 'reports', label: 'Reports', icon: FileBarChart }
    ]
  },
  {
    title: 'Manage',
    value: 'manage',
    links: [
      { id: 'users', label: 'Users', icon: User },
      { id: 'predictions', label: 'Predictions', icon: ChartBar },
      { id: 'raffles', label: 'Raffles', icon: Ticket },
      { id: 'vips', label: 'VIPs', icon: Crown }
    ]
  },
  {
    title: 'Settings',
    value: 'settings',
    links: [
      { id: 'global-settings', label: 'Global', icon: Globe },
      { id: 'channel-settings', label: 'Channels', icon: MessagesSquare },
      { id: 'moderation-settings', label: 'Moderation', icon: ShieldCheck },
      { id: 'casino-settings', label: 'Casino', icon: Dices },
      { id: 'bonus-settings', label: 'Bonuses', icon: Award },
      { id: 'vip-settings', label: 'VIP', icon: Crown }
    ]
  },
  {
    title: 'Development',
    value: 'dev',
    links: [
      { id: 'dev', label: 'Overview', icon: Activity },
      { id: 'dev-system', label: 'System', icon: Server },
      { id: 'dev-guild', label: 'Guild data', icon: Database },
      { id: 'dev-discord', label: 'Discord', icon: Bot },
      { id: 'dev-calcs', label: 'Calcs lab', icon: Calculator },
      { id: 'dev-ui', label: 'UI kit', icon: LayoutTemplate }
    ]
  }
]

const SIDEBAR_SECTIONS_STORAGE_KEY = 'guild-config-sidebar-sections'
const DEFAULT_OPEN_SECTIONS = LINKS.map((group) => group.value)

type SidebarSectionsListener = () => void

let sidebarSectionsListeners: SidebarSectionsListener[] = []

const subscribeToSidebarSections = (listener: SidebarSectionsListener) => {
  sidebarSectionsListeners = [...sidebarSectionsListeners, listener]

  const onStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_SECTIONS_STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    sidebarSectionsListeners = sidebarSectionsListeners.filter(
      (item) => item !== listener
    )
    window.removeEventListener('storage', onStorage)
  }
}

const notifySidebarSectionsChange = () => {
  sidebarSectionsListeners.forEach((listener) => listener())
}

const readStoredOpenSections = (): string[] => {
  try {
    const raw = localStorage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY)
    if (!raw) return DEFAULT_OPEN_SECTIONS

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_OPEN_SECTIONS

    return parsed.filter(
      (value): value is string =>
        typeof value === 'string' && DEFAULT_OPEN_SECTIONS.includes(value)
    )
  } catch {
    return DEFAULT_OPEN_SECTIONS
  }
}

const serializeOpenSections = (sections: string[]) => sections.join(',')

const parseOpenSections = (serialized: string): string[] =>
  serialized === '' ? [] : serialized.split(',')

const getSidebarSectionsSnapshot = () =>
  serializeOpenSections(readStoredOpenSections())

const getSidebarSectionsServerSnapshot = () =>
  serializeOpenSections(DEFAULT_OPEN_SECTIONS)

const persistOpenSections = (sections: string[]) => {
  try {
    localStorage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify(sections))
  } catch {
    // Ignore quota or private-mode storage errors.
  }

  notifySidebarSectionsChange()
}

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
          {LINKS.map((group) => {
            if (group.title === 'Settings' && !isAdmin) return null
            if (group.title === 'Dev' && !isDev) return null

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
