'use client'

import { IGuild } from '@/types/types'

export default function GuildList({ guilds }: { guilds: IGuild[] }) {
  return (
    <ul>
      {guilds.map((g) => (
        <li key={g.id}>
          {g.name} ({g.id})
        </li>
      ))}
    </ul>
  )
}
