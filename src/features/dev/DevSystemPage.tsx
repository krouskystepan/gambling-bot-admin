import FeatureLayout from '@/features/FeatureLayout'

import DevActionsPanel from './components/DevActionsPanel'
import DevEnvCard from './components/DevEnvCard'
import { DEV_SYSTEM_TOOLS } from './devTools'
import { requireDevPage } from './requireDevPage'

const DevSystemPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  return (
    <FeatureLayout title="System">
      <div className="space-y-6">
        <DevEnvCard />
        <DevActionsPanel
          guildId={guildId}
          title="System actions"
          description="Runtime, auth, database, and cache controls."
          tools={DEV_SYSTEM_TOOLS}
        />
      </div>
    </FeatureLayout>
  )
}

export default DevSystemPage
