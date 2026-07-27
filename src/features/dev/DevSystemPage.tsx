import FeatureLayout from '@/features/FeatureLayout'

import DevActionsPanel from './components/DevActionsPanel'
import DevEnvCard from './components/DevEnvCard'
import RuntimeInfoCard from './components/RuntimeInfoCard'
import { DEV_SYSTEM_TOOLS } from './devTools'
import { requireDevPage } from './requireDevPage'

const DevSystemPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  return (
    <FeatureLayout
      title="Platform"
      description="Runtime, environment, and platform-level actions"
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <RuntimeInfoCard />
          <DevEnvCard />
        </div>
        <DevActionsPanel
          guildId={guildId}
          title="Platform actions"
          description="Database, auth, cache, and page revalidation controls."
          tools={DEV_SYSTEM_TOOLS}
        />
      </div>
    </FeatureLayout>
  )
}

export default DevSystemPage
