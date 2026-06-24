import FeatureLayout from '@/features/FeatureLayout'

import DevActionsPanel from './components/DevActionsPanel'
import DevFeatureFlagsCard from './components/DevFeatureFlagsCard'
import DevGuildStatsCard from './components/DevGuildStatsCard'
import { DEV_GUILD_TOOLS } from './devTools'
import { requireDevPage } from './requireDevPage'

const DevGuildPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  return (
    <FeatureLayout title="Guild data">
      <div className="space-y-6">
        <DevGuildStatsCard guildId={guildId} />
        <DevFeatureFlagsCard guildId={guildId} />
        <DevActionsPanel
          guildId={guildId}
          title="Guild actions"
          description="Inspect config, transactions, health, and DB stats."
          tools={DEV_GUILD_TOOLS}
        />
      </div>
    </FeatureLayout>
  )
}

export default DevGuildPage
