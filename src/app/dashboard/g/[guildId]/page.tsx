import { redirect } from 'next/navigation'

const GuildPage = async ({
  params
}: {
  params: Promise<{ guildId: string }>
}) => {
  const { guildId } = await params

  return redirect(`/dashboard/g/${guildId}/overview`)
}

export default GuildPage
