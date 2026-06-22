import { getServerSession } from 'next-auth'

import { getUserPermissions } from '@/actions/perms'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

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
    registration?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const query = normalizeUsersSearchParams(searchParams)

  const [
    { users, total, guildMembers, registeredUserIds },
    globalSettings,
    { isAdmin }
  ] = await Promise.all([
    getUsersData(guildId, session, query),
    getGuildGlobalSettings(guildId),
    getUserPermissions(guildId, session)
  ])

  return (
    <FeatureLayout title={'Users'}>
      <UserTable
        globalSettings={globalSettings}
        isGuildAdmin={isAdmin}
        users={users}
        guildId={guildId}
        managerId={session.userId!}
        registration={query.registration}
        guildMembers={guildMembers}
        registeredUserIds={registeredUserIds}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default UsersPage
