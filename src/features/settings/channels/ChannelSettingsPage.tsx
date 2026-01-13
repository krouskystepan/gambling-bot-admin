import { getChannels } from '@/actions/database/channels.action'
import { getGuildChannels } from '@/actions/discord/channel.action'
import FeatureLayout from '@/features/FeatureLayout'

import ChannelsSettingsForm from './ChannelsSettingsForm'

const ChannelSettingsPage = async ({ guildId }: { guildId: string }) => {
  const [guildChannels, channels] = await Promise.all([
    getGuildChannels(guildId),
    getChannels(guildId)
  ])

  return (
    <FeatureLayout title="Channel Settings">
      <ChannelsSettingsForm
        guildId={guildId}
        guildChannels={guildChannels}
        savedChannels={channels}
      />
    </FeatureLayout>
  )
}

export default ChannelSettingsPage
