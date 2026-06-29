import FeatureLayout from '@/features/FeatureLayout'

import DevActionsPanel from './components/DevActionsPanel'
import DevChannelChecksCard from './components/DevChannelChecksCard'
import DevFeatureFlagsCard from './components/DevFeatureFlagsCard'
import DevGuildStatsCard from './components/DevGuildStatsCard'
import DevSectionHeading from './components/DevSectionHeading'
import { DEV_DISCORD_TOOLS, DEV_GUILD_TOOLS } from './devTools'
import { requireDevPage } from './requireDevPage'

const DevGuildPage = async ({ guildId }: { guildId: string }) => {
  await requireDevPage(guildId)

  return (
    <FeatureLayout title="Guild">
      <div className="space-y-8">
        <section className="space-y-4">
          <DevSectionHeading
            title="Collections"
            description="Document counts for this guild in MongoDB."
          />
          <DevGuildStatsCard guildId={guildId} />
        </section>

        <section className="space-y-4">
          <DevSectionHeading
            title="Feature flags"
            description="Global settings switches affecting panel and bot behaviour."
          />
          <DevFeatureFlagsCard guildId={guildId} />
        </section>

        <section className="space-y-4">
          <DevSectionHeading
            title="Discord channels"
            description="Configured channel IDs checked against the live Discord API."
          />
          <DevChannelChecksCard guildId={guildId} />
        </section>

        <DevActionsPanel
          guildId={guildId}
          title="Guild inspection"
          description="Dump config, transactions, health snapshots, and DB stats."
          tools={DEV_GUILD_TOOLS}
        />

        <DevActionsPanel
          guildId={guildId}
          title="Discord inspection"
          description="Fetch guild metadata and re-run channel verification."
          tools={DEV_DISCORD_TOOLS}
        />
      </div>
    </FeatureLayout>
  )
}

export default DevGuildPage
