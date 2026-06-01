import { Dice5 } from 'lucide-react'

import Link from 'next/link'

import type { IGuild } from '@/types/types'

import { ThemeToggle } from '@/components/ThemeToggle'

import GuildRow from './GuildRow'

type DashboardSidebarProps = {
  guilds: IGuild[]
}

const DashboardSidebar = ({ guilds }: DashboardSidebarProps) => {
  return (
    <aside className="hide-scrollbar relative flex min-h-screen min-w-16 flex-1 grow-0 flex-col items-center overflow-y-scroll border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground">
      <Link
        href="/"
        className="mb-4 flex items-center justify-center rounded-lg p-1.5 text-primary transition hover:bg-sidebar-accent"
        title="Home"
      >
        <Dice5 className="size-7" />
      </Link>

      <div className="flex w-full flex-1 flex-col items-center gap-2 px-2">
        {guilds.map((guild) => (
          <GuildRow key={guild.id} guild={guild} />
        ))}
      </div>

      <div className="mt-auto flex w-full flex-col items-center border-t border-sidebar-border px-2 pt-3">
        <ThemeToggle
          variant="outline"
          className="border-sidebar-border bg-sidebar-accent/60 text-primary hover:bg-sidebar-accent hover:text-primary"
        />
      </div>
    </aside>
  )
}

export default DashboardSidebar
