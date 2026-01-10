import { getServerSession } from 'next-auth'

import { getUserWithRegistrationStatus } from '@/actions/database/user.action'
import { authOptions } from '@/lib/authOptions'

import UserTable from '../tables/users/UserTable'

const UsersSection = async ({ guildId }: { guildId: string }) => {
  const session = await getServerSession(authOptions)
  const users = await getUserWithRegistrationStatus(guildId, session)

  return (
    <div>
      <h4 className="mb-4 text-3xl font-semibold text-yellow-400">Users</h4>

      <UserTable users={users} guildId={guildId} managerId={session!.userId!} />
    </div>
  )
}

export default UsersSection
