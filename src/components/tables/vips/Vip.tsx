import { getServerSession } from 'next-auth'

import { getVips } from '@/actions/database/vipActions.action'
import { authOptions } from '@/lib/authOptions'

import VipTable from './VipTable'

const Vips = async ({ guildId }: { guildId: string }) => {
  const session = await getServerSession(authOptions)
  const vips = await getVips(guildId, session!)

  return (
    <div>
      <h4 className="mb-4 text-3xl font-semibold text-yellow-400">
        VIPs Channels
      </h4>

      <VipTable vips={vips} guildId={guildId} managerId={session!.userId!} />
    </div>
  )
}

export default Vips
