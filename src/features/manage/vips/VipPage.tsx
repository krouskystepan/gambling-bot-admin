import { getServerSession } from 'next-auth'

import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import VipTable from './table/VipTable'
import { getVipsData, normalizeVipsSearchParams } from './useVips'

const VipPage = async ({
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

  const query = normalizeVipsSearchParams(searchParams)
  const { vips, total } = await getVipsData(guildId, session, query)

  return (
    <FeatureLayout title={'VIPs Channels'}>
      <VipTable
        guildId={guildId}
        vips={vips}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default VipPage
