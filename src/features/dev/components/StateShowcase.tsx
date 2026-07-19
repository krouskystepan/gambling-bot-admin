'use client'

import BotNotInGuild from '@/components/states/BotNotInGuild'
import LoadFailed from '@/components/states/LoadFailed'
import LoadingScreen from '@/components/states/Loading'
import NoGuildSelected from '@/components/states/NoGuildSelected'
import NoPerms from '@/components/states/NoPerms'
import NotFoundBox from '@/components/states/NotFoundBox'
import OpeningGuild from '@/components/states/OpeningGuild'
import RateLimited from '@/components/states/RateLimmited'

const states = [
  { id: 'loading', label: 'Loading', Component: LoadingScreen },
  { id: 'opening-guild', label: 'Opening guild', Component: OpeningGuild },
  {
    id: 'bot-not-in-guild',
    label: 'Bot not in guild',
    Component: BotNotInGuild
  },
  {
    id: 'no-guild-selected',
    label: 'No guild selected',
    Component: NoGuildSelected
  },
  { id: 'no-perms', label: 'No permissions', Component: NoPerms },
  { id: 'not-found', label: 'Not found', Component: NotFoundBox },
  { id: 'load-failed', label: 'Load failed', Component: LoadFailed },
  { id: 'rate-limited', label: 'Rate limited', Component: RateLimited }
] as const

const StateShowcase = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {states.map(({ id, label, Component }) => (
        <div key={id} className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg border bg-background">
            <div className="scale-[0.72] *:min-h-0">
              <Component />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StateShowcase
