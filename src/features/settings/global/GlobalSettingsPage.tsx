import { getGlobalSettings } from '@/actions/database/globalSettings.action'
import FeatureLayout from '@/features/FeatureLayout'

import GlobalSettingsForm from './GlobalSettingsForm'

const GlobalSettingsPage = async ({ guildId }: { guildId: string }) => {
  const savedSettings = await getGlobalSettings(guildId)

  return (
    <FeatureLayout title="Global Settings">
      <GlobalSettingsForm guildId={guildId} savedSettings={savedSettings} />
    </FeatureLayout>
  )
}

export default GlobalSettingsPage
