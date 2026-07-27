import { getUserPermissions } from '@/actions/perms'
import FeatureLayout from '@/features/FeatureLayout'
import { requireSession } from '@/lib/auth/requireSession'
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
  const session = await requireSession()

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
    <FeatureLayout
      title="ATM Queue"
      description="Pending ATM withdraw/deposit requests to review"
    >
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
