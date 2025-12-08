import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { Dice5 } from 'lucide-react'
import Link from 'next/link'
import { getUserGuilds } from '@/actions/discord/guilds.action'
import GuildRow from './GuildRow'
import { redirect } from 'next/navigation'

const DashboardSidebar = async () => {
  const session = await getServerSession(authOptions)

  // refresh selhal → redirect na login
  if (!session?.accessToken || session?.error) {
    redirect('/login')
  }

  const guilds = await getUserGuilds(session)

  return (
    <aside className="relative flex flex-col min-w-16 flex-1 grow-0 min-h-screen bg-black/70 border-r border-yellow-500/10 py-4 gap-4 items-center overflow-y-scroll hide-scrollbar">
      <Link
        href={'/'}
        className="text-xl font-extrabold text-yellow-400 mb-1 flex items-center justify-center hover:scale-110 transition duration-300"
      >
        <Dice5 className="w-8 h-8 text-yellow-400" />
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
