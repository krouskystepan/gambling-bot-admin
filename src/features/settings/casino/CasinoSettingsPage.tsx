import { defaultCasinoSettings } from 'gambling-bot-shared'

import { getCasinoSettings } from '@/actions/database/casinoSettings.action'
import FeatureLayout from '@/features/FeatureLayout'
import { TCasinoSettingsValues } from '@/types/types'

import CasinoSettingsForm from './CasinoSettingsForm'

const CasinoSettingsPage = async ({ guildId }: { guildId: string }) => {
  const savedSettings =
    (await getCasinoSettings(guildId)) ??
    (defaultCasinoSettings as TCasinoSettingsValues)

  return (
    <FeatureLayout title="Casino Settings">
      <CasinoSettingsForm guildId={guildId} savedSettings={savedSettings} />
    </FeatureLayout>
  )
}

export default CasinoSettingsPage
