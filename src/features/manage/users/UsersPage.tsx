import { getServerSession } from 'next-auth'

import { getUserWithRegistrationStatus } from '@/actions/database/user.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import UserTable from './table/UserTable'

const UsersPage = async ({ guildId }: { guildId: string }) => {
  const session = await getServerSession(authOptions)
  const users = await getUserWithRegistrationStatus(guildId, session)

  return (
    <FeatureLayout title={'Users'}>
      <UserTable users={users} guildId={guildId} managerId={session!.userId!} />
    </FeatureLayout>
  )
}

export default UsersPage
