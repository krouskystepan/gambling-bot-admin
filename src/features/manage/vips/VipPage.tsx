import { getServerSession } from 'next-auth'

import { getVips } from '@/actions/database/vipActions.action'
import FeatureLayout from '@/features/FeatureLayout'
import { authOptions } from '@/lib/authOptions'

import VipTable from './table/VipTable'

const VipPage = async ({ guildId }: { guildId: string }) => {
  const session = await getServerSession(authOptions)
  const vips = await getVips(guildId, session!)

  return (
    <FeatureLayout title={'VIPs Channels'}>
      <VipTable vips={vips} guildId={guildId} managerId={session!.userId!} />
    </FeatureLayout>
  )
}

export default VipPage
