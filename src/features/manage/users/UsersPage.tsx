import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'
import { getGuildGlobalSettings } from '@/lib/guildMoney.server'

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

  const [{ users, total }, globalSettings] = await Promise.all([
    getUsersData(guildId, session, query),
    getGuildGlobalSettings(guildId)
  ])

  return (
    <FeatureLayout title={'Users'}>
      <UserTable
        globalSettings={globalSettings}
        users={users}
        guildId={guildId}
        managerId={session.userId!}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default UsersPage
