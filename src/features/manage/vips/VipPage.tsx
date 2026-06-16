import { getServerSession } from 'next-auth'

import { getVipPageContext } from '@/actions/database/vipActions.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/auth/authOptions'

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
  const [{ vips, total }, pageContext] = await Promise.all([
    getVipsData(guildId, session, query),
    getVipPageContext(guildId)
  ])

  if (!pageContext) return null

  return (
    <FeatureLayout title={'VIPs Channels'}>
      <VipTable
        guildId={guildId}
        vips={vips}
        page={query.page}
        limit={query.limit}
        total={total}
        maxMembers={pageContext.maxMembers}
        vipConfigured={pageContext.vipConfigured}
        vipFeatureBlocked={pageContext.vipFeatureBlocked}
        vipFeatureBlockMessage={pageContext.vipFeatureBlockMessage}
        activeVipOwnerIds={pageContext.activeVipOwnerIds}
        members={pageContext.members}
      />
    </FeatureLayout>
  )
}

export default VipPage
