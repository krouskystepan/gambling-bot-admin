'use client'

import {
  Award,
  ChartBar,
  Crown,
  Dices,
  Home,
  Landmark,
  LucideIcon,
  MessagesSquare,
  ShieldCheck,
  User
} from 'lucide-react'
import { undefined } from 'zod'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  {
    title: 'General',
    links: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'transactions', label: 'Transactions', icon: Landmark }
    ]
  },
  {
    title: 'Manage',
    links: [
      { id: 'users', label: 'Users', icon: User }
      // { id: 'vips', label: 'VIPs', icon: Crown },
      // { id: 'predictions', label: 'Predictions', icon: ChartBar }
    ]
  },
  {
    title: 'Settings',
    links: [
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
}

const GuildConfigSidebar = ({
  guildId,
  guildName,
  isAdmin
}: GuildConfigSidebarProps) => {
  const pathname = usePathname()
  const activeSectionId = pathname.split('/')[4] || undefined

  return (
    <section className="flex w-60 flex-col border-r border-yellow-500/10 bg-black/40">
      <div className="p-3 text-center text-lg font-bold text-yellow-400">
        {guildName}
      </div>

      <aside className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {LINKS.map((group) => {
          if (group.title === 'Settings' && !isAdmin) return null

          return (
            <div key={group.title} className="flex flex-col gap-1">
              <div className="px-3 py-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                {group.title}
              </div>

              {group.links.map((link) => {
                const Icon = link.icon as LucideIcon
                return (
                  <Link
                    key={link.id}
                    href={`/dashboard/g/${guildId}/${link.id}`}
                    className="relative flex items-center gap-2 overflow-hidden rounded px-5 py-2 text-sm text-gray-200 transition hover:bg-yellow-500/10 hover:text-yellow-400"
                  >
                    {activeSectionId === link.id ||
                    (link.id === 'home' && activeSectionId === undefined) ? (
                      <div className="absolute left-0 h-full w-0.5 bg-yellow-400" />
                    ) : null}
                    {Icon && <Icon size={16} />}
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </aside>
    </section>
  )
}

export default GuildConfigSidebar
