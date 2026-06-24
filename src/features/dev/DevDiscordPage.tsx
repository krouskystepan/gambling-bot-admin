import FeatureLayout from '@/features/FeatureLayout'

import DevActionsPanel from './components/DevActionsPanel'
import DevChannelChecksCard from './components/DevChannelChecksCard'
import { DEV_DISCORD_TOOLS } from './devTools'
import { requireDevPage } from './requireDevPage'

const DevDiscordPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  return (
    <FeatureLayout title="Discord">
      <div className="space-y-6">
        <DevChannelChecksCard guildId={guildId} />
        <DevActionsPanel
          guildId={guildId}
          title="Discord actions"
          description="Fetch guild metadata and re-run channel verification."
          tools={DEV_DISCORD_TOOLS}
        />
      </div>
    </FeatureLayout>
  )
}

export default DevDiscordPage
