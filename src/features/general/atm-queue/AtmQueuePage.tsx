import { getServerSession } from 'next-auth'

import { getUserPermissions } from '@/actions/perms'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'
import { getGuildGlobalSettings } from '@/lib/guild/guildMoney.server'

import AtmQueueTable from './table/AtmQueueTable'
import { getAtmQueueData, normalizeAtmQueueSearchParams } from './useAtmQueue'

const AtmQueuePage = async ({
  guildId,
  searchParams
}: {
  guildId: string
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    filterStatus?: string
    filterType?: string
    dateFrom?: string
    dateTo?: string
    sort?: string
  }
}) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const query = normalizeAtmQueueSearchParams(searchParams)

  const [
    { requests, counts, total, guildMembers },
    globalSettings,
    { isAdmin }
  ] = await Promise.all([
    getAtmQueueData(guildId, session, query),
    getGuildGlobalSettings(guildId),
    getUserPermissions(guildId, session)
  ])

  return (
    <FeatureLayout title="ATM Queue">
      <AtmQueueTable
        guildId={guildId}
        globalSettings={globalSettings}
        isGuildAdmin={isAdmin}
        requests={requests}
        counts={counts}
        guildMembers={guildMembers}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default AtmQueuePage
