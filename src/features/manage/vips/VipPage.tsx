import { getServerSession } from 'next-auth'

import { getVips } from '@/actions/database/vipActions.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import VipTable from './table/VipTable'

const VipPage = async ({ guildId }: { guildId: string }) => {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const vips = await getVips(guildId, session!)

  const query = {
    page: 1,
    limit: 5
  }

  const total = 5

  return (
    <FeatureLayout title={'VIPs Channels'}>
      <VipTable
        vips={vips}
        guildId={guildId}
        managerId={session.userId!}
        page={query.page}
        limit={query.limit}
        total={total}
      />
    </FeatureLayout>
  )
}

export default VipPage
