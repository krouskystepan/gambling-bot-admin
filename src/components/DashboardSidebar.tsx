import { Dice5 } from 'lucide-react'
import { getServerSession } from 'next-auth'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getUserGuilds } from '@/actions/discord/guilds.action'
import { authOptions } from '@/lib/authOptions'

import GuildRow from './GuildRow'

const DashboardSidebar = async () => {
  const session = await getServerSession(authOptions)

  // refresh selhal → redirect na login
  if (!session?.accessToken || session?.error) {
    redirect('/login')
  }

  const guilds = await getUserGuilds(session)

  return (
    <aside className="hide-scrollbar relative flex min-h-screen min-w-16 flex-1 grow-0 flex-col items-center gap-4 overflow-y-scroll border-r border-yellow-500/10 bg-black/70 py-4">
      <Link
        href={'/'}
        className="mb-1 flex items-center justify-center text-xl font-extrabold text-yellow-400 transition duration-300 hover:scale-110"
      >
        <Dice5 className="h-8 w-8 text-yellow-400" />
      </Link>

      <div className="flex flex-col gap-2">
        {guilds.map((guild) => (
          <GuildRow key={guild.id} guild={guild} />
        ))}
      </div>
    </aside>
  )
}

export default DashboardSidebar
