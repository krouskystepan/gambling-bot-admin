import { getUserPermissions } from '@/actions/perms'
import FeatureLayout from '@/features/FeatureLayout'

import DevInfoCard from './components/DevInfoCard'
import DevSystemStatusCard from './components/DevSystemStatusCard'
import { requireDevPage } from './requireDevPage'

const DevOverviewPage = async ({ guildId }: { guildId: string }) => {
  const session = await requireDevPage(guildId)
  const userId = session.userId ?? ''
  const { isAdmin, isManager } = await getUserPermissions(guildId, session)

  return (
    <FeatureLayout title="Overview">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <DevInfoCard
          guildId={guildId}
          userId={userId}
          isAdmin={isAdmin}
          isManager={isManager}
          isDev
        />
        <DevSystemStatusCard guildId={guildId} />
      </div>
    </FeatureLayout>
  )
}

export default DevOverviewPage
