import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import UserTable from './table/UserTable'
import { getUsersData, normalizeUsersSearchParams } from './useUsers'

const UsersPage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    sort?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const query = normalizeUsersSearchParams(searchParams)

  const { users } = await getUsersData(guildId, session, query)

  return (
    <FeatureLayout title={'Users'}>
      <UserTable users={users} guildId={guildId} managerId={session!.userId!} />
    </FeatureLayout>
  )
}

export default UsersPage
