import GuildLandingRedirect from '@/components/shell/dashboard/GuildLandingRedirect'

const GuildPage = async ({
  params
}: {
  params: Promise<{ guildId: string }>
}) => {
  const { guildId } = await params

  return <GuildLandingRedirect guildId={guildId} />
}

export default GuildPage
