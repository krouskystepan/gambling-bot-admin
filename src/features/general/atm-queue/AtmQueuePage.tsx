import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'
import { getGuildGlobalSettings } from '@/lib/guildMoney.server'

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

  const [{ requests, counts, total }, globalSettings] = await Promise.all([
    getAtmQueueData(guildId, session, query),
    getGuildGlobalSettings(guildId)
  ])

  return (
    <FeatureLayout title="ATM Queue">
      <AtmQueueTable
        guildId={guildId}
        globalSettings={globalSettings}
        requests={requests}
        counts={counts}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default AtmQueuePage
