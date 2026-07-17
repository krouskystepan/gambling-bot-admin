import UserProfilePage from '@/features/manage/users/profile/UserProfilePage'
import { DEMO_GUILD_ID } from '@/lib/presentation'

type PresentUserProfileProps = {
  params: Promise<{ userId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

const PresentUserProfileRoute = async ({
  params,
  searchParams
}: PresentUserProfileProps) => {
  const { userId } = await params
  const resolvedSearchParams = await searchParams

  return (
    <UserProfilePage
      guildId={DEMO_GUILD_ID}
      userId={userId}
      searchParams={resolvedSearchParams}
    />
  )
}

export default PresentUserProfileRoute
