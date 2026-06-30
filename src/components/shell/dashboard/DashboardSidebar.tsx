import { Dice5 } from 'lucide-react'

import Link from 'next/link'

import type { IGuild } from '@/types/types'

import DashboardSidebarFooter from './DashboardSidebarFooter'
import GuildRow from './GuildRow'

type DashboardSidebarProps = {
  guilds: IGuild[]
  userName: string | null
  userImage: string | null
}

const DashboardSidebar = ({
  guilds,
  userName,
  userImage
}: DashboardSidebarProps) => {
  return (
    <aside className="relative flex h-full min-h-0 w-16 shrink-0 flex-col items-center overflow-hidden border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground">
      <Link
        href="/"
        className="mb-4 flex shrink-0 items-center justify-center rounded-lg p-1.5 text-primary transition hover:bg-sidebar-accent"
        title="Home"
      >
        <Dice5 className="size-7" />
      </Link>

      <div className="hide-scrollbar flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
        {guilds.map((guild) => (
          <GuildRow key={guild.id} guild={guild} />
        ))}
      </div>

      <div className="flex w-full shrink-0 justify-center border-t border-sidebar-border px-2 pt-4">
        <DashboardSidebarFooter userName={userName} userImage={userImage} />
      </div>
    </aside>
  )
}

export default DashboardSidebar
