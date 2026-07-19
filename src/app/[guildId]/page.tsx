import { notFound } from 'next/navigation'

import GuildLandingRedirect from '@/components/shell/dashboard/GuildLandingRedirect'
import { getSessionOrNull } from '@/lib/auth/requireSession'

type PublicGuildPageProps = {
  params: Promise<{ guildId: string }>
}

const PublicGuildPage = async ({ params }: PublicGuildPageProps) => {
  const { guildId } = await params
  const session = await getSessionOrNull()

  if (!session) {
    notFound()
  }

  return <GuildLandingRedirect guildId={guildId} />
}

export default PublicGuildPage
