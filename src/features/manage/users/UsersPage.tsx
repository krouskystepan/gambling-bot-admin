import { getUserPermissions } from '@/actions/perms'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'
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
    banStatus?: string
  }
}) => {
  const session = await requireSession()

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
        banStatus={query.banStatus}
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
