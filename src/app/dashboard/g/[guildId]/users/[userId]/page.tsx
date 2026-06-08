import { redirect } from 'next/navigation'

import { getUserPermissions } from '@/actions/perms'
import UserProfilePage from '@/features/manage/users/profile/UserProfilePage'
import { requireSession } from '@/lib/requireSession'

type UserProfileRouteProps = {
  params: Promise<{
    guildId: string
    userId: string
  }>
  searchParams: Promise<Record<string, string | undefined>>
}

const UserProfileRoute = async ({
  params,
  searchParams
}: UserProfileRouteProps) => {
  const { guildId, userId } = await params
  const resolvedSearchParams = await searchParams

  const session = await requireSession()
  const { isAdmin, isManager, rateLimited } = await getUserPermissions(
    guildId,
    session
  )

  if (rateLimited) {
    return null
  }

  if (!isAdmin && !isManager) {
    redirect('/dashboard')
  }

  return (
    <UserProfilePage
      guildId={guildId}
      userId={userId}
      searchParams={resolvedSearchParams}
    />
  )
}

export default UserProfileRoute
